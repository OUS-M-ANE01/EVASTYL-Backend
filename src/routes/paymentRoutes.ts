import express, { Request, Response } from 'express';
import { initPayment, verifyPayment, refundOrder, nabooWebhook } from '../controllers/paymentController';
import { protect, authorize } from '../middleware/auth';
import { getOrderStats } from '../controllers/orderController';

const router = express.Router();

// POST /api/payment/webhook — Webhook NabooPay pour les notifications de paiement (sans auth)
router.post('/webhook', nabooWebhook);

// GET /api/payment/redirect/success
// NabooPay redirige ici après paiement réussi, on forward vers le frontend
router.get('/redirect/success', async (req: Request, res: Response) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const { order_id } = req.query;

  if (!order_id) {
    return res.redirect(`${frontendUrl}/#commande-echec`);
  }

  try {
    // Récupérer le naboo_order_id depuis la commande pour le transmettre au frontend
    const Order = (await import('../models/Order')).default;
    const order = await Order.findById(order_id);
    const nabooId = order?.notes?.match(/naboo_order_id:([^\s]+)/)?.[1] ?? '';

    res.redirect(`${frontendUrl}/#commande-succes?order_id=${order_id}&naboo_id=${nabooId}`);
  } catch {
    // En cas d'erreur DB, on redirige quand même vers succès avec juste l'order_id
    // Le verify récupérera naboo_id depuis les notes de toute façon
    res.redirect(`${frontendUrl}/#commande-succes?order_id=${order_id}`);
  }
});

// GET /api/payment/redirect/error — NabooPay redirige ici après échec
router.get('/redirect/error', (req: Request, res: Response) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const { order_id } = req.query;
  res.redirect(`${frontendUrl}/#commande-echec?order_id=${order_id ?? ''}`);
});

// POST /api/payment/init — Initier une transaction NabooPay
router.post('/init', protect, initPayment);

// GET /api/payment/verify/:orderId?naboo_id=xxx — Vérifier le statut du paiement
// Note: naboo_id est optionnel, le controller le récupère depuis order.notes si absent
router.get('/verify/:orderId', protect, verifyPayment);

// GET /api/payment/refund/:orderId — Rembourser une commande (Admin) - GET pour compatibilité
router.get('/refund/:orderId', protect, authorize('admin'), refundOrder);

// POST /api/payment/refund/:orderId — Rembourser une commande (Admin) - POST standard
router.post('/refund/:orderId', protect, authorize('admin'), refundOrder);

// GET /api/payment/stats — Récupère les stats des commandes (Admin)
router.get('/stats', protect, authorize('admin'), getOrderStats);

export default router;