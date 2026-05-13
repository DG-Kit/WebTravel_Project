import { Request, Response, NextFunction } from 'express';
import { registerSchema, loginSchema, registerUser, loginUser, logoutUser, requestPasswordReset, resetPassword, verifyEmail } from '../services/auth.service';
import { ZodError } from 'zod';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = registerSchema.parse(req.body);
    const result = await registerUser(parsed);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({ success: false, message: err.issues[0]?.message });
      return;
    }
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = loginSchema.parse(req.body);
    const result = await loginUser(parsed);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({ success: false, message: err.issues[0]?.message });
      return;
    }
    next(err);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ success: false, message: 'Email là bắt buộc' });
      return;
    }
    await requestPasswordReset(email);
    res.status(200).json({ success: true, message: 'Nếu email tồn tại, link đặt lại mật khẩu đã được gửi.' });
  } catch (err) {
    next(err);
  }
};

export const handleResetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      res.status(400).json({ success: false, message: 'Token và mật khẩu là bắt buộc' });
      return;
    }
    await resetPassword(token, password);
    res.status(200).json({ success: true, message: 'Mật khẩu đã được đặt lại thành công.' });
  } catch (err) {
    next(err);
  }
};

export const handleVerifyEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.query;
    if (!token) {
      res.status(400).json({ success: false, message: 'Token là bắt buộc' });
      return;
    }
    const result = await verifyEmail(token as string);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};
export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.user_id;
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (userId && token) {
      await logoutUser(userId, token);
    }
    res.status(200).json({ success: true, message: 'Đã đăng xuất thành công.' });
  } catch (err) {
    next(err);
  }
};
