import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import * as favoriteService from '../services/favorite.service';

export const addFavorite = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.user_id;
    const { hotel_id } = req.body;
    if (!hotel_id) { res.status(400).json({ success: false, message: 'hotel_id is required' }); return; }
    const favorite = await favoriteService.addFavorite(userId, Number(hotel_id));
    res.status(201).json({ success: true, data: favorite });
  } catch (error) { next(error); }
};

export const removeFavorite = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.user_id;
    const hotelId = Number(req.params.hotelId);
    await favoriteService.removeFavorite(userId, hotelId);
    res.json({ success: true, message: 'Removed from favorites' });
  } catch (error: any) {
    if (error.message === 'Favorite not found') { res.status(404).json({ success: false, message: error.message }); return; }
    next(error);
  }
};

export const getUserFavorites = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.user_id;
    const favorites = await favoriteService.getUserFavorites(userId);
    const formatted = favorites.map((fav: any) => ({
      ...fav,
      hotel: {
        ...fav.hotel,
        images: fav.hotel.images.map((img: any) => img.image_url),
      },
    }));
    res.json({ success: true, count: formatted.length, data: formatted });
  } catch (error) { next(error); }
};
