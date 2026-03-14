import express from 'express';
import { getStats, getSalesData, getUsers, getNotifications } from '../controllers/adminController';
import { 
  getSettings, 
  updateSettings,
  getTestimonials,
  getActiveTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  getContentBySection,
  updateContentBySection,
  getCategories,
  updateCategory
} from '../controllers/contentController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

// Toutes les routes admin nécessitent authentification et rôle admin
router.use(protect);
router.use(authorize('admin'));

// Stats & Users
router.get('/stats', getStats);
router.get('/sales', getSalesData);
router.get('/users', getUsers);

// Notifications
router.get('/notifications', getNotifications);

// Settings
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

// Testimonials
router.get('/testimonials', getTestimonials);
router.get('/testimonials/active', getActiveTestimonials);
router.post('/testimonials', createTestimonial);
router.put('/testimonials/:id', updateTestimonial);
router.delete('/testimonials/:id', deleteTestimonial);

// Site Content (hero, banner, about, contact, instagram)
router.get('/content/:section', getContentBySection);
router.put('/content/:section', updateContentBySection);

// Categories
router.get('/categories', getCategories);
router.put('/categories/:id', updateCategory);

export default router;
