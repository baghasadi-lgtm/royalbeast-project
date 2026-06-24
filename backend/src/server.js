import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

import servicesRoutes from './routes/services.js';
import kapstersRoutes from './routes/kapsters.js';
import productsRoutes from './routes/products.js';
import ordersRoutes from './routes/orders.js';
import pricesRoutes from './routes/pricesRoutes.js';
import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';
import paymentsRoutes from './routes/payments.js';
import accountingRoutes from './routes/accounting.js';
import pushRoutes from './routes/push.js';
import usersRoutes from './routes/users.js';
import settingsRoutes from './routes/settings.js';
import { initSocket } from './socket.js';
import { initWebPush } from './services/pushService.js';
import { startDepreciationScheduler } from './jobs/depreciationScheduler.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5001;
const isDev = process.env.NODE_ENV !== 'production';

const corsOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  ...(process.env.CORS_ORIGINS?.split(',').map((o) => o.trim()).filter(Boolean) || []),
];

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (corsOrigins.includes(origin)) return true;
  if (!isDev) return false;
  return /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(:\d+)?$/.test(
    origin
  );
};

const corsOptions = {
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) return callback(null, true);
    console.warn('CORS blocked:', origin);
    return callback(new Error(`CORS blocked: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200,
};

const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

initSocket(io);

app.use(cors(corsOptions));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.use('/api/auth', authRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/kapsters', kapstersRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/prices', pricesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/accounting', accountingRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/settings', settingsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

httpServer.listen(PORT, '0.0.0.0', () => {
  const base = `http://0.0.0.0:${PORT}`;
  console.log(`🚀 Server → ${base}`);
  console.log(`💚 Health → GET ${base}/api/health`);
  console.log('🔌 WebSocket ready');
  if (initWebPush()) console.log('🔔 Web Push ready');
  startDepreciationScheduler();
});
