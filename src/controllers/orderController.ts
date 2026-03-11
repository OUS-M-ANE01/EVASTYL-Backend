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

// @desc    Obtenir mes commandes
// @route   GET /api/orders/my-orders
// @access  Private
export const getMyOrders = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const orders = await Order.find({ user: req.user!._id })
      .sort({ createdAt: -1 })
      .populate('items.product');

    res.json({
      success: true,
      count: orders.length,
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
// @route   GET /api/orders
// @access  Private/Admin
export const getAllOrders = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { status, page = '1', limit = '20' } = req.query;

    const query: any = {};
    if (status) {
      query.status = status;
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const orders = await Order.find(query)
      .populate('user', 'prenom nom email')
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip(skip);

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      count: orders.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: orders,
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
