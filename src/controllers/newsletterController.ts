import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import crypto from 'crypto';
import Newsletter from '../models/Newsletter';
import { AppError } from '../middleware/error';
import { sendWelcomeEmail, sendNewsletter as sendNewsletterEmail } from '../services/emailService';

// @desc    S'inscrire à la newsletter
// @route   POST /api/newsletter/subscribe
// @access  Public
export const subscribe = async (
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

    const { email, prenom, nom, preferences, source } = req.body;

    // Vérifier si l'email existe déjà
    let subscriber = await Newsletter.findOne({ email });

    if (subscriber) {
      if (subscriber.isActive) {
        return res.status(400).json({
          success: false,
          message: 'Cet email est déjà inscrit à la newsletter',
        });
      } else {
        // Réactiver l'abonnement
        subscriber.isActive = true;
        subscriber.subscribedAt = new Date();
        subscriber.unsubscribedAt = undefined;
        if (prenom) subscriber.prenom = prenom;
        if (nom) subscriber.nom = nom;
        if (preferences) subscriber.preferences = { ...subscriber.preferences, ...preferences };
        await subscriber.save();
      }
    } else {
      // Créer un nouveau abonnement
      subscriber = await Newsletter.create({
        email,
        prenom,
        nom,
        source: source || 'website',
        preferences: preferences || {
          newProducts: true,
          promotions: true,
          orderUpdates: false,
        },
      });
    }

    // Envoyer email de bienvenue
    try {
      await sendWelcomeEmail(subscriber.email, subscriber.prenom);
    } catch (emailError) {
      console.error('Erreur envoi email bienvenue newsletter:', emailError);
      // Ne pas faire échouer l'inscription si l'email ne part pas
    }

    res.status(201).json({
      success: true,
      message: 'Inscription à la newsletter réussie',
      data: {
        email: subscriber.email,
        prenom: subscriber.prenom,
        preferences: subscriber.preferences,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Se désinscrire de la newsletter
// @route   GET /api/newsletter/unsubscribe/:token
// @access  Public
export const unsubscribe = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token } = req.params;

    const subscriber = await Newsletter.findOne({ unsubscribeToken: token });

    if (!subscriber) {
      return next(new AppError('Token de désinscription invalide', 404));
    }

    subscriber.isActive = false;
    subscriber.unsubscribedAt = new Date();
    await subscriber.save();

    res.json({
      success: true,
      message: 'Désinscription réussie',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mettre à jour les préférences
// @route   PUT /api/newsletter/preferences/:token
// @access  Public
export const updatePreferences = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token } = req.params;
    const { preferences } = req.body;

    const subscriber = await Newsletter.findOne({ unsubscribeToken: token });

    if (!subscriber) {
      return next(new AppError('Token invalide', 404));
    }

    subscriber.preferences = { ...subscriber.preferences, ...preferences };
    await subscriber.save();

    res.json({
      success: true,
      message: 'Préférences mises à jour',
      data: subscriber.preferences,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtenir les statistiques de la newsletter (Admin)
// @route   GET /api/newsletter/stats
// @access  Private/Admin
export const getStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const totalSubscribers = await Newsletter.countDocuments({ isActive: true });
    const totalUnsubscribed = await Newsletter.countDocuments({ isActive: false });
    const recentSubscribers = await Newsletter.countDocuments({
      isActive: true,
      subscribedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    });

    // Statistiques par source
    const bySource = await Newsletter.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$source', count: { $sum: 1 } } },
    ]);

    // Statistiques par préférences
    const preferences = await Newsletter.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          newProducts: { $sum: { $cond: ['$preferences.newProducts', 1, 0] } },
          promotions: { $sum: { $cond: ['$preferences.promotions', 1, 0] } },
          orderUpdates: { $sum: { $cond: ['$preferences.orderUpdates', 1, 0] } },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        totalSubscribers,
        totalUnsubscribed,
        recentSubscribers,
        bySource,
        preferences: preferences[0] || { newProducts: 0, promotions: 0, orderUpdates: 0 },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtenir la liste des abonnés (Admin)
// @route   GET /api/newsletter/subscribers
// @access  Private/Admin
export const getSubscribers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page = '1', limit = '20', search, status } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Construire la requête
    const query: any = {};
    
    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { prenom: { $regex: search, $options: 'i' } },
        { nom: { $regex: search, $options: 'i' } },
      ];
    }

    const subscribers = await Newsletter.find(query)
      .sort({ subscribedAt: -1 })
      .limit(limitNum)
      .skip(skip)
      .select('-unsubscribeToken'); // Ne pas exposer le token

    const total = await Newsletter.countDocuments(query);

    res.json({
      success: true,
      count: subscribers.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: subscribers,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Envoyer une newsletter (Admin)
// @route   POST /api/newsletter/send
// @access  Private/Admin
export const sendNewsletter = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subject, content, type, targetPreference } = req.body;

    if (!subject || !content) {
      return res.status(400).json({
        success: false,
        message: 'Sujet et contenu requis',
      });
    }

    // Construire la requête pour les destinataires
    const query: any = { isActive: true };
    
    if (targetPreference && targetPreference !== 'all') {
      query[`preferences.${targetPreference}`] = true;
    }

    const subscribers = await Newsletter.find(query);

    if (subscribers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Aucun abonné trouvé pour ces critères',
      });
    }

    // Envoyer les emails (en batch pour éviter de surcharger)
    let sent = 0;
    let failed = 0;

    for (const subscriber of subscribers) {
      try {
        await sendNewsletterEmail([subscriber.email], subject, content);
        sent++;
      } catch (error) {
        console.error(`Erreur envoi newsletter à ${subscriber.email}:`, error);
        failed++;
      }
    }

    res.json({
      success: true,
      message: `Newsletter envoyée à ${sent} abonnés`,
      data: {
        sent,
        failed,
        total: subscribers.length,
      },
    });
  } catch (error) {
    next(error);
  }
};