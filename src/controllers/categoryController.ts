import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import Category from '../models/Category';
import Product from '../models/Product';
import { AppError } from '../middleware/error';

// @desc    Obtenir toutes les catégories
// @route   GET /api/categories
// @access  Public
export const getCategories = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ name: 1 });

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
    const category = await Category.findById(req.params.id);

    if (!category) {
      return next(new AppError('Catégorie introuvable', 404));
    }

    res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtenir les produits d'une catégorie
// @route   GET /api/categories/:id/products
// @access  Public
export const getCategoryProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { limit = '20', page = '1' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const products = await Product.find({
      category: req.params.id,
      isActive: true,
    })
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip(skip);

    const total = await Product.countDocuments({
      category: req.params.id,
      isActive: true,
    });

    res.json({
      success: true,
      count: products.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Créer une catégorie
// @route   POST /api/categories
// @access  Private/Admin
export const createCategory = async (
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
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let category = await Category.findById(req.params.id);

    if (!category) {
      return next(new AppError('Catégorie introuvable', 404));
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
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return next(new AppError('Catégorie introuvable', 404));
    }

    // Vérifier s'il y a des produits dans cette catégorie
    const productsCount = await Product.countDocuments({ category: req.params.id });
    if (productsCount > 0) {
      return next(new AppError('Impossible de supprimer une catégorie contenant des produits', 400));
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