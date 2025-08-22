import { io, Socket } from 'socket.io-client';

class SocketManager {
  private socket: Socket | null = null;
  private static instance: SocketManager;

  private constructor() {}

  static getInstance(): SocketManager {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager();
    }
    return SocketManager.instance;
  }

  connect(): Socket {
    if (!this.socket) {
      // Dynamic URL based on environment
      const socketUrl = import.meta.env.DEV 
        ? 'http://localhost:3001'  // Development - separate socket server
        : window.location.origin;  // Production - same server (integrated Socket.IO)
      
      
      
      this.socket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        autoConnect: true,
      });

      this.socket.on('connect', () => {
        // connected
      });

      this.socket.on('disconnect', () => {
        // disconnected
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket.IO connection error:', error);
      });
    }

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  // Emit work order completion
  emitWorkOrderCompleted(workOrder: any) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('work_order_completed', {
        id: workOrder.id,
        orderNumber: workOrder.orderNumber,
        status: workOrder.status,
        completedAt: new Date().toISOString(),
        deviceName: 'Device Interface'
      });
    }
  }

  // Emit new work order created
  emitWorkOrderCreated(workOrder: any) {
    if (this.socket && this.socket.connected) {
      // Send complete work order data
      this.socket.emit('work_order_created', {
        ...workOrder,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Listen for work order completions
  onWorkOrderCompleted(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('work_order_completed', callback);
    }
  }

  // Listen for new work orders
  onWorkOrderCreated(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('work_order_created', callback);
    }
  }

  offWorkOrderCompleted() {
    if (this.socket) {
      this.socket.off('work_order_completed');
    }
  }

  offWorkOrderCreated() {
    if (this.socket) {
      this.socket.off('work_order_created');
    }
  }
}

export default SocketManager;

