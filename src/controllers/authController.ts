import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import { AppError } from '../middleware/error';

// Générer JWT Token
const generateToken = (id: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET not defined');
  }
  const expiresIn = process.env.JWT_EXPIRE || '7d';
  // @ts-ignore - Type issue with jsonwebtoken SignOptions
  return jwt.sign({ id }, secret, { expiresIn });
};

// @desc    Inscription
// @route   POST /api/auth/register
// @access  Public
export const register = async (
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

    const { prenom, nom, email, password } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const userExists = await User.findOne({ email });
    if (userExists) {
      return next(new AppError('Cet email est déjà utilisé', 400));
    }

    // Créer l'utilisateur
    const user = await User.create({
      prenom,
      nom,
      email,
      password,
    });

    // Générer token
    const token = generateToken(user._id.toString());

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id,
          prenom: user.prenom,
          nom: user.nom,
          email: user.email,
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Connexion
// @route   POST /api/auth/login
// @access  Public
export const login = async (
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

    const { email, password } = req.body;

    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return next(new AppError('Email ou mot de passe incorrect', 401));
    }

    // Vérifier le mot de passe
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return next(new AppError('Email ou mot de passe incorrect', 401));
    }

    // Générer token
    const token = generateToken(user._id.toString());

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          prenom: user.prenom,
          nom: user.nom,
          email: user.email,
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtenir profil utilisateur
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await User.findById(req.user!._id).populate('favoris');

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mettre à jour profil
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const fieldsToUpdate = {
      prenom: req.body.prenom,
      nom: req.body.nom,
      telephone: req.body.telephone,
      dateNaissance: req.body.dateNaissance,
      adresse: req.body.adresse,
    };

    const user = await User.findByIdAndUpdate(
      req.user!._id,
      fieldsToUpdate,
      {
        new: true,
        runValidators: true,
      }
    );

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Changer mot de passe
// @route   PUT /api/auth/password
// @access  Private
export const updatePassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user!._id).select('+password');

    if (!user) {
      return next(new AppError('Utilisateur introuvable', 404));
    }

    // Vérifier le mot de passe actuel
    const isPasswordCorrect = await user.comparePassword(currentPassword);
    if (!isPasswordCorrect) {
      return next(new AppError('Mot de passe actuel incorrect', 401));
    }

    // Mettre à jour le mot de passe
    user.password = newPassword;
    await user.save();

    // Générer nouveau token
    const token = generateToken(user._id.toString());

    res.json({
      success: true,
      message: 'Mot de passe mis à jour avec succès',
      data: { token },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Ajouter/Retirer des favoris
// @route   PUT /api/auth/favoris/:productId
// @access  Private
export const toggleFavorite = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productId } = req.params;
    const user = await User.findById(req.user!._id);

    if (!user) {
      return next(new AppError('Utilisateur introuvable', 404));
    }

    const index = user.favoris.indexOf(productId as any);

    if (index > -1) {
      // Retirer des favoris
      user.favoris.splice(index, 1);
    } else {
      // Ajouter aux favoris
      user.favoris.push(productId as any);
    }

    await user.save();

    res.json({
      success: true,
      data: user.favoris,
    });
  } catch (error) {
    next(error);
  }
};