import { Router } from 'express';
import { getMyProfile, updateMyProfile, getUsers, updateUserStatus, updateUser } from '../controllers/user.controller';
import { getUserFavorites, addFavorite, removeFavorite } from '../controllers/favorite.controller';
import { getMyReviews } from '../controllers/review.controller';
import { authenticate, authorize } from '../middlewares/auth';

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

// Reviews
router.get('/reviews', getMyReviews);

// Admin only: List all users and manage status
router.get('/', authorize('ADMIN'), getUsers);
router.put('/:id/status', authorize('ADMIN'), updateUserStatus);
router.put('/:id', authorize('ADMIN'), updateUser);

export default router;
