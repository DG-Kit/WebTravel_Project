import { z } from 'zod';

export const locationSchema = z.object({
  name: z.string().min(1, 'Location name is required').max(255),
  country: z.string().min(1, 'Country name is required').max(255),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const updateLocationSchema = locationSchema.partial();
