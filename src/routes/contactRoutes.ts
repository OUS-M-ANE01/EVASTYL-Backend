import { Router } from 'express';
import { body } from 'express-validator';
import { sendContactMessage, getContactInfo } from '../controllers/contactController';

const router = Router();

// Validation pour l'envoi de message
const validateContactMessage = [
  body('nom')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le nom doit contenir entre 2 et 50 caractères'),
  
  body('prenom')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Le prénom ne peut pas dépasser 50 caractères'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Veuillez fournir un email valide'),
  
  body('telephone')
    .optional()
    .trim()
    .matches(/^[\+]?[0-9\s\-\(\)]{8,20}$/)
    .withMessage('Numéro de téléphone invalide'),
  
  body('sujet')
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Le sujet doit contenir entre 5 et 100 caractères'),
  
  body('message')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Le message doit contenir entre 10 et 1000 caractères'),
];

// Routes publiques
router.post('/send', validateContactMessage, sendContactMessage);
router.get('/info', getContactInfo);

export default router;