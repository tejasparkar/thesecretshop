import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { protect, adminOnly } from '../middleware/auth.js';
import { HttpError } from '../middleware/error.js';

const uploadDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../uploads');

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\/(jpeg|png|webp|gif|avif)$/.test(file.mimetype)) cb(null, true);
    else cb(new HttpError(400, 'Only JPG, PNG, WEBP, GIF or AVIF images are allowed'));
  },
});

const router = Router();

router.post('/', protect, adminOnly, upload.array('images', 8), (req, res) => {
  // Absolute URLs so images load when the frontend is hosted on another domain (e.g. GitHub Pages).
  const origin = (process.env.PUBLIC_URL || `${req.protocol}://${req.get('host')}`).replace(/\/+$/, '');
  res.status(201).json({ urls: req.files.map((f) => `${origin}/uploads/${f.filename}`) });
});

export { uploadDir };
export default router;
