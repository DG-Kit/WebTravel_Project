import { Router } from 'express';
import * as hotelController from '../controllers/hotel.controller';
import * as reviewController from '../controllers/review.controller';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.get('/', hotelController.getHotels);
router.post('/', authenticate, authorize('ADMIN', 'HOST'), hotelController.createHotel);
router.get('/:id', hotelController.getHotel);
router.put('/:id', authenticate, authorize('ADMIN', 'HOST'), hotelController.updateHotel);
router.delete('/:id', authenticate, authorize('ADMIN', 'HOST'), hotelController.deleteHotel);

// Reviews
router.get('/:id/reviews', reviewController.getReviewsByHotel);
router.post('/:id/reviews', authenticate, reviewController.createReview);
router.delete('/:id/reviews/:reviewId', authenticate, reviewController.deleteReview);

export default router;
