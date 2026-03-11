import { Router } from 'express';
import { protect, authorize } from '../middleware/auth';
import { uploadSingle, uploadMultiple, deleteImageByUrl } from '../controllers/uploadController';
import { uploadLimiter } from '../middleware/rateLimiter';

const router = Router();

// Protected routes (require authentication)
router.use(protect);

// Apply rate limiting to uploads
router.use(uploadLimiter);

// Upload single image
router.post('/single', uploadSingle);

// Upload multiple images (admin only)
router.post('/multiple', authorize('admin'), uploadMultiple);

// Delete image (admin only)
router.delete('/', authorize('admin'), deleteImageByUrl);

export default router;
