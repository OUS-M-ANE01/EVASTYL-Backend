import { Request, Response, NextFunction } from 'express';
import Order from '../models/Order';
import Product from '../models/Product';
import { AuthRequest } from '../middleware/auth';
import {
  createNabooTransaction,
  getNabooTransaction,
  NabooPaymentMethod,
} from '../services/naboopayService';
import { sendOrderConfirmationEmail } from '../services/emailService';

/**
 * POST /api/payment/webhook
 * Reçoit les notifications en temps réel depuis NabooPay.
 * Appelé par NabooPay (pas par le frontend) — pas de middleware auth.
 *
 * Payload NabooPay attendu :
 * {
 *   order_id: string,        // naboo order_id
 *   status: 'PAID' | 'FAILED' | 'CANCELLED' | 'PENDING',
 *   amount: number,
 *   payment_method?: string,
 *   paid_at?: string,
 * }
 */
export const nabooWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Vérification du secret webhook (optionnel mais recommandé)
    const webhookSecret = process.env.NABOOPAY_WEBHOOK_SECRET;
    if (webhookSecret) {
      const receivedSecret = req.headers['x-naboo-webhook-secret'] || req.headers['x-webhook-secret'];
      if (receivedSecret !== webhookSecret) {
        console.warn('[Webhook] Secret invalide reçu:', receivedSecret);
        return res.status(401).json({ success: false, message: 'Secret webhook invalide' });
      }
    }

    const { order_id: nabooOrderId, transaction_status, paid_at } = req.body;

    // Log complet du payload NabooPay pour diagnostic
    console.log('[Webhook NabooPay] Headers:', JSON.stringify(req.headers, null, 2));
    console.log('[Webhook NabooPay] Body brut:', JSON.stringify(req.body, null, 2));

    if (!nabooOrderId || !transaction_status) {
      console.warn('[Webhook NabooPay] Payload incomplet — champs reçus:', Object.keys(req.body));
      return res.status(400).json({ success: false, message: 'Payload incomplet' });
    }

    // Normaliser le statut en majuscules (NabooPay envoie "paid", "failed", etc.)
    const status = (transaction_status as string).toUpperCase();

    console.log(`[Webhook NabooPay] order_id=${nabooOrderId} status=${status}`);

    // Retrouver la commande via l'identifiant NabooPay stocké dans notes
    const order = await Order.findOne({
      notes: new RegExp(`naboo_order_id:${nabooOrderId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`)  
    });

    if (!order) {
      // NabooPay peut relivrer — on répond 200 pour éviter les retries infinis
      console.warn(`[Webhook] Commande introuvable pour naboo_order_id: ${nabooOrderId}`);
      return res.status(200).json({ success: true, message: 'Commande introuvable, ignoré' });
    }

    // Idempotence : si déjà traitée, on ne fait rien
    if (order.isPaid && status === 'PAID') {
      return res.status(200).json({ success: true, message: 'Déjà traité' });
    }

    if (status === 'PAID') {
      // Déduire le stock
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: -item.quantity, sales: item.quantity },
        });
      }
      order.isPaid = true;
      order.paidAt = paid_at ? new Date(paid_at) : new Date();
      order.status = 'confirmed';
      await order.save();

      console.log(`[Webhook] Commande ${order._id} marquée comme payée via NabooPay`);

      // Envoyer email de confirmation au client
      sendOrderConfirmationEmail(order);

      // Émettre l'événement Socket.IO vers les admins (si disponible)
      const io = (req as any).app?.get('io');
      if (io) {
        io.to('admin-room').emit('order:paid', {
          orderId: order._id,
          orderNumber: order.orderNumber,
          timestamp: new Date(),
        });
      }
    } else if (status === 'FAILED' || status === 'CANCELLED') {
      order.status = 'cancelled';
      await order.save();
      console.log(`[Webhook] Commande ${order._id} annulée (status NabooPay: ${status})`);
    }

    // Toujours répondre 200 pour que NabooPay arrête les retries
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('[Webhook NabooPay] Erreur:', error);
    // Répondre 200 même en cas d'erreur interne pour éviter les retries NabooPay
    res.status(200).json({ success: false, message: 'Erreur interne' });
  }
};

export const initPayment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      items,           // [{ productId, quantity, price, name, image }]
      shippingAddress, // { prenom, nom, adresse, ville, telephone, email? }
      paymentMethods,  // ['WAVE'] | ['ORANGE_MONEY'] | ['WAVE','ORANGE_MONEY',...]
      deliveryCost,    // number (0, 6500, 9800)
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Panier vide' });
    }
    if (!paymentMethods || paymentMethods.length === 0) {
      return res.status(400).json({ success: false, message: 'Méthode de paiement requise' });
    }

    // Vérifier stock et construire les items de commande
    const orderItems = [];
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ success: false, message: `Produit introuvable: ${item.productId}` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ success: false, message: `Stock insuffisant: ${product.name}` });
      }
      orderItems.push({
        product: product._id,
        name: product.name,
        image: product.image,
        price: product.price,
        quantity: item.quantity,
        description: product.name, // Ajout pour respecter NabooProduct
      });
    }

    const subtotal = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const shipping = Number(deliveryCost) || 0;
    const total = subtotal + shipping;

    // Créer la commande en "pending" (pas encore payée)
    const order = await Order.create({
      user: req.user!._id,
      items: orderItems,
      shippingAddress: {
        prenom: shippingAddress.prenom,
        nom: shippingAddress.nom,
        rue: shippingAddress.adresse,
        ville: shippingAddress.ville,
        telephone: shippingAddress.telephone,
        email: shippingAddress.email || '',
        codePostal: shippingAddress.codePostal || '00000',
        pays: 'Sénégal',
      },
      paymentMethod: paymentMethods[0] === 'ORANGE_MONEY'
        ? 'orange-money'
        : paymentMethods[0] === 'FREE_MONEY'
        ? 'free-money'
        : paymentMethods[0].toLowerCase().replace('_', '-'),
      subtotal,
      shippingCost: shipping,
      total,
      status: 'pending',
      isPaid: false,
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    // NabooPay exige des URLs HTTPS publiques pour success/error
    // En dev on passe par le backend ngrok qui redirige ensuite vers le frontend localhost
    const backendPublicUrl = process.env.BACKEND_PUBLIC_URL || frontendUrl;

    // Construire la liste des produits NabooPay
    const nabooProducts = orderItems.map(it => ({
      name: it.name,
      price: Math.round(it.price),
      quantity: it.quantity,
      description: it.name, // Ajout pour respecter NabooProduct
    }));

    // Ajouter les frais de livraison comme ligne séparée si > 0
    if (shipping > 0) {
      nabooProducts.push({
        name: 'Frais de livraison',
        price: Math.round(shipping),
        quantity: 1,
        description: 'Livraison ASMA',
      });
    }

    // Format international pour le téléphone
    let phone = shippingAddress.telephone.trim();
    if (!phone.startsWith('+221')) {
      phone = '+221' + phone.replace(/^0+/, '');
    }

    // Méthode de paiement en minuscules
    const paymentMethodsLower = paymentMethods.map((m: string) => m.toLowerCase());

    // Créer la transaction NabooPay
    const nabooTx = await createNabooTransaction({
      method_of_payment: paymentMethodsLower as NabooPaymentMethod[],
      products: nabooProducts,
      customer: {
        first_name: shippingAddress.prenom.trim(),
        last_name: shippingAddress.nom.trim(),
        phone,
      },
      success_url: `${backendPublicUrl}/api/payment/redirect/success?order_id=${order._id}`,
      error_url: `${backendPublicUrl}/api/payment/redirect/error?order_id=${order._id}`,
    });

    // Sauvegarder l'identifiant NabooPay sur la commande (via notes)
    await Order.findByIdAndUpdate(order._id, {
      notes: `naboo_order_id:${nabooTx.order_id}`,
    });

    res.json({
      success: true,
      orderId: order._id,
      checkoutUrl: nabooTx.checkout_url,
      nabooOrderId: nabooTx.order_id,
    });
  } catch (error: any) {
    // Erreur NabooPay — renvoyer un message clair
    const nabooMsg = error?.response?.data?.error || error?.response?.data?.message || error?.response?.data?.detail;
    if (nabooMsg) {
      return res.status(502).json({
        success: false,
        message: `Erreur NabooPay : ${nabooMsg}`,
      });
    }
    next(error);
  }
};

/**
 * GET /api/payment/verify/:orderId
 * Vérifie le statut du paiement NabooPay et met à jour la commande.
 * 
 * FIXES:
 * 1. Si l'utilisateur est déconnecté (pas de req.user), on cherche la commande sans filtre user
 *    → évite le 404 quand NabooPay redirige et que la session a expiré
 * 2. Idempotence sur la déduction de stock (vérifie isPaid avant de déduire)
 */
export const verifyPayment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { orderId } = req.params;
    const { naboo_id } = req.query as { naboo_id: string };

    // Chercher la commande — avec filtre user si connecté, sans sinon
    // (NabooPay peut rediriger avant que le token soit rechargé côté frontend)
    const order = req.user
      ? await Order.findOne({ _id: orderId, user: req.user._id })
      : await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Commande introuvable' });
    }

    // Si déjà marquée payée → répondre directement sans rappeler NabooPay
    if (order.isPaid) {
      return res.json({ success: true, paid: true, order });
    }

    // Récupérer le naboo_order_id depuis l'URL ou depuis order.notes
    const nabooOrderId = naboo_id ||
      order.notes?.match(/naboo_order_id:([^\s]+)/)?.[1] ||
      '';

    if (!nabooOrderId) {
      return res.status(400).json({ success: false, message: 'Identifiant NabooPay introuvable' });
    }

    const tx = await getNabooTransaction(nabooOrderId);

    if (tx.status === 'PAID') {
      // Double-check idempotence : recharger depuis DB avant de modifier le stock
      // (le webhook a peut-être déjà tout traité entre temps)
      const freshOrder = await Order.findById(orderId);
      if (freshOrder?.isPaid) {
        return res.json({ success: true, paid: true, order: freshOrder });
      }

      // Déduire le stock
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: -item.quantity, sales: item.quantity },
        });
      }

      order.isPaid = true;
      order.paidAt = new Date();
      order.status = 'confirmed';
      await order.save();

      sendOrderConfirmationEmail(order);

      return res.json({ success: true, paid: true, order });
    }

    res.json({ success: true, paid: false, status: tx.status, order });
  } catch (error: any) {
    const nabooMsg =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      error?.response?.data?.detail;
    if (nabooMsg) {
      return res.status(502).json({ success: false, message: `Erreur NabooPay : ${nabooMsg}` });
    }
    next(error);
  }
};
