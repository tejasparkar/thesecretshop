import { Router } from 'express';
import User from '../models/User.js';
import { protect, signToken } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../middleware/error.js';

const router = Router();

const publicUser = (u) => ({ _id: u._id, name: u.name, email: u.email, role: u.role });

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) throw new HttpError(400, 'Name, email and password are required');
    if (password.length < 6) throw new HttpError(400, 'Password must be at least 6 characters');
    if (await User.exists({ email: email.toLowerCase() })) throw new HttpError(409, 'Email is already registered');

    const user = await User.create({ name, email, password });
    res.status(201).json({ user: publicUser(user), token: signToken(user) });
  })
);

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || '').toLowerCase() }).select('+password');
    if (!user || !(await user.matchPassword(password || ''))) throw new HttpError(401, 'Invalid email or password');
    res.json({ user: publicUser(user), token: signToken(user) });
  })
);

router.get('/me', protect, (req, res) => res.json({ user: publicUser(req.user) }));

export default router;
