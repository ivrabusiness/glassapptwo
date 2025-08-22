import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const server = createServer(app);
// Trust proxy for correct IPs when behind proxies
app.set('trust proxy', 1);

// Configure CORS for Socket.IO
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      const devOrigins = [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5174',
      ];
      if (!origin || devOrigins.includes(origin)) return callback(null, true);
      console.warn('❌ Socket.IO CORS blocked (dev):', origin);
      return callback(new Error('Not allowed by CORS'));
    },
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(cors());
app.use(express.json());

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Handle work order completion from device interface
  socket.on('work_order_completed', (data) => {
    console.log('Work order completed:', data);
    // Broadcast to all other clients
    socket.broadcast.emit('work_order_completed', data);
  });

  socket.on('work_order_created', (data) => {
    console.log('Work order created:', data);
    
    // Broadcast to all connected clients (device interfaces)
    socket.broadcast.emit('work_order_created', {
      ...data,
      timestamp: new Date().toISOString()
    });
  });

  // Broadcast when a work order is updated (any field, e.g. process status)
  socket.on('work_order_updated', (data) => {
    console.log('Work order updated:', data);
    socket.broadcast.emit('work_order_updated', data);
  });

  // Broadcast when a specific process step is updated
  socket.on('process_step_updated', (data) => {
    console.log('Process step updated:', data);
    socket.broadcast.emit('process_step_updated', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});
