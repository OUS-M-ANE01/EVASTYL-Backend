import express from 'express';
import { getActiveTestimonials, getContentBySection } from '../controllers/contentController';

const router = express.Router();

// Routes publiques sans authentification
router.get('/testimonials', getActiveTestimonials);
router.get('/content/:section', getContentBySection);

export default router;
