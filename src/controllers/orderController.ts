import { Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import Order from '../models/Order';
import Product from '../models/Product';
import { AppError } from '../middleware/error';
import { AuthRequest } from '../middleware/auth';

// @desc    Créer une commande
// @route   POST /api/orders
// @access  Private
export const createOrder = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { items, shippingAddress, paymentMethod, subtotal, shippingCost, total, notes } = req.body;

    // Vérifier et récupérer les produits
    const orderItems = [];
    for (const item of items) {
      const product = await Product.findById(item.product);
      
      if (!product) {
        return next(new AppError(`Produit ${item.product} introuvable`, 404));
      }

      if (product.stock < item.quantity) {
        return next(new AppError(`Stock insuffisant pour ${product.name}`, 400));
      }

      // Mettre à jour le stock et les ventes
      product.stock -= item.quantity;
      product.sales += item.quantity;
      await product.save();

      orderItems.push({
        product: product._id,
        name: product.name,
        image: product.image,
        price: product.price,
        quantity: item.quantity,
      });
    }

    // Créer la commande
    const order = await Order.create({
      user: req.user!._id,
      items: orderItems,
      shippingAddress,
      paymentMethod,
      subtotal,
      shippingCost,
      total,
      notes,
    });

    // Populate pour avoir les infos complètes
    const populatedOrder = await Order.findById(order._id)
      .populate('user', 'nom prenom email')
      .populate('items.product');

    // Émettre l'événement Socket.IO vers les admins
    const io = req.app.get('io');
    if (io) {
      io.to('admin-room').emit('order:new', {
        order: populatedOrder,
        timestamp: new Date(),
      });
    }

    res.status(201).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtenir mes commandes (avec pagination)
// @route   GET /api/orders/my-orders?page=1&limit=10
// @access  Private
export const getMyOrders = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
    const skip = (page - 1) * limit;
 
    const [orders, total] = await Promise.all([
      Order.find({ user: req.user!._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('items.product'),
      Order.countDocuments({ user: req.user!._id }),
    ]);
 
    const pages = Math.ceil(total / limit);
 
    res.json({
      success: true,
      count: orders.length,
      total,
      page,
      pages,
      hasNextPage: page < pages,
      hasPrevPage: page > 1,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtenir une commande par ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrder = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'prenom nom email')
      .populate('items.product');

    if (!order) {
      return next(new AppError('Commande introuvable', 404));
    }

    // Vérifier que l'utilisateur est propriétaire ou admin
    if (
      order.user._id.toString() !== req.user!._id.toString() &&
      req.user!.role !== 'admin'
    ) {
      return next(new AppError('Non autorisé à accéder à cette commande', 403));
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtenir toutes les commandes (Admin)
// @route   GET /api/orders?status=pending&page=1&limit=20
// @access  Private/Admin
export const getAllOrders = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { status } = req.query;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    // Cap à 100 max pour éviter les requêtes abusives
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;
 
    const query: any = {};
    if (status) query.status = status;
 
    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('user', 'prenom nom email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments(query),
    ]);
 
    const pages = Math.ceil(total / limit);
 
    res.json({
      success: true,
      count: orders.length,
      total,
      page,
      pages,
      hasNextPage: page < pages,
      hasPrevPage: page > 1,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtenir stats commandes (Admin)
// @route   GET /api/orders/stats
// @access  Private/Admin
export const getOrderStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const total = await Order.countDocuments();
    const confirmed = await Order.countDocuments({ status: 'confirmed' });
    const pending = await Order.countDocuments({ status: 'pending' });
    const cancelled = await Order.countDocuments({ status: 'cancelled' });
    const delivered = await Order.countDocuments({ status: 'delivered' });
    const totalAmount = await Order.aggregate([
      { $group: { _id: null, sum: { $sum: '$total' } } }
    ]);
    res.json({
      success: true,
      stats: {
        total,
        confirmed,
        pending,
        cancelled,
        delivered,
        totalAmount: totalAmount[0]?.sum || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mettre à jour le statut d'une commande (Admin)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
export const updateOrderStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { status } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return next(new AppError('Commande introuvable', 404));
    }

    order.status = status;

    if (status === 'delivered') {
      order.deliveredAt = new Date();
    }

    await order.save();

    // Populate pour avoir les infos complètes
    const populatedOrder = await Order.findById(order._id)
      .populate('user', 'nom prenom email')
      .populate('items.product');

    // Émettre l'événement Socket.IO
    const io = req.app.get('io');
    if (io) {
      // Notifier les admins
      io.to('admin-room').emit('order:updated', {
        order: populatedOrder,
        timestamp: new Date(),
      });
      
      // Notifier l'utilisateur concerné
      if (populatedOrder) {
        io.emit(`user:${populatedOrder.user._id}:order:updated`, {
          order: populatedOrder,
          timestamp: new Date(),
        });
      }
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Marquer comme payé (Admin)
// @route   PUT /api/orders/:id/pay
// @access  Private/Admin
export const updateOrderToPaid = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return next(new AppError('Commande introuvable', 404));
    }

    order.isPaid = true;
    order.paidAt = new Date();
    order.status = 'confirmed';

    await order.save();

    // Populate pour avoir les infos complètes
    const populatedOrder = await Order.findById(order._id)
      .populate('user', 'nom prenom email')
      .populate('items.product');

    // Émettre l'événement Socket.IO
    const io = req.app.get('io');
    if (io) {
      // Notifier les admins
      io.to('admin-room').emit('order:updated', {
        order: populatedOrder,
        timestamp: new Date(),
      });
      
      // Notifier l'utilisateur concerné
      if (populatedOrder) {
        io.emit(`user:${populatedOrder.user._id}:order:updated`, {
          order: populatedOrder,
          timestamp: new Date(),
        });
      }
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Annuler une commande
// @route   PUT /api/orders/:id/cancel
// @access  Private
export const cancelOrder = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return next(new AppError('Commande introuvable', 404));
    }

    // Vérifier que l'utilisateur est propriétaire
    if (order.user.toString() !== req.user!._id.toString() && req.user!.role !== 'admin') {
      return next(new AppError('Non autorisé à annuler cette commande', 403));
    }

    // Seulement les commandes en attente peuvent être annulées
    if (['shipped', 'delivered'].includes(order.status)) {
      return next(new AppError('Cette commande ne peut plus être annulée', 400));
    }

    // Restaurer le stock
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product) {
        product.stock += item.quantity;
        product.sales -= item.quantity;
        await product.save();
      }
    }

    order.status = 'cancelled';
    await order.save();

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};
