import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import http from 'http';

// Charger les variables d'environnement
dotenv.config();

import connectDB from './config/database';
import { errorHandler, notFound } from './middleware/error';
import { initializeSocket } from './socket';

// Routes
import authRoutes from './routes/authRoutes';
import productRoutes from './routes/productRoutes';
import categoryRoutes from './routes/categoryRoutes';
import orderRoutes from './routes/orderRoutes';
import adminRoutes from './routes/adminRoutes';
import uploadRoutes from './routes/uploadRoutes';
import publicRoutes from './routes/publicRoutes';
import paymentRoutes from './routes/paymentRoutes';
import newsletterRoutes from './routes/newsletterRoutes';
import contactRoutes from './routes/contactRoutes';
import pageBannerRoutes from './routes/pageBannerRoutes';

// Rate limiters
import { generalLimiter } from './middleware/rateLimiter';

// Initialiser Express
const app: Application = express();

// Connexion à la base de données
connectDB();

// Middleware de sécurité
app.use(helmet());
app.use(compression());

// CORS
app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'http://localhost:5174'
    ],
    credentials: true,
  })
);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger (en développement seulement)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Appliquer rate limiting global (sauf le webhook NabooPay)
app.use('/api/', (req, res, next) => {
  if (req.path === '/payment/webhook') return next();
  return generalLimiter(req, res, next);
});

// Routes API
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'API ASMA - Bienvenue',
    version: '1.0.0',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/page-banners', pageBannerRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/page-banners', pageBannerRoutes);

// Route santé
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Serveur opérationnel',
    timestamp: new Date().toISOString(),
  });
});

// Gestion des erreurs
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Créer le serveur HTTP
const server = http.createServer(app);

// Initialiser Socket.IO
const io = initializeSocket(server);

// Rendre io disponible globalement pour les controllers
app.set('io', io);

server.listen(PORT, () => {
  console.log(`
  ╔════════════════════════════════════════╗
  ║                                        ║
  ║   🚀 ASMA API Server Running        ║
  ║                                        ║
  ║   📍 Port: ${PORT}                        ║
  ║   🌍 Mode: ${process.env.NODE_ENV || 'development'}              ║
  ║   📡 URL: http://localhost:${PORT}        ║
  ║   🔌 WebSocket: Actif                  ║
  ║                                        ║
  ╚════════════════════════════════════════╝
  `);
});

export default app;
export { io };