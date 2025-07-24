const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class FirecrackerService {
  constructor() {
    this.activeVMs = new Map();
    this.vmTimeout = 30000; // 30 seconds
  }

  async executeCode(files, language = 'javascript') {
    const vmId = uuidv4();
    const tempDir = `/tmp/firecracker-${vmId}`;
    
    try {
      // Create temporary directory
      await fs.mkdir(tempDir, { recursive: true });
      
      // Write files to temporary directory
      for (const [filename, content] of Object.entries(files)) {
        await fs.writeFile(path.join(tempDir, filename), content);
      }

      // Create Firecracker configuration
      const config = this.createVMConfig(vmId, tempDir);
      const configPath = path.join(tempDir, 'config.json');
      await fs.writeFile(configPath, JSON.stringify(config, null, 2));

      // Start Firecracker VM
      const vm = await this.startVM(vmId, configPath);
      this.activeVMs.set(vmId, vm);

      // Execute code inside VM
      const result = await this.runCodeInVM(vmId, language);
      
      // Cleanup
      await this.stopVM(vmId);
      await this.cleanup(tempDir);
      
      return result;
      
    } catch (error) {
      // Ensure cleanup on error
      await this.stopVM(vmId);
      await this.cleanup(tempDir);
      throw error;
    }
  }

  createVMConfig(vmId, tempDir) {
    return {
      "boot-source": {
        "kernel_image_path": "/opt/firecracker/vmlinux.bin",
        "boot_args": "console=ttyS0 reboot=k panic=1 pci=off"
      },
      "drives": [
        {
          "drive_id": "rootfs",
          "path_on_host": "/opt/firecracker/rootfs.ext4",
          "is_root_device": true,
          "is_read_only": false
        },
        {
          "drive_id": "code",
          "path_on_host": tempDir,
          "is_root_device": false,
          "is_read_only": true
        }
      ],
      "machine-config": {
        "vcpu_count": 1,
        "mem_size_mib": 128,
        "ht_enabled": false
      },
      "network-interfaces": [
        {
          "iface_id": "eth0",
          "guest_mac": "AA:FC:00:00:00:01",
          "host_dev_name": `tap-${vmId}`
        }
      ],
      "vsock": {
        "guest_cid": 3,
        "uds_path": `/tmp/firecracker-${vmId}.vsock`
      }
    };
  }

  async startVM(vmId, configPath) {
    return new Promise((resolve, reject) => {
      const vm = spawn('firecracker', [
        '--api-sock', `/tmp/firecracker-${vmId}.socket`,
        '--config-file', configPath
      ], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      vm.on('error', reject);
      
      // Wait for VM to be ready (simplified - in production, use proper health checks)
      setTimeout(() => {
        resolve(vm);
      }, 2000);
    });
  }

  async runCodeInVM(vmId, language) {
    // This is a simplified version - in production, you'd use the Firecracker API
    // to send commands to the VM and get responses
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Execution timeout'));
      }, this.vmTimeout);

      // Simulate code execution (replace with actual VM communication)
      setTimeout(() => {
        clearTimeout(timeout);
        resolve({
          output: 'Hello from Firecracker VM!',
          error: null,
          executionTime: 150
        });
      }, 1000);
    });
  }

  async stopVM(vmId) {
    const vm = this.activeVMs.get(vmId);
    if (vm) {
      vm.kill('SIGTERM');
      this.activeVMs.delete(vmId);
    }
  }

  async cleanup(tempDir) {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }

  async listActiveVMs() {
    return Array.from(this.activeVMs.keys());
  }

  async getVMStatus(vmId) {
    return {
      id: vmId,
      status: this.activeVMs.has(vmId) ? 'running' : 'stopped',
      createdAt: new Date()
    };
  }
}

module.exports = new FirecrackerService();

// Setup instructions for Firecracker:
/*
1. Install Firecracker:
   curl -LOJ https://github.com/firecracker-microvm/firecracker/releases/latest/download/firecracker-v1.4.1-x86_64.tgz
   tar xvf firecracker-v1.4.1-x86_64.tgz
   sudo cp release-v1.4.1-x86_64/firecracker-v1.4.1-x86_64 /usr/local/bin/firecracker
   sudo chmod +x /usr/local/bin/firecracker

2. Create rootfs (Alpine Linux):
   mkdir /opt/firecracker
   cd /opt/firecracker
   
   # Download kernel
   curl -fsSL -o vmlinux.bin https://s3.amazonaws.com/spec.ccfc.min/img/quickstart_guide/x86_64/kernels/vmlinux.bin
   
   # Create rootfs
   dd if=/dev/zero of=rootfs.ext4 bs=1M count=50
   mkfs.ext4 rootfs.ext4
   
3. Configure networking:
   sudo ip tuntap add tap-firecracker mode tap
   sudo ip addr add 172.16.0.1/24 dev tap-firecracker
   sudo ip link set tap-firecracker up
   
4. Run with proper permissions:
   sudo node server.js
*/