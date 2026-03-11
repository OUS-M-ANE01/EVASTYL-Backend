import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import Product from '../models/Product';
import Category from '../models/Category';
import { AppError } from '../middleware/error';
import { AuthRequest } from '../middleware/auth';

// @desc    Obtenir tous les produits
// @route   GET /api/products
// @access  Public
export const getProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { category, search, badge, minPrice, maxPrice, sort, limit = '50', page = '1' } = req.query;

    // Construire la requête
    const query: any = { isActive: true };

    if (category) {
      const cat = await Category.findOne({ id: category });
      if (cat) {
        query.category = cat._id;
      }
    }

    if (badge) {
      query.badge = badge;
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (search) {
      query.$text = { $search: search as string };
    }

    // Trier
    let sortOption: any = { createdAt: -1 };
    if (sort === 'price-asc') sortOption = { price: 1 };
    if (sort === 'price-desc') sortOption = { price: -1 };
    if (sort === 'name') sortOption = { name: 1 };
    if (sort === 'popular') sortOption = { views: -1, sales: -1 };

    // Pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const products = await Product.find(query)
      .populate('category')
      .sort(sortOption)
      .limit(limitNum)
      .skip(skip);

    const total = await Product.countDocuments(query);

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

// @desc    Obtenir un produit par ID
// @route   GET /api/products/:id
// @access  Public
export const getProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const product = await Product.findById(req.params.id).populate('category');

    if (!product) {
      return next(new AppError('Produit introuvable', 404));
    }

    // Incrémenter les vues
    product.views += 1;
    await product.save();

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Créer un produit
// @route   POST /api/products
// @access  Private/Admin
export const createProduct = async (
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

    // Récupérer la catégorie
    const category = await Category.findById(req.body.category);
    if (!category) {
      return next(new AppError('Catégorie introuvable', 404));
    }

    const product = await Product.create({
      ...req.body,
      categoryName: category.name,
    });

    // Mettre à jour le compteur de la catégorie
    category.count += 1;
    await category.save();

    res.status(201).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mettre à jour un produit
// @route   PUT /api/products/:id
// @access  Private/Admin
export const updateProduct = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return next(new AppError('Produit introuvable', 404));
    }

    // Si la catégorie a changé
    if (req.body.category && req.body.category !== product.category.toString()) {
      const oldCategory = await Category.findById(product.category);
      const newCategory = await Category.findById(req.body.category);

      if (!newCategory) {
        return next(new AppError('Nouvelle catégorie introuvable', 404));
      }

      // Mettre à jour les compteurs
      if (oldCategory) {
        oldCategory.count -= 1;
        await oldCategory.save();
      }
      newCategory.count += 1;
      await newCategory.save();

      req.body.categoryName = newCategory.name;
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Supprimer un produit
// @route   DELETE /api/products/:id
// @access  Private/Admin
export const deleteProduct = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return next(new AppError('Produit introuvable', 404));
    }

    // Mettre à jour le compteur de la catégorie
    const category = await Category.findById(product.category);
    if (category) {
      category.count -= 1;
      await category.save();
    }

    await product.deleteOne();

    res.json({
      success: true,
      message: 'Produit supprimé',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtenir produits vedettes
// @route   GET /api/products/featured
// @access  Public
export const getFeaturedProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const products = await Product.find({
      isActive: true,
      badge: { $in: ['new', 'bestseller'] },
    })
      .sort({ sales: -1, createdAt: -1 })
      .limit(8);

    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};
