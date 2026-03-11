import { v2 as cloudinary } from 'cloudinary';
import { Request } from 'express';
import multer from 'multer';
import { Readable } from 'stream';

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Verify configuration
const verifyCloudinaryConfig = () => {
  const { cloud_name, api_key, api_secret } = cloudinary.config();
  
  if (!cloud_name || !api_key || !api_secret) {
    console.warn('⚠️  Cloudinary non configuré. Vérifiez vos variables d\'environnement:');
    console.warn('   - CLOUDINARY_CLOUD_NAME');
    console.warn('   - CLOUDINARY_API_KEY');
    console.warn('   - CLOUDINARY_API_SECRET');
    return false;
  }
  
  console.log('✅ Cloudinary configuré:', cloud_name);
  return true;
};

// Configuration de Multer avec stockage en mémoire
const storage = multer.memoryStorage();

// Configuration de Multer
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (req, file, cb) => {
    // Vérifier le type de fichier
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seules les images sont acceptées'));
    }
  },
});

// Helper pour uploader vers Cloudinary
export const uploadToCloudinary = (
  buffer: Buffer,
  folder: string = 'evastyl'
): Promise<any> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'],
        transformation: [
          { width: 1000, height: 1000, crop: 'limit' },
          { quality: 'auto' },
          { fetch_format: 'auto' },
        ],
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
    
    const stream = Readable.from(buffer);
    stream.pipe(uploadStream);
  });
};

// Helper pour supprimer une image de Cloudinary
export const deleteImage = async (publicId: string): Promise<boolean> => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'image:', error);
    return false;
  }
};

// Helper pour extraire le public_id d'une URL Cloudinary
export const extractPublicId = (url: string): string | null => {
  try {
    // Format: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{public_id}.{format}
    const regex = /\/upload\/(?:v\d+\/)?(.+)\.\w+$/;
    const match = url.match(regex);
    return match ? match[1] : null;
  } catch (error) {
    return null;
  }
};

// Verify config on import
verifyCloudinaryConfig();

export default cloudinary;
