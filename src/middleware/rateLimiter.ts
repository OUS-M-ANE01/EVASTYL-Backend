import rateLimit from 'express-rate-limit';

// Rate limiter général (100 requêtes par 15 minutes)
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    message: 'Trop de requêtes, veuillez réessayer plus tard',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter pour les routes d'authentification (5 tentatives par 15 minutes)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    success: false,
    message: 'Trop de tentatives de connexion, veuillez réessayer dans 15 minutes',
  },
  skipSuccessfulRequests: true, // Ne compte pas les tentatives réussies
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter pour les uploads (10 uploads par heure)
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 10,
  message: {
    success: false,
    message: 'Limite d\'uploads atteinte, veuillez réessayer dans une heure',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter pour les créations de ressources (20 par heure)
export const createLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 20,
  message: {
    success: false,
    message: 'Trop de créations, veuillez réessayer plus tard',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter strict pour les actions sensibles admin (50 par heure)
export const adminActionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 50,
  message: {
    success: false,
    message: 'Limite d\'actions administrateur atteinte',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
