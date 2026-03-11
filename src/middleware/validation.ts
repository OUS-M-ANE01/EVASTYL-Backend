import { body, param, query } from 'express-validator';

export const registerValidation = [
  body('prenom')
    .trim()
    .notEmpty()
    .withMessage('Le prénom est requis')
    .isLength({ min: 2 })
    .withMessage('Le prénom doit contenir au moins 2 caractères'),
  
  body('nom')
    .trim()
    .notEmpty()
    .withMessage('Le nom est requis')
    .isLength({ min: 2 })
    .withMessage('Le nom doit contenir au moins 2 caractères'),
  
  body('email')
    .trim()
    .notEmpty()
    .withMessage("L'email est requis")
    .isEmail()
    .withMessage('Email invalide')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Le mot de passe est requis')
    .isLength({ min: 6 })
    .withMessage('Le mot de passe doit contenir au moins 6 caractères'),
];

export const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage("L'email est requis")
    .isEmail()
    .withMessage('Email invalide')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Le mot de passe est requis'),
];

export const productValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Le nom du produit est requis'),
  
  body('price')
    .notEmpty()
    .withMessage('Le prix est requis')
    .isFloat({ min: 0 })
    .withMessage('Le prix doit être un nombre positif'),
  
  body('category')
    .notEmpty()
    .withMessage('La catégorie est requise'),
  
  body('stock')
    .notEmpty()
    .withMessage('Le stock est requis')
    .isInt({ min: 0 })
    .withMessage('Le stock doit être un nombre entier positif'),
];

export const orderValidation = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('La commande doit contenir au moins un produit'),
  
  body('shippingAddress.prenom')
    .trim()
    .notEmpty()
    .withMessage('Le prénom est requis'),
  
  body('shippingAddress.nom')
    .trim()
    .notEmpty()
    .withMessage('Le nom est requis'),
  
  body('shippingAddress.email')
    .trim()
    .notEmpty()
    .withMessage("L'email est requis")
    .isEmail()
    .withMessage('Email invalide'),
  
  body('shippingAddress.telephone')
    .trim()
    .notEmpty()
    .withMessage('Le téléphone est requis'),
  
  body('shippingAddress.rue')
    .trim()
    .notEmpty()
    .withMessage("L'adresse est requise"),
  
  body('shippingAddress.ville')
    .trim()
    .notEmpty()
    .withMessage('La ville est requise'),
  
  body('paymentMethod')
    .notEmpty()
    .withMessage('Le mode de paiement est requis')
    .isIn(['carte', 'wave', 'orange-money', 'paypal', 'cod'])
    .withMessage('Mode de paiement invalide'),
];

export const categoryValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Le nom de la catégorie est requis'),
  
  body('id')
    .trim()
    .notEmpty()
    .withMessage("L'identifiant est requis")
    .matches(/^[a-z0-9-]+$/)
    .withMessage("L'identifiant doit contenir uniquement des lettres minuscules, chiffres et tirets"),
];

export const reviewValidation = [
  body('rating')
    .notEmpty()
    .withMessage('La note est requise')
    .isInt({ min: 1, max: 5 })
    .withMessage('La note doit être entre 1 et 5'),
  
  body('comment')
    .trim()
    .notEmpty()
    .withMessage('Le commentaire est requis')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Le commentaire doit contenir entre 10 et 1000 caractères'),
];

export const idValidation = [
  param('id')
    .isMongoId()
    .withMessage('ID invalide'),
];
