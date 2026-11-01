import { Router } from 'express';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../middleware/error.js';

const router = Router();

// Public: active categories with product counts. ?all=1 (admin UI) includes inactive.
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const filter = req.query.all ? {} : { isActive: true };
    const categories = await Category.find(filter).sort({ sortOrder: 1, name: 1 }).lean();
    const counts = await Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);
    const countMap = Object.fromEntries(counts.map((c) => [c._id.toString(), c.count]));
    res.json(categories.map((c) => ({ ...c, productCount: countMap[c._id.toString()] || 0 })));
  })
);

router.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const category = await Category.findOne({ slug: req.params.slug });
    if (!category) throw new HttpError(404, 'Category not found');
    res.json(category);
  })
);

router.post(
  '/',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const { name, description, image, isActive, sortOrder } = req.body;
    const category = await Category.create({ name, description, image, isActive, sortOrder });
    res.status(201).json(category);
  })
);

router.put(
  '/:id',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const category = await Category.findById(req.params.id);
    if (!category) throw new HttpError(404, 'Category not found');
    for (const key of ['name', 'description', 'image', 'isActive', 'sortOrder']) {
      if (req.body[key] !== undefined) category[key] = req.body[key];
    }
    await category.save();
    res.json(category);
  })
);

router.delete(
  '/:id',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const inUse = await Product.countDocuments({ category: req.params.id });
    if (inUse) throw new HttpError(400, `Cannot delete — ${inUse} product(s) still use this category`);
    const deleted = await Category.findByIdAndDelete(req.params.id);
    if (!deleted) throw new HttpError(404, 'Category not found');
    res.json({ message: 'Category deleted' });
  })
);

export default router;
