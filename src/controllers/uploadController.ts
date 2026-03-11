import { Request, Response, NextFunction } from 'express';
import { upload, uploadToCloudinary, deleteImage, extractPublicId } from '../config/cloudinary';

// Upload une seule image
export const uploadSingle = async (req: Request, res: Response, next: NextFunction) => {
  upload.single('image')(req, res, async (err: any) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'Erreur lors de l\'upload',
      });
    }
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier fourni',
      });
    }
    
    try {
      const folder = req.body.folder || 'evastyl';
      const result = await uploadToCloudinary(req.file.buffer, folder);
      
      // Retourner l'URL de l'image uploadée
      res.status(200).json({
        success: true,
        message: 'Image uploadée avec succès',
        data: {
          url: result.secure_url,
          publicId: result.public_id,
          size: result.bytes,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Erreur lors de l\'upload vers Cloudinary',
      });
    }
  });
};

// Upload plusieurs images
export const uploadMultiple = async (req: Request, res: Response, next: NextFunction) => {
  upload.array('images', 10)(req, res, async (err: any) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'Erreur lors de l\'upload',
      });
    }
    
    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier fourni',
      });
    }
    
    try {
      const files = req.files as Express.Multer.File[];
      const folder = req.body.folder || 'evastyl';
      
      // Upload tous les fichiers en parallèle
      const uploadPromises = files.map(file => uploadToCloudinary(file.buffer, folder));
      const results = await Promise.all(uploadPromises);
      
      const uploadedFiles = results.map(result => ({
        url: result.secure_url,
        publicId: result.public_id,
        size: result.bytes,
      }));
      
      res.status(200).json({
        success: true,
        message: `${uploadedFiles.length} image(s) uploadée(s) avec succès`,
        data: uploadedFiles,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Erreur lors de l\'upload vers Cloudinary',
      });
    }
  });
};

// Supprimer une image
export const deleteImageByUrl = async (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'URL de l\'image requise',
      });
    }
    
    const publicId = extractPublicId(url);
    
    if (!publicId) {
      return res.status(400).json({
        success: false,
        message: 'URL invalide',
      });
    }
    
    const deleted = await deleteImage(publicId);
    
    if (deleted) {
      res.status(200).json({
        success: true,
        message: 'Image supprimée avec succès',
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Impossible de supprimer l\'image',
      });
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur serveur',
    });
  }
};
