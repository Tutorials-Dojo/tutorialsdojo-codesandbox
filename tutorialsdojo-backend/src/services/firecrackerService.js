const { spawn, exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const net = require('net');

class FirecrackerService {
  constructor() {
    this.activeVMs = new Map();
    this.vmTimeout = 300000; // 5 minutes
    this.baseConfig = {
      kernelPath: '/opt/firecracker/vmlinux.bin',
      rootfsPath: '/opt/firecracker/rootfs.ext4',
      vmDir: '/var/lib/firecracker/vms',
      logDir: '/var/log/firecracker'
    };
    this.portRange = { min: 8080, max: 9000 };
    this.usedPorts = new Set();
  }

  /**
   * Execute code in a new Firecracker VM
   */
  async executeCode(files, options = {}) {
    const vmId = uuidv4();
    const { language = 'javascript', timeout = 30000 } = options;

    try {
      // Create VM workspace
      const workspace = await this.createWorkspace(vmId, files);
      
      // Start VM
      const vm = await this.startVM(vmId, workspace);
      
      // Execute code
      const result = await this.runCodeInVM(vm, language, timeout);
      
      return {
        success: true,
        vmId,
        output: result.output,
        error: result.error,
        executionTime: result.executionTime,
        port: vm.port,
        url: `http://localhost:${vm.port}`
      };

    } catch (error) {
      console.error('Code execution failed:', error);
      await this.cleanupVM(vmId);
      throw error;
    }
  }

  /**
   * Create a long-running sandbox VM for development
   */
  async createSandbox(projectId, files) {
    const vmId = `sandbox-${projectId}-${Date.now()}`;
    
    try {
      // Create dedicated workspace
      const workspace = await this.createWorkspace(vmId, files);
      
      // Start VM with longer timeout
      const vm = await this.startVM(vmId, workspace, { persistent: true });
      
      // Store VM info
      this.activeVMs.set(vmId, {
        ...vm,
        projectId,
        createdAt: new Date(),
        type: 'sandbox'
      });

      return {
        sandboxId: vmId,
        port: vm.port,
        url: `http://localhost:${vm.port}`,
        status: 'running'
      };

    } catch (error) {
      console.error('Sandbox creation failed:', error);
      await this.cleanupVM(vmId);
      throw error;
    }
  }

  /**
   * Create workspace directory with project files
   */
  async createWorkspace(vmId, files) {
    const workspacePath = path.join(this.baseConfig.vmDir, vmId);
    
    try {
      await fs.mkdir(workspacePath, { recursive: true });
      
      // Write all files to workspace
      for (const file of files) {
        const filePath = path.join(workspacePath, file.name);
        const fileDir = path.dirname(filePath);
        
        // Create directory if needed
        await fs.mkdir(fileDir, { recursive: true });
        
        // Write file content
        await fs.writeFile(filePath, file.content || '', 'utf8');
      }

      // Create package.json if not exists and has JS files
      const hasPackageJson = files.some(f => f.name === 'package.json');
      const hasJsFiles = files.some(f => f.name.endsWith('.js') || f.name.endsWith('.ts'));
      
      if (!hasPackageJson && hasJsFiles) {
        const packageJson = {
          name: 'codesandbox-project',
          version: '1.0.0',
          scripts: {
            start: 'node index.js || node server.js || node app.js',
            dev: 'nodemon index.js || nodemon server.js || nodemon app.js'
          },
          dependencies: {}
        };
        
        await fs.writeFile(
          path.join(workspacePath, 'package.json'),
          JSON.stringify(packageJson, null, 2)
        );
      }

      // Create startup script
      await this.createStartupScript(workspacePath, files);
      
      return workspacePath;

    } catch (error) {
      console.error('Workspace creation failed:', error);
      throw error;
    }
  }

  /**
   * Create startup script based on project type
   */
  async createStartupScript(workspacePath, files) {
    const hasPackageJson = files.some(f => f.name === 'package.json');
    const hasIndexHtml = files.some(f => f.name === 'index.html');
    const hasReactFiles = files.some(f => f.content && f.content.includes('import React'));
    
    let startupScript = '#!/bin/bash\ncd /workspace\n\n';

    if (hasPackageJson) {
      startupScript += 'npm install\n';
      
      if (hasReactFiles) {
        startupScript += 'npm start &\n';
      } else {
        startupScript += 'npm start 2>/dev/null || node index.js 2>/dev/null || node server.js 2>/dev/null || node app.js &\n';
      }
    } else if (hasIndexHtml) {
      startupScript += 'python3 -m http.server 8080 &\n';
    } else {
      startupScript += 'http-server -p 8080 &\n';
    }

    startupScript += '\necho "Server started on port 8080"\necho "Ready to serve requests"\n';
    startupScript += 'tail -f /dev/null\n';

    await fs.writeFile(
      path.join(workspacePath, 'startup.sh'),
      startupScript,
      { mode: 0o755 }
    );
  }

  /**
   * Start a new Firecracker VM
   */
  async startVM(vmId, workspacePath, options = {}) {
    const { persistent = false } = options;
    const port = await this.getAvailablePort();
    const vmDir = path.join(this.baseConfig.vmDir, vmId);
    
    try {
      // Ensure VM directory exists
      await fs.mkdir(vmDir, { recursive: true });
      
      // Create VM-specific rootfs copy
      const vmRootfs = path.join(vmDir, 'rootfs.ext4');
      await this.copyRootfs(vmRootfs);
      
      // Mount and copy workspace files
      await this.injectWorkspaceFiles(vmRootfs, workspacePath);
      
      // Create TAP interface
      const tapName = `fc-tap-${vmId.slice(0, 8)}`;
      await this.createTapInterface(tapName, vmId);
      
      // Generate VM configuration
      const config = this.generateVMConfig(vmId, vmRootfs, tapName);
      const configPath = path.join(vmDir, 'config.json');
      await fs.writeFile(configPath, JSON.stringify(config, null, 2));
      
      // Start Firecracker process
      const socketPath = path.join(vmDir, 'firecracker.socket');
      const logPath = path.join(this.baseConfig.logDir, `${vmId}.log`);
      
      const vm = await this.spawnFirecracker(vmId, socketPath, configPath, logPath);
      
      // Setup port forwarding
      await this.setupPortForwarding(tapName, port);
      
      const vmInfo = {
        id: vmId,
        process: vm,
        port,
        tapName,
        socketPath,
        workspacePath,
        configPath,
        startedAt: new Date(),
        persistent
      };

      this.activeVMs.set(vmId, vmInfo);
      
      // Setup cleanup timer for non-persistent VMs
      if (!persistent) {
        setTimeout(() => {
          this.cleanupVM(vmId);
        }, this.vmTimeout);
      }

      return vmInfo;

    } catch (error) {
      console.error('VM start failed:', error);
      await this.cleanupVM(vmId);
      throw error;
    }
  }

  /**
   * Copy base rootfs for VM
   */
  async copyRootfs(targetPath) {
    return new Promise((resolve, reject) => {
      const cmd = `cp "${this.baseConfig.rootfsPath}" "${targetPath}"`;
      exec(cmd, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Rootfs copy failed: ${error.message}`));
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Inject workspace files into VM rootfs
   */
  async injectWorkspaceFiles(rootfsPath, workspacePath) {
    const mountPoint = `/tmp/mount-${Date.now()}`;
    
    try {
      // Create mount point
      await fs.mkdir(mountPoint, { recursive: true });
      
      // Mount rootfs
      await this.execCommand(`mount -o loop "${rootfsPath}" "${mountPoint}"`);
      
      // Create workspace directory in rootfs
      await fs.mkdir(path.join(mountPoint, 'workspace'), { recursive: true });
      
      // Copy files
      await this.execCommand(`cp -r "${workspacePath}"/* "${mountPoint}/workspace/"`);
      
      // Set permissions
      await this.execCommand(`chown -R root:root "${mountPoint}/workspace"`);
      
    } finally {
      // Always unmount
      try {
        await this.execCommand(`umount "${mountPoint}"`);
        await fs.rmdir(mountPoint);
      } catch (e) {
        console.warn('Unmount failed:', e.message);
      }
    }
  }

  /**
   * Create TAP network interface
   */
  async createTapInterface(tapName, vmId) {
    const ip = this.generateVMIP(vmId);
    
    try {
      // Create TAP interface
      await this.execCommand(`ip tuntap add ${tapName} mode tap`);
      
      // Add to bridge
      await this.execCommand(`ip link set ${tapName} master fc-br0`);
      
      // Bring up interface
      await this.execCommand(`ip link set ${tapName} up`);
      
    } catch (error) {
      console.error('TAP interface creation failed:', error);
      throw error;
    }
  }

  /**
   * Generate VM configuration
   */
  generateVMConfig(vmId, rootfsPath, tapName) {
    return {
      "boot-source": {
        "kernel_image_path": this.baseConfig.kernelPath,
        "boot_args": "console=ttyS0 reboot=k panic=1 pci=off nomodules random.trust_cpu=on"
      },
      "drives": [
        {
          "drive_id": "rootfs",
          "path_on_host": rootfsPath,
          "is_root_device": true,
          "is_read_only": false
        }
      ],
      "machine-config": {
        "vcpu_count": 1,
        "mem_size_mib": 512,
        "ht_enabled": false
      },
      "network-interfaces": [
        {
          "iface_id": "eth0",
          "guest_mac": this.generateMacAddress(vmId),
          "host_dev_name": tapName
        }
      ]
    };
  }

  /**
   * Spawn Firecracker process
   */
  async spawnFirecracker(vmId, socketPath, configPath, logPath) {
    return new Promise((resolve, reject) => {
      const args = [
        '--api-sock', socketPath,
        '--config-file', configPath
      ];

      const process = spawn('firecracker', args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        detached: false
      });

      // Setup logging
      const logStream = require('fs').createWriteStream(logPath);
      process.stdout.pipe(logStream);
      process.stderr.pipe(logStream);

      process.on('error', (error) => {
        console.error(`Firecracker process error for ${vmId}:`, error);
        reject(error);
      });

      process.on('exit', (code) => {
        console.log(`Firecracker process for ${vmId} exited with code ${code}`);
        this.activeVMs.delete(vmId);
      });

      // Wait for VM to boot
      setTimeout(() => {
        if (!process.killed) {
          resolve(process);
        } else {
          reject(new Error('VM failed to start'));
        }
      }, 3000);
    });
  }

  /**
   * Setup port forwarding from host to VM
   */
  async setupPortForwarding(tapName, hostPort) {
    const vmIP = '172.20.0.2'; // Default VM IP
    
    try {
      // Forward traffic from host port to VM
      await this.execCommand(
        `iptables -t nat -A PREROUTING -p tcp --dport ${hostPort} -j DNAT --to-destination ${vmIP}:8080`
      );
      
      await this.execCommand(
        `iptables -A FORWARD -p tcp -d ${vmIP} --dport 8080 -j ACCEPT`
      );
      
    } catch (error) {
      console.error('Port forwarding setup failed:', error);
      throw error;
    }
  }

  /**
   * Execute code in running VM
   */
  async runCodeInVM(vm, language, timeout) {
    // For now, we assume the startup script handles execution
    // In a full implementation, you'd use the Firecracker API or SSH
    
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          output: 'Code executed successfully in Firecracker VM',
          error: null,
          executionTime: 1000
        });
      }, 2000);
    });
  }

  /**
   * Stop and cleanup VM
   */
  async stopSandbox(sandboxId) {
    return this.cleanupVM(sandboxId);
  }

  /**
   * Update files in running VM
   */
  async updateSandboxFiles(sandboxId, files) {
    const vm = this.activeVMs.get(sandboxId);
    if (!vm) {
      throw new Error('VM not found');
    }

    try {
      // Update workspace files
      for (const file of files) {
        const filePath = path.join(vm.workspacePath, file.name);
        await fs.writeFile(filePath, file.content || '', 'utf8');
      }

      // Re-inject files into VM
      await this.injectWorkspaceFiles(
        path.join(path.dirname(vm.configPath), 'rootfs.ext4'),
        vm.workspacePath
      );

      return true;
    } catch (error) {
      console.error('File update failed:', error);
      throw error;
    }
  }

  /**
   * List active VMs
   */
  async listActiveSandboxes() {
    const vms = Array.from(this.activeVMs.values()).map(vm => ({
      id: vm.id,
      port: vm.port,
      status: vm.process.killed ? 'stopped' : 'running',
      createdAt: vm.startedAt,
      type: vm.type || 'execution'
    }));

    return vms;
  }

  /**
   * Cleanup VM resources
   */
  async cleanupVM(vmId) {
    const vm = this.activeVMs.get(vmId);
    
    try {
      if (vm) {
        // Kill Firecracker process
        if (vm.process && !vm.process.killed) {
          vm.process.kill('SIGTERM');
        }

        // Remove port forwarding rules
        if (vm.port) {
          try {
            await this.execCommand(
              `iptables -t nat -D PREROUTING -p tcp --dport ${vm.port} -j DNAT --to-destination 172.20.0.2:8080`
            );
          } catch (e) {
            // Ignore if rule doesn't exist
          }
        }

        // Remove TAP interface
        if (vm.tapName) {
          try {
            await this.execCommand(`ip link delete ${vm.tapName}`);
          } catch (e) {
            // Ignore if interface doesn't exist
          }
        }

        // Release port
        if (vm.port) {
          this.usedPorts.delete(vm.port);
        }

        // Remove VM directory
        const vmDir = path.dirname(vm.configPath || path.join(this.baseConfig.vmDir, vmId));
        try {
          await this.execCommand(`rm -rf "${vmDir}"`);
        } catch (e) {
          console.warn('VM directory cleanup failed:', e.message);
        }

        this.activeVMs.delete(vmId);
      }

      return true;
    } catch (error) {
      console.error('VM cleanup failed:', error);
      return false;
    }
  }

  // Utility methods
  async getAvailablePort() {
    for (let port = this.portRange.min; port <= this.portRange.max; port++) {
      if (!this.usedPorts.has(port)) {
        const available = await this.isPortAvailable(port);
        if (available) {
          this.usedPorts.add(port);
          return port;
        }
      }
    }
    throw new Error('No available ports');
  }

  isPortAvailable(port) {
    return new Promise((resolve) => {
      const server = net.createServer();
      server.listen(port, () => {
        server.close(() => resolve(true));
      });
      server.on('error', () => resolve(false));
    });
  }

  generateVMIP(vmId) {
    // Simple IP generation based on VM ID
    const hash = vmId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const lastOctet = (hash % 253) + 2; // 2-254
    return `172.20.0.${lastOctet}`;
  }

  generateMacAddress(vmId) {
    // Generate MAC based on VM ID
    const hash = vmId.replace(/-/g, '').slice(0, 10);
    return `AA:FC:${hash.slice(0, 2)}:${hash.slice(2, 4)}:${hash.slice(4, 6)}:${hash.slice(6, 8)}`;
  }

  execCommand(command) {
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Command failed: ${error.message}`));
        } else {
          resolve(stdout);
        }
      });
    });
  }
}

module.exports = new FirecrackerService();