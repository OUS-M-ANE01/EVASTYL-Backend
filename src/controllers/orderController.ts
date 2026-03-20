import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import Order from '../models/Order';
import Product from '../models/Product';
import { AppError } from '../middleware/error';

// @desc    Créer une commande
// @route   POST /api/orders
// @access  Private
export const createOrder = async (
  req: Request,
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

    const { items, shippingAddress, paymentMethod } = req.body;

    if (items && items.length === 0) {
      return next(new AppError('Aucun article dans la commande', 400));
    }

    // Calculer les prix
    let subtotal = 0;
    const itemsWithDetails = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return next(new AppError(`Produit ${item.product} introuvable`, 404));
      }

      const orderItem = {
        name: product.name,
        quantity: item.quantity,
        image: product.images?.[0] || '',
        price: product.price,
        product: product._id,
      };

      itemsWithDetails.push(orderItem);
      subtotal += product.price * item.quantity;
    }

    const shippingCost = subtotal > 100 ? 0 : 10;
    const total = subtotal + shippingCost;

    const order = await Order.create({
      items: itemsWithDetails,
      user: req.user!._id,
      shippingAddress,
      paymentMethod,
      subtotal,
      shippingCost,
      total,
    });

    res.status(201).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtenir mes commandes
// @route   GET /api/orders/myorders
// @access  Private
export const getMyOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page = '1', limit = '10' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const orders = await Order.find({ user: req.user!._id })
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip(skip);

    const total = await Order.countDocuments({ user: req.user!._id });

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

// @desc    Obtenir une commande par ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'prenom nom email');

    if (!order) {
      return next(new AppError('Commande introuvable', 404));
    }

    // Vérifier que l'utilisateur peut voir cette commande
    if (order.user._id.toString() !== req.user!._id.toString() && req.user!.role !== 'admin') {
      return next(new AppError('Non autorisé', 403));
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtenir toutes les commandes
// @route   GET /api/orders
// @access  Private/Admin
export const getAllOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page = '1', limit = '20', status } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const query: any = {};
    if (status) {
      query.status = status;
    }

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

// @desc    Obtenir les statistiques des commandes
// @route   GET /api/orders/stats
// @access  Private/Admin
export const getOrderStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    const completedOrders = await Order.countDocuments({ status: 'delivered' });
    
    const totalRevenue = await Order.aggregate([
      { $match: { status: 'delivered' } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);

    res.json({
      success: true,
      data: {
        totalOrders,
        pendingOrders,
        completedOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mettre à jour le statut d'une commande
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
export const updateOrderStatus = async (
  req: Request,
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

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Marquer une commande comme payée
// @route   PUT /api/orders/:id/pay
// @access  Private/Admin
export const updateOrderToPaid = async (
  req: Request,
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

    const updatedOrder = await order.save();

    res.json({
      success: true,
      data: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Annuler une commande
// @route   PUT /api/orders/:id/cancel
// @access  Private
export const cancelOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return next(new AppError('Commande introuvable', 404));
    }

    // Vérifier que l'utilisateur peut annuler cette commande
    if (order.user.toString() !== req.user!._id.toString() && req.user!.role !== 'admin') {
      return next(new AppError('Non autorisé', 403));
    }

    if (order.status === 'delivered') {
      return next(new AppError('Impossible d\'annuler une commande déjà livrée', 400));
    }

    order.status = 'cancelled';
    await order.save();

    res.json({
      success: true,
      message: 'Commande annulée',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// Réessayer le paiement d'une commande
export const retryPayment = async (req: Request, res: Response) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Commande introuvable'
      });
    }

    // Vérifier que l'utilisateur peut réessayer le paiement
    if (order.user.toString() !== req.user!._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé'
      });
    }

    if (order.isPaid) {
      return res.status(400).json({
        success: false,
        message: 'Cette commande est déjà payée'
      });
    }

    // Logique pour réinitialiser le paiement
    order.status = 'pending';
    await order.save();

    res.json({
      success: true,
      message: 'Paiement réinitialisé',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Annuler une commande
export const deleteOrder = async (req: Request, res: Response) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Commande introuvable'
      });
    }

    // Seuls les admins peuvent supprimer une commande
    if (req.user!.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé'
      });
    }

    await order.deleteOne();

    res.json({
      success: true,
      message: 'Commande supprimée'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};