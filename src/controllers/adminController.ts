import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import User from '../models/User';
import Product from '../models/Product';
import Order from '../models/Order';
import Category from '../models/Category';

// @desc    Obtenir les statistiques globales
// @route   GET /api/admin/stats
// @access  Private/Admin
export const getStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Statistiques générales
    const totalUsers = await User.countDocuments({ role: 'client' });
    const totalProducts = await Product.countDocuments({ isActive: true });
    const totalOrders = await Order.countDocuments({});
    const totalCategories = await Category.countDocuments({ isActive: true });

    // Statistiques de commandes
    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    const confirmedOrders = await Order.countDocuments({ status: 'confirmed' });
    const shippedOrders = await Order.countDocuments({ status: 'shipped' });
    const deliveredOrders = await Order.countDocuments({ status: 'delivered' });

    // Revenus
    const paidOrders = await Order.find({ isPaid: true });
    const totalRevenue = paidOrders.reduce((sum, order) => sum + order.total, 0);

    // Revenus du mois en cours
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthOrders = await Order.find({
      isPaid: true,
      createdAt: { $gte: firstDayOfMonth },
    });
    const monthRevenue = monthOrders.reduce((sum, order) => sum + order.total, 0);

    // Produits les plus vendus
    const topProducts = await Product.find({ isActive: true })
      .sort({ sales: -1 })
      .limit(5)
      .select('name image price sales');

    // Produits en rupture de stock ou stock faible
    const lowStockProducts = await Product.find({
      isActive: true,
      stock: { $lte: 5 },
    })
      .sort({ stock: 1 })
      .limit(10)
      .select('name image stock');

    // Dernières commandes
    const recentOrders = await Order.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'prenom nom email')
      .select('orderNumber total status createdAt isPaid');

    // Nouveaux clients du mois
    const newUsersThisMonth = await User.countDocuments({
      role: 'client',
      createdAt: { $gte: firstDayOfMonth },
    });

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalProducts,
          totalOrders,
          totalCategories,
          totalRevenue,
          monthRevenue,
          newUsersThisMonth,
        },
        orders: {
          pending: pendingOrders,
          confirmed: confirmedOrders,
          shipped: shippedOrders,
          delivered: deliveredOrders,
        },
        topProducts,
        lowStockProducts,
        recentOrders,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtenir les ventes par période
// @route   GET /api/admin/sales?period=week|month|year
// @access  Private/Admin
export const getSalesData = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { period = 'month' } = req.query;

    let startDate = new Date();
    let groupBy: any;

    if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
      groupBy = {
        $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
      };
    } else if (period === 'month') {
      startDate.setMonth(startDate.getMonth() - 1);
      groupBy = {
        $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
      };
    } else {
      startDate.setFullYear(startDate.getFullYear() - 1);
      groupBy = {
        $dateToString: { format: '%Y-%m', date: '$createdAt' },
      };
    }

    const salesData = await Order.aggregate([
      {
        $match: {
          isPaid: true,
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: groupBy,
          totalSales: { $sum: '$total' },
          orderCount: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    res.json({
      success: true,
      data: salesData,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtenir les utilisateurs
// @route   GET /api/admin/users
// @access  Private/Admin
export const getUsers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page = '1', limit = '20', search } = req.query;

    const query: any = { role: 'client' };

    if (search) {
      query.$or = [
        { prenom: { $regex: search, $options: 'i' } },
        { nom: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip(skip)
      .select('-password');

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      count: users.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: users,
    });
  } catch (error) {
    next(error);
  }
};
