import { Router } from 'express';
import { getRecommendedHotels, getItinerary } from '../controllers/hotel.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

// GET /api/recommendations - Returns AI-personalized hotel list for logged-in users
router.get('/', authenticate, getRecommendedHotels);

// GET /api/recommendations/itinerary/:locationId - Generates a full AI itinerary for a location
router.get('/itinerary/:locationId', authenticate, getItinerary);

export default router;
