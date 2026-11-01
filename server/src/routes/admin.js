import { Router } from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import User from '../models/User.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/error.js';

const router = Router();
router.use(protect, adminOnly);

router.get(
  '/stats',
  asyncHandler(async (req, res) => {
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - 13);

    const [revenueAgg, byStatus, daily, recentOrders, lowStock, topProducts, counts] = await Promise.all([
      Order.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $group: { _id: null, revenue: { $sum: '$grandTotal' }, orders: { $sum: 1 } } },
      ]),
      Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Order.aggregate([
        { $match: { createdAt: { $gte: since }, status: { $ne: 'cancelled' } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            revenue: { $sum: '$grandTotal' },
            orders: { $sum: 1 },
          },
        },
      ]),
      Order.find().populate('user', 'name email').sort({ createdAt: -1 }).limit(6),
      Product.find({ stock: { $lte: 5 } }).select('name stock slug images').sort({ stock: 1 }).limit(6),
      Order.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $unwind: '$items' },
        { $group: { _id: '$items.product', name: { $first: '$items.name' }, sold: { $sum: '$items.quantity' }, revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
        { $sort: { sold: -1 } },
        { $limit: 5 },
      ]),
      Promise.all([Product.countDocuments(), Category.countDocuments(), User.countDocuments({ role: 'customer' })]),
    ]);

    // Fill missing days so the chart always has 14 bars.
    const dailyMap = Object.fromEntries(daily.map((d) => [d._id, d]));
    const series = Array.from({ length: 14 }, (_, i) => {
      const d = new Date(since);
      d.setDate(since.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      return { date: key, revenue: dailyMap[key]?.revenue || 0, orders: dailyMap[key]?.orders || 0 };
    });

    res.json({
      revenue: revenueAgg[0]?.revenue || 0,
      orders: revenueAgg[0]?.orders || 0,
      byStatus: Object.fromEntries(byStatus.map((s) => [s._id, s.count])),
      series,
      recentOrders,
      lowStock,
      topProducts,
      products: counts[0],
      categories: counts[1],
      customers: counts[2],
    });
  })
);

export default router;
