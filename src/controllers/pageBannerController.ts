import { Request, Response, NextFunction } from 'express';
import PageBanner from '../models/PageBanner';

// @desc    Obtenir toutes les bannières
// @route   GET /api/page-banners
// @access  Private/Admin
export const getPageBanners = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const banners = await PageBanner.find().sort({ page: 1 });
    
    res.json({
      success: true,
      count: banners.length,
      data: banners,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtenir une bannière par page
// @route   GET /api/page-banners/:page
// @access  Public
export const getPageBannerByPage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const banner = await PageBanner.findOne({ 
      page: req.params.page,
      isActive: true 
    });
    
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Bannière non trouvée pour cette page',
      });
    }
    
    res.json({
      success: true,
      data: banner,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Créer une bannière
// @route   POST /api/page-banners
// @access  Private/Admin
export const createPageBanner = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page, title, subtitle, image, isActive } = req.body;
    
    // Vérifier si une bannière existe déjà pour cette page
    const existingBanner = await PageBanner.findOne({ page });
    if (existingBanner) {
      return res.status(400).json({
        success: false,
        message: 'Une bannière existe déjà pour cette page',
      });
    }
    
    const banner = await PageBanner.create({
      page,
      title,
      subtitle,
      image,
      isActive,
    });
    
    res.status(201).json({
      success: true,
      data: banner,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mettre à jour une bannière
// @route   PUT /api/page-banners/:id
// @access  Private/Admin
export const updatePageBanner = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { title, subtitle, image, isActive } = req.body;
    
    const banner = await PageBanner.findByIdAndUpdate(
      req.params.id,
      { title, subtitle, image, isActive },
      { new: true, runValidators: true }
    );
    
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Bannière non trouvée',
      });
    }
    
    res.json({
      success: true,
      data: banner,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Supprimer une bannière
// @route   DELETE /api/page-banners/:id
// @access  Private/Admin
export const deletePageBanner = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const banner = await PageBanner.findByIdAndDelete(req.params.id);
    
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Bannière non trouvée',
      });
    }
    
    res.json({
      success: true,
      message: 'Bannière supprimée avec succès',
    });
  } catch (error) {
    next(error);
  }
};
