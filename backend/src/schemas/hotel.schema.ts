import { z } from 'zod';

export const roomSchema = z.object({
  room_type: z.string().min(1, 'Room type is required').max(100),
  price: z.number().positive(),
  capacity: z.number().int().positive(),
  is_available: z.boolean().optional().default(true),
  image_urls: z.array(z.string().url()).optional(),
});

export const hotelSchema = z.object({
  name: z.string().min(1, 'Hotel name is required').max(255),
  address: z.string().min(1, 'Address is required').max(500),
  star_rating: z.number().int().min(0).max(5).optional(),
  description: z.string().optional(),
  owner_id: z.number().int().positive('Owner ID is required'),
  location_id: z.number().int().positive('Location ID is required'),
  is_active: z.boolean().optional().default(true),
  tag_ids: z.array(z.number().int()).optional(),
  amenities: z.array(z.string()).optional(),
  image_urls: z.array(z.string().url()).optional(),
  rooms: z.array(roomSchema).optional(),
});

export const updateHotelSchema = hotelSchema.partial();
