import express from 'express';
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getFeaturedProducts,
} from '../controllers/productController';
import { protect, authorize } from '../middleware/auth';
import { productValidation, idValidation } from '../middleware/validation';

const router = express.Router();

// Routes publiques
router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/:id', idValidation, getProduct);

// Routes admin
router.post('/', protect, authorize('admin'), productValidation, createProduct);
router.put('/:id', protect, authorize('admin'), idValidation, updateProduct);
router.delete('/:id', protect, authorize('admin'), idValidation, deleteProduct);

export default router;
