import express from 'express';
import { body } from 'express-validator';
import {
  subscribe,
  unsubscribe,
  updatePreferences,
  getStats,
  getSubscribers,
  sendNewsletter,
} from '../controllers/newsletterController';
import { protect, authorize } from '../middleware/auth';
import { generalLimiter } from '../middleware/rateLimiter';

const router = express.Router();

// Validation pour l'inscription
const subscribeValidation = [
  body('email')
    .isEmail()
    .withMessage('Email invalide')
    .normalizeEmail(),
  body('prenom')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le prénom doit contenir entre 2 et 50 caractères'),
  body('nom')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le nom doit contenir entre 2 et 50 caractères'),
];

// Validation pour l'envoi de newsletter
const sendNewsletterValidation = [
  body('subject')
    .notEmpty()
    .withMessage('Sujet requis')
    .isLength({ min: 5, max: 200 })
    .withMessage('Le sujet doit contenir entre 5 et 200 caractères'),
  body('content')
    .notEmpty()
    .withMessage('Contenu requis')
    .isLength({ min: 10 })
    .withMessage('Le contenu doit contenir au moins 10 caractères'),
  body('type')
    .optional()
    .isIn(['promotion', 'news', 'product', 'general'])
    .withMessage('Type invalide'),
];

// Routes publiques
router.post('/subscribe', generalLimiter, subscribeValidation, subscribe);
router.get('/unsubscribe/:token', unsubscribe);
router.put('/preferences/:token', updatePreferences);

// Routes admin
router.get('/stats', protect, authorize('admin'), getStats);
router.get('/subscribers', protect, authorize('admin'), getSubscribers);
router.post('/send', protect, authorize('admin'), sendNewsletterValidation, sendNewsletter);

export default router;