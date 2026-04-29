import { Router } from 'express';
import * as bookingController from '../controllers/booking.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

// All booking routes require the user to be logged in
router.use(authenticate);

// User Booking Endpoints
router.post('/', bookingController.createBooking);
router.get('/my-bookings', bookingController.getMyBookings);
router.get('/:id', bookingController.getBookingDetails);

// Manage Booking Endpoints
router.put('/:id/pay', bookingController.payBooking);
router.put('/:id/cancel', bookingController.cancelBooking);

export default router;
