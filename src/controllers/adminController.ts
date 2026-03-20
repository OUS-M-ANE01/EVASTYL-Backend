import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import Product from '../models/Product';
import Order from '../models/Order';
import Category from '../models/Category';

// @desc    Obtenir les statistiques du dashboard
// @route   GET /api/admin/stats
// @access  Private/Admin
export const getStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Statistiques générales - compter tous les utilisateurs sauf les admins
    const totalUsers = await User.countDocuments({ role: { $ne: 'admin' } });
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalCategories = await Category.countDocuments();

    // Revenus
    const totalRevenue = await Order.aggregate([
      { $match: { isPaid: true } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);

    // Commandes par statut
    const ordersByStatus = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Produits les plus vendus
    const topProducts = await Product.find()
      .sort({ sales: -1 })
      .limit(5)
      .select('name sales price images image');

    // Produits en stock faible
    const lowStockProducts = await Product.find({
      stock: { $lte: 10 },
      isActive: true
    })
      .sort({ stock: 1 })
      .limit(5)
      .select('name stock images image');

    // Commandes récentes
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'prenom nom')
      .select('orderNumber user total status createdAt isPaid');

    // Utilisateurs récents (tous sauf admins)
    const recentUsers = await User.find({ role: { $ne: 'admin' } })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('prenom nom email createdAt');

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalProducts,
          totalOrders,
          totalCategories,
          totalRevenue: totalRevenue[0]?.total || 0,
        },
        ordersByStatus,
        topProducts: topProducts.map(p => ({
          _id: p._id,
          name: p.name,
          image: p.images?.[0] || p.image || '/placeholder-product.jpg',
          price: p.price,
          sales: p.sales || 0
        })),
        lowStockProducts: lowStockProducts.map(p => ({
          _id: p._id,
          name: p.name,
          image: p.images?.[0] || p.image || '/placeholder-product.jpg',
          stock: p.stock
        })),
        recentOrders,
        recentUsers,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtenir les données de ventes
// @route   GET /api/admin/sales
// @access  Private/Admin
export const getSalesData = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { period = '7d' } = req.query;

    let dateFilter: Date;
    const now = new Date();

    switch (period) {
      case '24h':
        dateFilter = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
      case 'week':
        dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
      case 'month':
        dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
      case 'year':
        dateFilter = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Ventes par jour
    const salesByDayRaw = await Order.aggregate([
      {
        $match: {
          isPaid: true,
          createdAt: { $gte: dateFilter }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          totalSales: { $sum: '$total' },
          orderCount: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    // Remplir les jours manquants avec des valeurs à 0
    const salesByDay = [];
    const daysToShow = period === 'week' || period === '7d' ? 7 : 
                       period === 'month' || period === '30d' ? 30 : 365;
    
    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      
      // Chercher si on a des données pour ce jour
      const existingData = salesByDayRaw.find((item: any) => 
        item._id.year === year && 
        item._id.month === month && 
        item._id.day === day
      );
      
      salesByDay.push({
        _id: { year, month, day },
        totalSales: existingData ? existingData.totalSales : 0,
        orderCount: existingData ? existingData.orderCount : 0
      });
    }

    // Ventes par catégorie
    const salesByCategory = await Order.aggregate([
      {
        $match: {
          isPaid: true,
          createdAt: { $gte: dateFilter }
        }
      },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $lookup: {
          from: 'categories',
          localField: 'product.category',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: '$category' },
      {
        $group: {
          _id: '$category.name',
          totalSales: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          itemsSold: { $sum: '$items.quantity' }
        }
      },
      { $sort: { totalSales: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        salesByDay,
        salesByCategory,
        period,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtenir la liste des utilisateurs
// @route   GET /api/admin/users
// @access  Private/Admin
export const getUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page = '1', limit = '20', search, role } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Construire la requête
    const query: any = {};

    if (search) {
      query.$or = [
        { prenom: { $regex: search, $options: 'i' } },
        { nom: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (role) {
      query.role = role;
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip(skip);

    const total = await User.countDocuments(query);

    // Statistiques des utilisateurs
    const userStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      count: users.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: users,
      stats: userStats,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtenir les notifications admin
// @route   GET /api/admin/notifications
// @access  Private/Admin
export const getNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Commandes en attente
    const pendingOrders = await Order.countDocuments({ status: 'pending' });

    // Produits en rupture de stock
    const outOfStockProducts = await Product.countDocuments({
      stock: { $lte: 5 },
      isActive: true
    });

    // Nouveaux utilisateurs aujourd'hui (tous sauf admins)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const newUsersToday = await User.countDocuments({
      createdAt: { $gte: today },
      role: { $ne: 'admin' }
    });

    // Commandes récentes non traitées
    const recentUnprocessedOrders = await Order.find({
      status: 'pending',
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    })
    .populate('user', 'prenom nom email')
    .sort({ createdAt: -1 })
    .limit(5);

    const notifications = [
      {
        type: 'orders',
        title: 'Commandes en attente',
        count: pendingOrders,
        priority: pendingOrders > 10 ? 'high' : 'medium',
      },
      {
        type: 'stock',
        title: 'Produits en rupture de stock',
        count: outOfStockProducts,
        priority: outOfStockProducts > 0 ? 'high' : 'low',
      },
      {
        type: 'users',
        title: 'Nouveaux utilisateurs aujourd\'hui',
        count: newUsersToday,
        priority: 'low',
      },
    ];

    res.json({
      success: true,
      data: {
        notifications,
        recentUnprocessedOrders,
      },
    });
  } catch (error) {
    next(error);
  }
};
