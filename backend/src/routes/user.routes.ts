import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { getMyProfile, updateMyProfile } from '../controllers/user.controller';
import { getUserFavorites, addFavorite, removeFavorite } from '../controllers/favorite.controller';

const router = Router();

// All /api/users routes require authentication
router.use(authenticate);

// GET /api/users/me
router.get('/me', getMyProfile);

// PUT /api/users/profile
router.put('/profile', updateMyProfile);

// Favorites
router.get('/favorites', getUserFavorites);
router.post('/favorites', addFavorite);
router.delete('/favorites/:hotelId', removeFavorite);

export default router;
