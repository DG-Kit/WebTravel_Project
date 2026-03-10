import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../config/prisma';

// --- Validation Schemas ---
export const registerSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
  full_name: z.string().min(1, 'Họ tên không được để trống'),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(1, 'Mật khẩu không được để trống'),
});

// --- Helpers ---
const generateToken = (user_id: number, role: string) => {
  return jwt.sign(
    { user_id, role },
    process.env.JWT_SECRET as string,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
  );
};

// --- Service Methods ---
export const registerUser = async (data: z.infer<typeof registerSchema>) => {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    const err: any = new Error('Email đã được sử dụng');
    err.statusCode = 409;
    throw err;
  }

  const password_hash = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      password_hash,
      full_name: data.full_name,
      phone: data.phone,
    },
    select: { user_id: true, email: true, full_name: true, role: true, created_at: true },
  });

  const token = generateToken(user.user_id, user.role);
  return { user, token };
};

export const loginUser = async (data: z.infer<typeof loginSchema>) => {
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user || !user.is_active) {
    const err: any = new Error('Email hoặc mật khẩu không chính xác');
    err.statusCode = 401;
    throw err;
  }

  const isMatch = await bcrypt.compare(data.password, user.password_hash);
  if (!isMatch) {
    const err: any = new Error('Email hoặc mật khẩu không chính xác');
    err.statusCode = 401;
    throw err;
  }

  const token = generateToken(user.user_id, user.role);
  const { password_hash, ...safeUser } = user;
  return { user: safeUser, token };
};
