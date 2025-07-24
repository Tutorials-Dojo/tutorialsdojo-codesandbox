#!/bin/bash

# Firecracker VM Management Script
# Usage: ./firecracker-manager.sh [start|stop|status|clean]

FIRECRACKER_DIR="/opt/firecracker"
VM_CONFIG="$FIRECRACKER_DIR/vm-config.json"
VM_SOCKET="/tmp/firecracker.socket"

case "$1" in
    start)
        echo "Starting Firecracker VM..."
        
        # Create VM configuration
        cat > $VM_CONFIG << EOF
{
  "boot-source": {
    "kernel_image_path": "$FIRECRACKER_DIR/vmlinux.bin",
    "boot_args": "console=ttyS0 reboot=k panic=1 pci=off"
  },
  "drives": [
    {
      "drive_id": "rootfs",
      "path_on_host": "$FIRECRACKER_DIR/rootfs.ext4",
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
EOF

        # Start Firecracker
        firecracker --api-sock $VM_SOCKET --config-file $VM_CONFIG &
        echo "Firecracker VM started with PID $!"
        ;;
        
    stop)
        echo "Stopping Firecracker VM..."
        pkill -f firecracker
        rm -f $VM_SOCKET
        echo "VM stopped"
        ;;
        
    status)
        if pgrep -f firecracker > /dev/null; then
            echo "Firecracker VM is running"
            echo "Active processes:"
            pgrep -f firecracker
        else
            echo "Firecracker VM is not running"
        fi
        ;;
        
    clean)
        echo "Cleaning up VM resources..."
        pkill -f firecracker
        rm -f $VM_SOCKET
        rm -f /tmp/firecracker-*.socket
        rm -f /tmp/firecracker-*.vsock
        echo "Cleanup complete"
        ;;
        
    *)
        echo "Usage: $0 {start|stop|status|clean}"
        exit 1
        ;;
esac