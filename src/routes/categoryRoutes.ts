import express from 'express';
import {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController';
import { protect, authorize } from '../middleware/auth';
import { categoryValidation, idValidation } from '../middleware/validation';

const router = express.Router();

// Routes publiques
router.get('/', getCategories);
router.get('/:id', getCategory);

// Routes admin
router.post('/', protect, authorize('admin'), categoryValidation, createCategory);
router.put('/:id', protect, authorize('admin'), idValidation, updateCategory);
router.delete('/:id', protect, authorize('admin'), idValidation, deleteCategory);

export default router;
