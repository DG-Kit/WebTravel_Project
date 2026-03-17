import prisma from '../config/prisma';

export const addFavorite = async (userId: number, hotelId: number) => {
  const existing = await prisma.favorite.findFirst({
    where: { user_id: userId, hotel_id: hotelId },
  });
  if (existing) {
    throw new Error('Already in favorites');
  }
  return await prisma.favorite.create({
    data: { user_id: userId, hotel_id: hotelId },
  });
};

export const removeFavorite = async (userId: number, hotelId: number) => {
  const existing = await prisma.favorite.findFirst({
    where: { user_id: userId, hotel_id: hotelId },
  });
  if (!existing) {
    throw new Error('Favorite not found');
  }
  return await prisma.favorite.delete({
    where: { favorite_id: existing.favorite_id },
  });
};

export const getUserFavorites = async (userId: number) => {
  return await prisma.favorite.findMany({
    where: { user_id: userId },
    include: {
      hotel: {
        include: {
          location: true,
          images: { take: 1 },
        },
      },
    },
    orderBy: { created_at: 'desc' },
  });
};