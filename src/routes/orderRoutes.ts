import express from 'express';
import {
  createOrder,
  getMyOrders,
  getOrder,
  getAllOrders,
  updateOrderStatus,
  updateOrderToPaid,
  cancelOrder,
} from '../controllers/orderController';
import { protect, authorize } from '../middleware/auth';
import { orderValidation, idValidation } from '../middleware/validation';

const router = express.Router();

// Routes clients
router.post('/', protect, orderValidation, createOrder);
router.get('/my-orders', protect, getMyOrders);
router.get('/:id', protect, idValidation, getOrder);
router.put('/:id/cancel', protect, idValidation, cancelOrder);

// Routes admin
router.get('/', protect, authorize('admin'), getAllOrders);
router.put('/:id/status', protect, authorize('admin'), idValidation, updateOrderStatus);
router.put('/:id/pay', protect, authorize('admin'), idValidation, updateOrderToPaid);

export default router;
