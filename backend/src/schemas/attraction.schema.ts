import { z } from 'zod';

export const attractionSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  category: z.string().max(100).optional(),
  description: z.string().optional(),
  popularity_score: z.number().min(0).max(100).optional(),
  best_time_to_visit: z.string().max(100).optional(),
  location_id: z.number().int().positive('Location ID is required'),
  tag_ids: z.array(z.number().int()).optional(),
});

export const updateAttractionSchema = attractionSchema.partial();
