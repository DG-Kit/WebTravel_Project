import { Router } from 'express';
import { register, login, logout, forgotPassword, handleResetPassword, handleVerifyEmail } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth';
import prisma from '../config/prisma';
import rateLimit from 'express-rate-limit';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per `window` (here, per 15 minutes)
  message: { success: false, message: 'Too many login attempts from this IP, please try again after 15 minutes' },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/login
router.post('/login', loginLimiter, login);

// POST /api/auth/forgot-password
router.post('/forgot-password', forgotPassword);

// POST /api/auth/reset-password
router.post('/reset-password', handleResetPassword);

// GET /api/auth/verify-email
router.get('/verify-email', handleVerifyEmail);

// POST /api/auth/logout — invalidate token in DB
router.post('/logout', authenticate, logout);

export default router;
