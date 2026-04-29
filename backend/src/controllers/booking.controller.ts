import { Request, Response, NextFunction } from 'express';
import * as bookingService from '../services/booking.service';
import { createBookingSchema } from '../schemas/booking.schema';
import { ZodError } from 'zod';

// Utility to recursively serialize BigInt, Decimal, and Date from Prisma
const serializeBigInt = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'bigint') return obj.toString();
  // Date objects: serialize to ISO string
  if (obj instanceof Date) return obj.toISOString();
  // Prisma Decimal detection via duck-typing (constructor name may be minified to 'i' in some builds)
  // Decimal has .toFixed() and .toNumber() methods but is NOT a primitive number
  if (
    typeof obj === 'object' &&
    typeof obj.toFixed === 'function' &&
    typeof obj.toNumber === 'function'
  ) {
    return obj.toNumber();
  }
  if (Array.isArray(obj)) return obj.map(serializeBigInt);
  if (typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [key, serializeBigInt(value)])
    );
  }
  return obj;
};

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

    res.status(201).json({ success: true, data: serializeBigInt(booking) });
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
    res.json({ success: true, count: bookings.length, data: serializeBigInt(bookings) });
  } catch (error) {
    next(error);
  }
};

export const getBookingDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // @ts-ignore
    const userId = req.user.user_id;
    const bookingId = req.params.id as string;
    
    const booking = await bookingService.getBookingById(bookingId, userId);
    res.json({ success: true, data: serializeBigInt(booking) });
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
    res.json({ success: true, message: 'Booking cancelled successfully', data: serializeBigInt(cancelledBooking) });
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
    
    const confirmedBooking = await bookingService.simulatePayment(bookingId, userId);
    res.json({ success: true, message: 'Payment successful simulated', data: serializeBigInt(confirmedBooking) });
  } catch (error: any) {
    if (error.message === 'Booking does not await payment') {
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

export const validateCoupon = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { coupon_code, booking_id } = req.body;
    if (!coupon_code) {
      res.status(400).json({ success: false, message: 'coupon_code is required' });
      return;
    }

    // @ts-ignore
    const userId = req.user.user_id;

    // Fetch booking to get total_price for discount calculation
    const booking = await bookingService.getBookingById(booking_id, userId);
    const bookingTotal = typeof booking.total_price === 'number'
      ? booking.total_price
      : parseFloat(booking.total_price.toString());

    const result = await bookingService.previewCoupon(coupon_code, bookingTotal);
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
