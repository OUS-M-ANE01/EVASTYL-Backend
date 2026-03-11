import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import Category from '../models/Category';
import Product from '../models/Product';
import { AppError } from '../middleware/error';
import { AuthRequest } from '../middleware/auth';

// @desc    Obtenir toutes les catégories
// @route   GET /api/categories
// @access  Public
export const getCategories = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ order: 1 });

    res.json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtenir une catégorie par ID
// @route   GET /api/categories/:id
// @access  Public
export const getCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const category = await Category.findOne({
      $or: [{ _id: req.params.id }, { id: req.params.id }],
    });

    if (!category) {
      return next(new AppError('Catégorie introuvable', 404));
    }

    // Récupérer les produits de cette catégorie
    const products = await Product.find({
      category: category._id,
      isActive: true,
    }).limit(12);

    res.json({
      success: true,
      data: {
        category,
        products,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Créer une catégorie
// @route   POST /api/categories
// @access  Private/Admin
export const createCategory = async (
  req: AuthRequest,
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

    const category = await Category.create(req.body);

    res.status(201).json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mettre à jour une catégorie
// @route   PUT /api/categories/:id
// @access  Private/Admin
export const updateCategory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    let category = await Category.findById(req.params.id);

    if (!category) {
      return next(new AppError('Catégorie introuvable', 404));
    }

    // Si le nom a changé, mettre à jour tous les produits
    if (req.body.name && req.body.name !== category.name) {
      await Product.updateMany(
        { category: category._id },
        { categoryName: req.body.name }
      );
    }

    category = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Supprimer une catégorie
// @route   DELETE /api/categories/:id
// @access  Private/Admin
export const deleteCategory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return next(new AppError('Catégorie introuvable', 404));
    }

    // Vérifier s'il y a des produits dans cette catégorie
    const productCount = await Product.countDocuments({ category: category._id });
    
    if (productCount > 0) {
      return next(
        new AppError(
          `Impossible de supprimer cette catégorie car elle contient ${productCount} produit(s)`,
          400
        )
      );
    }

    await category.deleteOne();

    res.json({
      success: true,
      message: 'Catégorie supprimée',
    });
  } catch (error) {
    next(error);
  }
};
