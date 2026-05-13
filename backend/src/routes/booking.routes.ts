import { Router } from 'express';
import * as bookingController from '../controllers/booking.controller';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

// All booking routes require the user to be logged in
router.use(authenticate);

// Static routes MUST come before dynamic /:id routes to avoid Express matching them as IDs
router.post('/', bookingController.createBooking);
router.get('/my-bookings', bookingController.getMyBookings);
router.get('/host', authorize('HOST', 'ADMIN'), bookingController.getHostBookings);
router.post('/validate-coupon', bookingController.validateCoupon);

// Dynamic routes with :id parameter
router.get('/:id', bookingController.getBookingDetails);
router.put('/:id/pay', bookingController.payBooking);
router.put('/:id/cancel', bookingController.cancelBooking);
router.put('/:id/confirm', authorize('HOST', 'ADMIN'), bookingController.confirmBooking);

export default router;
