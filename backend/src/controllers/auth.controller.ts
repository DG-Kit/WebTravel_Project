import { Request, Response, NextFunction } from 'express';
import { registerSchema, loginSchema, registerUser, loginUser } from '../services/auth.service';
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
