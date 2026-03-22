import express from 'express';
import {
  register,
  login,
  getMe,
  updateProfile,
  updatePassword,
  toggleFavorite,
  firebaseLogin,
  verifyEmailOTP,
} from '../controllers/authController';
// Connexion sociale Google (Firebase)
import { protect } from '../middleware/auth';
import { registerValidation, loginValidation } from '../middleware/validation';
import { authLimiter } from '../middleware/rateLimiter';

const router = express.Router();
router.post('/firebase', firebaseLogin);

// Apply rate limiting to authentication routes
router.post('/register', authLimiter, registerValidation, register);
router.post('/login', authLimiter, loginValidation, login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, updatePassword);
router.put('/favoris/:productId', protect, toggleFavorite);
router.post('/verify-email', verifyEmailOTP);

export default router;
