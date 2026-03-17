import { z } from 'zod';

export const tagSchema = z.object({
  name: z.string().min(1, 'Tag name cannot be empty').max(100, 'Tag name must be less than 100 characters'),
  type: z.string().min(1, 'Tag type cannot be empty').max(50, 'Tag type must be less than 50 characters'),
});

export const updateTagSchema = tagSchema.partial();
