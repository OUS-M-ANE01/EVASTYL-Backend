import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';

const router = Router();

/**
 * GET /api/health
 * Endpoint de santé pour Docker healthcheck et monitoring
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    // Vérifier la connexion MongoDB
    const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    if (mongoStatus !== 'connected') {
      return res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        services: {
          api: 'up',
          database: 'down',
        },
      });
    }

    // Tout est OK
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      services: {
        api: 'up',
        database: 'up',
      },
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
    });
  }
});

/**
 * GET /api/health/ready
 * Readiness probe - vérifie si l'app est prête à recevoir du trafic
 */
router.get('/health/ready', async (req: Request, res: Response) => {
  try {
    // Vérifier MongoDB
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ ready: false, reason: 'Database not connected' });
    }

    // Ping MongoDB
    await mongoose.connection.db.admin().ping();

    res.status(200).json({ ready: true });
  } catch (error) {
    res.status(503).json({ ready: false, reason: 'Database ping failed' });
  }
});

/**
 * GET /api/health/live
 * Liveness probe - vérifie si l'app est vivante
 */
router.get('/health/live', (req: Request, res: Response) => {
  res.status(200).json({ alive: true });
});

export default router;
