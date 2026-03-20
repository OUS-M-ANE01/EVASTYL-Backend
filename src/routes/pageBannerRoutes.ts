import express from 'express';
import {
  getPageBanners,
  getPageBannerByPage,
  createPageBanner,
  updatePageBanner,
  deletePageBanner,
} from '../controllers/pageBannerController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

// Routes admin (protégées)
router.get('/', protect, authorize('admin'), getPageBanners);
router.post('/', protect, authorize('admin'), createPageBanner);
router.put('/:id', protect, authorize('admin'), updatePageBanner);
router.delete('/:id', protect, authorize('admin'), deletePageBanner);

// Route publique pour obtenir une bannière par page
router.get('/public/:page', getPageBannerByPage);

export default router;
