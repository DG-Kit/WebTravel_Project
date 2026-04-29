import { z } from 'zod';

export const bookingDetailSchema = z.object({
  room_id: z.number().int().positive(),
  quantity: z.number().int().positive().default(1),
});

export const createBookingSchema = z.object({
  hotel_id: z.number().int().positive(),
  check_in: z.string().refine((dateString) => !isNaN(Date.parse(dateString)), {
    message: "Invalid check-in date format"
  }),
  check_out: z.string().refine((dateString) => !isNaN(Date.parse(dateString)), {
    message: "Invalid check-out date format"
  }),
  guests: z.number().int().positive(),
  rooms: z.array(bookingDetailSchema).min(1, "At least one room must be booked"),
  // coupon_code: user enters coupon string (e.g. "SUMMER20"), not numeric ID
  coupon_code: z.string().optional(),
});
