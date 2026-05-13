import { Request, Response, NextFunction } from 'express';
import * as bookingService from '../services/booking.service';
import { createBookingSchema } from '../schemas/booking.schema';
import { ZodError } from 'zod';


export const createBooking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = createBookingSchema.parse(req.body);
    // @ts-ignore - user injected by auth middleware
    const userId = req.user.user_id;

    const booking = await bookingService.createBooking(
      userId,
      validatedData.hotel_id,
      validatedData.check_in,
      validatedData.check_out,
      validatedData.guests,
      validatedData.rooms,
      validatedData.coupon_code  // new: optional coupon code string
    );

    res.status(201).json({ success: true, data: booking });
  } catch (error: any) {
    if (error instanceof ZodError) {
       res.status(400).json({ success: false, message: 'Validation error', errors: error.issues });
       return;
    }
    // Business logic errors → 400
    const businessErrors = [
      'sold out', 'Check-out', 'does not belong to hotel',
      'guests', 'capacity', 'Coupon', 'coupon', 'invalid', 'expired', 'usage limit'
    ];
    if (businessErrors.some(kw => error.message.includes(kw))) {
       res.status(400).json({ success: false, message: error.message });
       return;
    }
    next(error);
  }
};

export const getMyBookings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // @ts-ignore
    const userId = req.user.user_id;
    const bookings = await bookingService.getMyBookings(userId);
    res.json({ success: true, count: bookings.length, data: bookings });
  } catch (error) {
    console.error('[getMyBookings Error]:', error);
    next(error);
  }
};

const robustSerialize = (obj: any): any => {
  return JSON.parse(JSON.stringify(obj, (key, value) => {
    if (typeof value === 'bigint') return value.toString();
    if (value && typeof value === 'object' && value.toFixed && value.toNumber) return value.toNumber();
    return value;
  }));
};

export const getHostBookings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // @ts-ignore
    const hostId = req.user.user_id;
    console.log(`[Backend] Fetching bookings for host: ${hostId}`);
    const bookings = await bookingService.getHostBookings(hostId);
    console.log(`[Backend] Found ${bookings.length} bookings`);
    
    // Explicitly serialize to avoid 500 errors in JSON.stringify
    const serializedData = robustSerialize(bookings);
    res.json({ success: true, count: bookings.length, data: serializedData });
  } catch (error) {
    console.error('[getHostBookings Error]:', error);
    next(error);
  }
};

export const getBookingDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // @ts-ignore
    const userId = req.user.user_id;
    const bookingId = req.params.id as string;
    
    const booking = await bookingService.getBookingById(bookingId, userId);
    res.json({ success: true, data: booking });
  } catch (error: any) {
    if (error.message === 'Booking not found' || error.message === 'Unauthorized to view this booking') {
       res.status(404).json({ success: false, message: error.message });
       return;
    }
    next(error);
  }
};

export const cancelBooking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // @ts-ignore
    const userId = req.user.user_id;
    const bookingId = req.params.id as string;
    
    const cancelledBooking = await bookingService.cancelBooking(bookingId, userId);
    res.json({ success: true, message: 'Booking cancelled successfully', data: cancelledBooking });
  } catch (error: any) {
    if (error.message.includes('Cannot cancel') || error.message.includes('already cancelled')) {
       res.status(400).json({ success: false, message: error.message });
       return;
    }
    if (error.message === 'Booking not found') {
       res.status(404).json({ success: false, message: error.message });
       return;
    }
    next(error);
  }
};

export const payBooking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // @ts-ignore
    const userId = req.user.user_id;
    const bookingId = req.params.id as string;
    console.log(`[payBooking] userId=${userId} (${typeof userId}), bookingId=${bookingId}`);
    
    const confirmedBooking = await bookingService.simulatePayment(bookingId, userId);
    console.log(`[payBooking] Success — booking ${bookingId} is now PAID`);
    res.json({ success: true, message: 'Payment successful simulated', data: confirmedBooking });
  } catch (error: any) {
    console.error('[payBooking Error]:', error.message);
    if (error.message === 'Booking does not await payment') {
       res.status(400).json({ success: false, message: error.message });
       return;
    }
    if (error.message === 'Booking not found') {
       res.status(404).json({ success: false, message: error.message });
       return;
    }
    if (error.message.includes('Unauthorized')) {
       res.status(403).json({ success: false, message: error.message });
       return;
    }
    next(error);
  }
};

export const validateCoupon = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { coupon_code, booking_id } = req.body;
    if (!coupon_code) {
      res.status(400).json({ success: false, message: 'coupon_code is required' });
      return;
    }

    // @ts-ignore
    const userId = req.user.user_id;

    // Apply coupon to booking so frontend totals & payment are consistent
    const result = await bookingService.applyCouponToBooking(booking_id, userId, coupon_code);
    res.json({ success: true, data: result });
  } catch (error: any) {
    const clientErrors = ['invalid', 'expired', 'usage limit', 'active', 'Coupon'];
    if (clientErrors.some(kw => error.message.includes(kw))) {
      res.status(400).json({ success: false, message: error.message });
      return;
    }
    next(error);
  }
};
export const confirmBooking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // @ts-ignore
    const hostId = req.user.user_id;
    const bookingId = req.params.id as string;
    
    const result = await bookingService.confirmBooking(bookingId, hostId);
    res.json({ success: true, message: 'Booking confirmed successfully', data: result });
  } catch (error: any) {
    if (error.message.includes('paid before confirmation') || error.message.includes('Unauthorized')) {
       res.status(403).json({ success: false, message: error.message });
       return;
    }
    if (error.message === 'Booking not found') {
       res.status(404).json({ success: false, message: error.message });
       return;
    }
    next(error);
  }
};
