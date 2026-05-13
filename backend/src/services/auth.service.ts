import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import crypto from 'crypto';
import prisma from '../config/prisma';
import mailService from './mail.service';

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
      is_verified: false, // Explicitly set to false
    },
    select: { user_id: true, email: true, full_name: true, role: true, created_at: true },
  });

  // Create verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 3600000); // 24 hours

  await prisma.emailVerification.create({
    data: {
      user_id: user.user_id,
      verification_token: verificationToken,
      expires_at: expiresAt,
    },
  });

  await mailService.sendVerificationEmail(user.email, verificationToken);

  return { 
    user, 
    message: 'Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản.' 
  };
};

export const loginUser = async (data: z.infer<typeof loginSchema>) => {
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user || !user.is_active) {
    const err: any = new Error('Email hoặc mật khẩu không chính xác');
    err.statusCode = 401;
    throw err;
  }

  if (!user.is_verified) {
    const err: any = new Error('Tài khoản chưa được xác thực. Vui lòng kiểm tra email.');
    err.statusCode = 403;
    throw err;
  }

  const isMatch = await bcrypt.compare(data.password, user.password_hash);
  if (!isMatch) {
    const err: any = new Error('Email hoặc mật khẩu không chính xác');
    err.statusCode = 401;
    throw err;
  }

  const token = generateToken(user.user_id, user.role);
  
  // Standardize return fields
  const safeUser = {
    user_id: user.user_id,
    email: user.email,
    full_name: user.full_name,
    phone: user.phone,
    role: user.role,
  };

  // Generate and save refresh token
  const refreshToken = crypto.randomBytes(40).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

  await prisma.authToken.create({
    data: {
      user_id: user.user_id,
      access_token: token,
      refresh_token: refreshToken,
      expires_at: expiresAt,
    }
  });

  return { user: safeUser, token, refresh_token: refreshToken };
};

export const logoutUser = async (userId: number, token: string) => {
  await prisma.authToken.deleteMany({
    where: {
      user_id: userId,
      access_token: token
    }
  });
};

export const requestPasswordReset = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // We return success even if user doesn't exist for security (prevent email enumeration)
    return { success: true };
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now

  await prisma.passwordResetToken.create({
    data: {
      user_id: user.user_id,
      reset_token: resetToken,
      expires_at: expiresAt,
    },
  });

  await mailService.sendPasswordResetEmail(user.email, resetToken);
  return { success: true };
};

export const resetPassword = async (token: string, newPassword: z.infer<typeof registerSchema>['password']) => {
  const resetEntry = await prisma.passwordResetToken.findUnique({
    where: { reset_token: token },
    include: { user: true },
  });

  if (!resetEntry || resetEntry.used || resetEntry.expires_at < new Date()) {
    const err: any = new Error('Token không hợp lệ hoặc đã hết hạn');
    err.statusCode = 400;
    throw err;
  }

  const password_hash = await bcrypt.hash(newPassword, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: { user_id: resetEntry.user_id },
      data: { password_hash },
    }),
    prisma.passwordResetToken.update({
      where: { reset_id: resetEntry.reset_id },
      data: { used: true },
    }),
  ]);

  return { success: true };
};

export const verifyEmail = async (token: string) => {
  const verification = await prisma.emailVerification.findUnique({
    where: { verification_token: token },
    include: { user: true },
  });

  if (!verification || verification.expires_at < new Date()) {
    const err: any = new Error('Token xác thực không hợp lệ hoặc đã hết hạn');
    err.statusCode = 400;
    throw err;
  }

  if (verification.verified_at) {
    return { success: true, message: 'Tài khoản đã được xác thực trước đó.' };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { user_id: verification.user_id },
      data: { is_verified: true },
    }),
    prisma.emailVerification.update({
      where: { verification_id: verification.verification_id },
      data: { verified_at: new Date() },
    }),
  ]);

  return { success: true, message: 'Xác thực tài khoản thành công!' };
};
