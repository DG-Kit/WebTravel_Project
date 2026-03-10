import prisma from '../config/prisma';
import { z } from 'zod';

export const updateProfileSchema = z.object({
  full_name: z.string().min(1).optional(),
  phone: z.string().optional(),
  preferences: z.object({
    preferred_categories: z.string().optional(),
    travel_style: z.string().optional(),
    budget_level: z.number().int().min(1).max(3).optional(),
  }).optional(),
});

export const getMe = async (user_id: number) => {
  const user = await prisma.user.findUnique({
    where: { user_id },
    select: {
      user_id: true,
      email: true,
      full_name: true,
      phone: true,
      role: true,
      created_at: true,
      user_preferences: true,
    },
  });

  if (!user) {
    const err: any = new Error('Người dùng không tồn tại');
    err.statusCode = 404;
    throw err;
  }
  return user;
};

export const updateProfile = async (
  user_id: number,
  data: z.infer<typeof updateProfileSchema>
) => {
  const { preferences, ...profileData } = data;

  // Update user basic info
  const user = await prisma.user.update({
    where: { user_id },
    data: profileData,
    select: {
      user_id: true,
      email: true,
      full_name: true,
      phone: true,
      role: true,
      updated_at: true,
    },
  });

  // Upsert preferences if provided
  if (preferences) {
    await prisma.userPreference.upsert({
      where: { user_id },
      update: preferences,
      create: { user_id, ...preferences },
    });
  }

  return user;
};
