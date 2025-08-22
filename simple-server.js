// Simple server for Railway debugging
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting simple server...');
console.log('📁 __dirname:', __dirname);
console.log('🌍 NODE_ENV:', process.env.NODE_ENV);
console.log('🔌 PORT:', process.env.PORT);

const app = express();
const server = createServer(app);

// Basic middleware
// Trust proxy (Railway/behind proxies) for correct client IP
app.set('trust proxy', 1);

// CORS configuration
const isProd = process.env.NODE_ENV === 'production';
const allowedOrigins = isProd
  ? [
      process.env.VITE_PRODUCTION_DOMAIN,
      /^https:\/\/.*\.railway\.app$/,
      /^https:\/\/.*\.netlify\.app$/,
    ]
  : [
      process.env.VITE_DEV_URL || 'http://localhost:5173',
      process.env.VITE_DEV_URL_ALT || 'http://127.0.0.1:5173',
    ];

function isOriginAllowed(origin) {
  if (!origin) return true; // allow same-origin/non-browser requests
  return allowedOrigins.some((rule) => {
    if (!rule) return false;
    if (rule instanceof RegExp) return rule.test(origin);
    return rule === origin;
  });
}

const corsOptions = {
  origin: (origin, callback) => {
    const allowed = isOriginAllowed(origin);
    if (allowed) return callback(null, true);
    console.warn('❌ CORS blocked origin:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json());

// Simple routes first
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    port: process.env.PORT
  });
});

// Socket.IO with strict CORS
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      const allowed = isOriginAllowed(origin);
      if (allowed) return callback(null, true);
      console.warn('❌ Socket.IO CORS blocked:', origin);
      return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST'],
    credentials: true
  },
});

// Basic Socket.IO connection rate limiting
const connectionAttempts = new Map();
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_CONN = 10; // per IP per window

function getClientIp(socket) {
  const xfwd = socket.handshake.headers['x-forwarded-for'];
  if (xfwd) return Array.isArray(xfwd) ? xfwd[0] : xfwd.split(',')[0].trim();
  return socket.handshake.address || socket.request?.connection?.remoteAddress;
}

io.use((socket, next) => {
  try {
    const ip = getClientIp(socket) || 'unknown';
    const now = Date.now();
    const entry = connectionAttempts.get(ip);
    if (!entry || now - entry.first > WINDOW_MS) {
      connectionAttempts.set(ip, { count: 1, first: now });
    } else {
      entry.count += 1;
      if (entry.count > MAX_CONN) {
        console.warn(`🚫 Rate limit exceeded for IP ${ip}`);
        return next(new Error('Too many connections, slow down.'));
      }
    }
    return next();
  } catch (err) {
    return next(err);
  }
});

// periodic cleanup of rate limit map
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of connectionAttempts.entries()) {
    if (now - entry.first > WINDOW_MS) {
      connectionAttempts.delete(ip);
    }
  }
}, WINDOW_MS);

io.on('connection', (socket) => {
  console.log('📡 Socket connected:', socket.id);
  
  socket.on('work_order_created', (data) => {
    console.log('📦 Work order created:', data);
    socket.broadcast.emit('work_order_created', data);
  });
  
  socket.on('work_order_completed', (data) => {
    console.log('✅ Work order completed:', data);
    socket.broadcast.emit('work_order_completed', data);
  });

  // Device process management events
  socket.on('work_order_updated', (data) => {
    console.log('🔄 Work order updated:', data);
    socket.broadcast.emit('work_order_updated', data);
  });

  socket.on('process_step_updated', (data) => {
    console.log('⚙️ Process step updated:', data);
    socket.broadcast.emit('process_step_updated', data);
  });
  
  socket.on('disconnect', () => {
    console.log('📡 Socket disconnected:', socket.id);
  });
});

// Static files only if dist exists
if (process.env.NODE_ENV === 'production') {
  try {
    const distPath = path.join(__dirname, 'dist');
    console.log('📁 Checking dist path:', distPath);
    
    app.use(express.static(distPath));
    
    // Catch-all for React Router
    app.get('*', (req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      console.log('📄 Serving index.html from:', indexPath);
      res.sendFile(indexPath);
    });
    
    console.log('✅ Static files configured');
  } catch (error) {
    console.error('❌ Error setting up static files:', error);
  }
} else {
  app.get('/', (req, res) => {
    res.json({ message: 'Development server running' });
  });
}

// Global error handlers
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
  console.log(`🌐 Socket.IO ready`);
}).on('error', (error) => {
  console.error('❌ Server error:', error);
  process.exit(1);
});
