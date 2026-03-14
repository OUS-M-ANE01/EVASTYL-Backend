import rateLimit from 'express-rate-limit';

const isDev = process.env.NODE_ENV !== 'production';

// Rate limiter général — désactivé en dev, 500 req/15min en prod
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 0 : 500, // 0 = désactivé
  skip: () => isDev,
  message: {
    success: false,
    message: 'Trop de requêtes, veuillez réessayer plus tard',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter pour les routes d'authentification — 20/15min en dev, 10 en prod
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 50 : 10,
  message: {
    success: false,
    message: 'Trop de tentatives de connexion, veuillez réessayer dans 15 minutes',
  },
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter pour les uploads — 50/heure en dev, 20 en prod
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isDev ? 50 : 20,
  message: {
    success: false,
    message: "Limite d'uploads atteinte, veuillez réessayer dans une heure",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter pour les créations de ressources
export const createLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isDev ? 200 : 50,
  message: {
    success: false,
    message: 'Trop de créations, veuillez réessayer plus tard',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter pour les actions sensibles admin
export const adminActionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isDev ? 200 : 100,
  message: {
    success: false,
    message: "Limite d'actions administrateur atteinte",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
