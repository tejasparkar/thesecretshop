import { Router } from 'express';
import mongoose from 'mongoose';
import Order, { ORDER_STATUSES } from '../models/Order.js';
import Product from '../models/Product.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../middleware/error.js';

const router = Router();

const FREE_SHIPPING_OVER = 50000;
const SHIPPING_FEE = 499;
const TAX_RATE = 0.18;

// Allowed transitions — keeps admins from e.g. "un-delivering" an order.
const TRANSITIONS = {
  pending: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

async function restock(order) {
  await Promise.all(order.items.map((i) => Product.updateOne({ _id: i.product }, { $inc: { stock: i.quantity } })));
}

// ---------- Customer ----------

router.post(
  '/',
  protect,
  asyncHandler(async (req, res) => {
    const { items, shippingAddress, paymentMethod = 'cod' } = req.body;
    if (!Array.isArray(items) || items.length === 0) throw new HttpError(400, 'Your cart is empty');

    // Merge duplicate lines and validate quantities.
    const wanted = new Map();
    for (const { product, quantity } of items) {
      const qty = parseInt(quantity, 10);
      if (!mongoose.isValidObjectId(product) || !qty || qty < 1) throw new HttpError(400, 'Invalid cart item');
      wanted.set(product, (wanted.get(product) || 0) + qty);
    }

    const products = await Product.find({ _id: { $in: [...wanted.keys()] }, isActive: true });
    if (products.length !== wanted.size) throw new HttpError(400, 'Some products are no longer available');

    // Reserve stock atomically per product; roll back if any fail.
    const reserved = [];
    for (const p of products) {
      const qty = wanted.get(p._id.toString());
      const ok = await Product.updateOne({ _id: p._id, stock: { $gte: qty } }, { $inc: { stock: -qty } });
      if (!ok.modifiedCount) {
        await Promise.all(reserved.map(([id, q]) => Product.updateOne({ _id: id }, { $inc: { stock: q } })));
        throw new HttpError(400, `Only ${p.stock} left of "${p.name}"`);
      }
      reserved.push([p._id, qty]);
    }

    const orderItems = products.map((p) => ({
      product: p._id,
      name: p.name,
      image: p.images[0] || '',
      price: p.price,
      quantity: wanted.get(p._id.toString()),
    }));
    const itemsTotal = orderItems.reduce((s, i) => s + i.price * i.quantity, 0);
    const shippingFee = itemsTotal >= FREE_SHIPPING_OVER ? 0 : SHIPPING_FEE;
    const tax = Math.round(itemsTotal * TAX_RATE);

    try {
      const order = await Order.create({
        user: req.user._id,
        items: orderItems,
        shippingAddress,
        paymentMethod,
        itemsTotal,
        shippingFee,
        tax,
        grandTotal: itemsTotal + shippingFee + tax,
        statusHistory: [{ status: 'pending', note: 'Order placed' }],
      });
      res.status(201).json(order);
    } catch (err) {
      await Promise.all(reserved.map(([id, q]) => Product.updateOne({ _id: id }, { $inc: { stock: q } })));
      throw err;
    }
  })
);

router.get(
  '/mine',
  protect,
  asyncHandler(async (req, res) => {
    res.json(await Order.find({ user: req.user._id }).sort({ createdAt: -1 }));
  })
);

router.get(
  '/:id',
  protect,
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (!order) throw new HttpError(404, 'Order not found');
    const isOwner = order.user._id.equals(req.user._id);
    if (!isOwner && req.user.role !== 'admin') throw new HttpError(403, 'Not your order');
    res.json(order);
  })
);

router.put(
  '/:id/cancel',
  protect,
  asyncHandler(async (req, res) => {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) throw new HttpError(404, 'Order not found');
    if (order.status !== 'pending') throw new HttpError(400, 'Only pending orders can be cancelled');
    order.status = 'cancelled';
    order.statusHistory.push({ status: 'cancelled', note: 'Cancelled by customer' });
    await order.save();
    await restock(order);
    res.json(order);
  })
);

// ---------- Admin ----------

router.get(
  '/',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const { status, q } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, parseInt(req.query.limit, 10) || 20);

    const filter = {};
    if (status && ORDER_STATUSES.includes(status)) filter.status = status;
    if (q) {
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ orderNumber: rx }, { 'shippingAddress.fullName': rx }, { 'shippingAddress.phone': rx }];
    }

    const [orders, total] = await Promise.all([
      Order.find(filter).populate('user', 'name email').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Order.countDocuments(filter),
    ]);
    res.json({ orders, total, page, pages: Math.ceil(total / limit) });
  })
);

router.put(
  '/:id/status',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const { status, note, trackingNumber } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) throw new HttpError(404, 'Order not found');

    if (status && status !== order.status) {
      if (!TRANSITIONS[order.status].includes(status)) {
        throw new HttpError(400, `Cannot move an order from "${order.status}" to "${status}"`);
      }
      order.status = status;
      order.statusHistory.push({ status, note: note || `Marked ${status} by admin` });
      if (status === 'cancelled') await restock(order);
      if (status === 'delivered' && order.paymentMethod === 'cod' && !order.isPaid) {
        order.isPaid = true;
        order.paidAt = new Date();
      }
    }
    if (trackingNumber !== undefined) order.trackingNumber = trackingNumber;
    if (req.body.adminNote !== undefined) order.adminNote = req.body.adminNote;
    if (req.body.isPaid !== undefined) {
      order.isPaid = Boolean(req.body.isPaid);
      order.paidAt = order.isPaid ? order.paidAt || new Date() : undefined;
    }

    await order.save();
    res.json(await order.populate('user', 'name email'));
  })
);

export { TRANSITIONS };
export default router;
