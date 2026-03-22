import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { sendContactEmail, sendContactConfirmation } from '../services/emailService';
import { AppError } from '../middleware/error';

// @desc    Envoyer un message de contact
// @route   POST /api/contact/send
// @access  Public
export const sendContactMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { nom, prenom, email, telephone, sujet, message } = req.body;

    // Validation des champs requis
    if (!nom || !email || !sujet || !message) {
      return res.status(400).json({
        success: false,
        message: 'Nom, email, sujet et message sont requis',
      });
    }

    // Envoyer l'email à l'équipe
    try {
      await sendContactEmail({
        nom,
        prenom,
        email,
        telephone,
        sujet,
        message,
        dateEnvoi: new Date(),
      });

      // Envoyer un email de confirmation au client
      await sendContactConfirmation(email, `${prenom || ''} ${nom}`.trim());

      res.status(200).json({
        success: true,
        message: 'Votre message a été envoyé avec succès. Nous vous répondrons dans les plus brefs délais.',
      });
    } catch (emailError) {
      console.error('Erreur envoi email contact:', emailError);
      
      // Même si l'email échoue, on confirme la réception pour l'UX
      res.status(200).json({
        success: true,
        message: 'Votre message a été reçu. Nous vous répondrons dans les plus brefs délais.',
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Obtenir les informations de contact (Admin)
// @route   GET /api/contact/info
// @access  Private/Admin
export const getContactInfo = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const contactInfo = {
      email: 'contact@asma.com',
      telephone: '+221 78 116 67 20',
      whatsapp: '+221 78 116 67 20',
      adresse: 'Dakar, Sénégal',
      horaires: {
        lundi_vendredi: '9h00 - 18h00',
        samedi: '9h00 - 16h00',
        dimanche: 'Fermé',
      },
      reseaux_sociaux: {
        facebook: 'https://facebook.com/asma',
        instagram: 'https://instagram.com/asma',
        whatsapp: 'https://wa.me/221781166720',
      },
    };

    res.json({
      success: true,
      data: contactInfo,
    });
  } catch (error) {
    next(error);
  }
};