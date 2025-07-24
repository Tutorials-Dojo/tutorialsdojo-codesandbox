# Firecracker VM Setup Guide

## What is Firecracker?
Firecracker is AWS's open-source virtualization technology that creates secure, lightweight microVMs. It's designed for serverless computing and provides better isolation than containers.

## Why Use Firecracker for Code Execution?
- **Security**: Complete isolation between user code and host system
- **Performance**: Starts in ~125ms vs Docker's ~1-3 seconds  
- **Resource Efficiency**: Minimal overhead (~5MB memory per VM)
- **Sandboxing**: Perfect for untrusted user code execution

## Prerequisites
- Linux server (Ubuntu 18.04+ recommended)
- Root access
- KVM enabled
- At least 2GB RAM

## Step 1: Install Firecracker

```bash
# Download Firecracker binary
curl -LOJ https://github.com/firecracker-microvm/firecracker/releases/latest/download/firecracker-v1.4.1-x86_64.tgz
tar xvf firecracker-v1.4.1-x86_64.tgz

# Install binary
sudo cp release-v1.4.1-x86_64/firecracker-v1.4.1-x86_64 /usr/local/bin/firecracker
sudo chmod +x /usr/local/bin/firecracker

# Verify installation
firecracker --version
```

## Step 2: Create Root Filesystem

```bash
# Create directory for Firecracker files
sudo mkdir -p /opt/firecracker
cd /opt/firecracker

# Download kernel
sudo curl -fsSL -o vmlinux.bin https://s3.amazonaws.com/spec.ccfc.min/img/quickstart_guide/x86_64/kernels/vmlinux.bin

# Create Alpine Linux rootfs (50MB)
sudo dd if=/dev/zero of=rootfs.ext4 bs=1M count=50
sudo mkfs.ext4 rootfs.ext4

# Mount and setup rootfs
sudo mkdir -p /mnt/firecracker-rootfs
sudo mount rootfs.ext4 /mnt/firecracker-rootfs

# Install Alpine Linux minimal system
sudo debootstrap --arch amd64 --include=nodejs,npm,python3,gcc,make focal /mnt/firecracker-rootfs http://archive.ubuntu.com/ubuntu/

# Unmount
sudo umount /mnt/firecracker-rootfs
```

## Step 3: Configure Networking

```bash
# Create TAP interface
sudo ip tuntap add tap-firecracker mode tap
sudo ip addr add 172.16.0.1/24 dev tap-firecracker
sudo ip link set tap-firecracker up

# Enable IP forwarding
echo 'net.ipv4.ip_forward = 1' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Configure iptables (optional - for internet access)
sudo iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
sudo iptables -A FORWARD -i tap-firecracker -o eth0 -j ACCEPT
sudo iptables -A FORWARD -i eth0 -o tap-firecracker -j ACCEPT
```

## Step 4: Create VM Configuration Template

```json
{
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
      "host_dev_name": "tap-firecracker"
    }
  ]
}
```

## Step 5: Integration with Backend

Your backend service (`firecrackerService.js`) is already created. To use it:

```javascript
// Example usage in your API
const FirecrackerService = require('./services/firecrackerService');

app.post('/api/execute', async (req, res) => {
  try {
    const { files, language } = req.body;
    const result = await FirecrackerService.executeCode(files, language);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## Step 6: Production Deployment

### Docker Alternative (Development)
```bash
# Use Docker for development (easier setup)
docker run --rm -v $(pwd):/workspace node:18-alpine sh -c "cd /workspace && node script.js"
```

### Firecracker (Production)
```bash
# Start your Node.js server with sudo (required for Firecracker)
sudo node server.js

# Or use systemd service for production
sudo systemctl start tutorials-dojo-api
```

## Security Considerations

1. **Network Isolation**: VMs are isolated from host network
2. **Resource Limits**: Memory and CPU limits prevent resource exhaustion
3. **Time Limits**: Execution timeout prevents infinite loops
4. **File System**: Read-only root filesystem with temporary write space

## Monitoring & Scaling

```bash
# Monitor active VMs
curl localhost:3000/api/execution/active

# VM metrics
ps aux | grep firecracker
```

## Troubleshooting

### Common Issues:
1. **Permission denied**: Run with `sudo`
2. **KVM not found**: Enable virtualization in BIOS
3. **Network issues**: Check TAP interface configuration
4. **Memory issues**: Increase host RAM or reduce VM memory

### Logs:
```bash
# Check Firecracker logs
journalctl -u firecracker

# Check your API logs
tail -f /var/log/tutorials-dojo.log
```

## Performance Comparison

| Metric | Docker | Firecracker |
|--------|---------|-------------|
| Startup Time | 1-3 seconds | 125ms |
| Memory Overhead | 20-100MB | 5MB |
| Security Isolation | Process-level | VM-level |
| Resource Efficiency | Good | Excellent |

## Next Steps

1. **Test locally** with Docker first
2. **Set up Firecracker** on a Linux server
3. **Configure monitoring** and logging
4. **Implement rate limiting** for API calls
5. **Add caching** for frequently used templates

---

**Ready to start?** Your backend code is already prepared for both Docker and Firecracker execution!