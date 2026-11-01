import { Router } from 'express';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../middleware/error.js';

const router = Router();

const SORTS = {
  newest: { createdAt: -1 },
  'price-asc': { price: 1 },
  'price-desc': { price: -1 },
  name: { name: 1 },
};

// GET /api/products?category=slug&q=text&featured=1&sort=price-asc&page=1&limit=12&all=1
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { category, q, featured, sort = 'newest', all } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 12));

    const filter = all ? {} : { isActive: true };
    if (featured) filter.isFeatured = true;
    if (q) filter.$text = { $search: q };
    if (category) {
      const cat = await Category.findOne({ slug: category });
      if (!cat) return res.json({ products: [], total: 0, page, pages: 0 });
      filter.category = cat._id;
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('category', 'name slug')
        .sort(SORTS[sort] || SORTS.newest)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);

    res.json({ products, total, page, pages: Math.ceil(total / limit) });
  })
);

router.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const product = await Product.findOne({ slug: req.params.slug }).populate('category', 'name slug');
    if (!product) throw new HttpError(404, 'Product not found');
    const related = await Product.find({
      category: product.category._id,
      _id: { $ne: product._id },
      isActive: true,
    })
      .limit(4)
      .lean();
    res.json({ product, related });
  })
);

const FIELDS = ['name', 'brand', 'category', 'description', 'price', 'comparePrice', 'stock', 'images', 'specs', 'isFeatured', 'isActive'];

router.post(
  '/',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const data = Object.fromEntries(FIELDS.filter((f) => req.body[f] !== undefined).map((f) => [f, req.body[f]]));
    const product = await Product.create(data);
    res.status(201).json(await product.populate('category', 'name slug'));
  })
);

router.put(
  '/:id',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) throw new HttpError(404, 'Product not found');
    for (const f of FIELDS) if (req.body[f] !== undefined) product[f] = req.body[f];
    await product.save();
    res.json(await product.populate('category', 'name slug'));
  })
);

router.delete(
  '/:id',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) throw new HttpError(404, 'Product not found');
    res.json({ message: 'Product deleted' });
  })
);

export default router;
