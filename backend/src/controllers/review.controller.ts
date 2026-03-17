import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import prisma from '../config/prisma';
import { z } from 'zod';

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});

// Serializes BigInt fields in review objects safely
const serializeReview = (review: any) => ({
  ...review,
  review_id: String(review.review_id),
});

// GET /hotels/:id/reviews - public
export const getReviewsByHotel = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const hotel_id = parseInt(req.params.id as string, 10);
    if (isNaN(hotel_id)) { res.status(400).json({ success: false, message: 'Invalid hotel ID' }); return; }

    const reviews = await prisma.review.findMany({
      where: { hotel_id },
      include: { user: { select: { user_id: true, full_name: true } } },
      orderBy: { created_at: 'desc' },
    });

    res.json({ success: true, count: reviews.length, data: reviews.map(serializeReview) });
  } catch (err) { next(err); }
};

// POST /hotels/:id/reviews - authenticated
export const createReview = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const hotel_id = parseInt(req.params.id as string, 10);
    if (isNaN(hotel_id)) { res.status(400).json({ success: false, message: 'Invalid hotel ID' }); return; }

    const user_id = req.user!.user_id;
    const data = reviewSchema.parse(req.body);

    const hotel = await prisma.hotel.findUnique({ where: { hotel_id } });
    if (!hotel) { res.status(404).json({ success: false, message: 'Hotel not found' }); return; }

    const existing = await prisma.review.findFirst({ where: { hotel_id, user_id } });
    if (existing) { res.status(409).json({ success: false, message: 'You have already reviewed this hotel' }); return; }

    const review = await prisma.review.create({
      data: { hotel_id, user_id, ...data },
      include: { user: { select: { user_id: true, full_name: true } } },
    });

    // Recalculate average rating
    const agg = await prisma.review.aggregate({ where: { hotel_id }, _avg: { rating: true } });
    await prisma.hotel.update({ where: { hotel_id }, data: { average_rating: agg._avg.rating || 0 } });

    res.status(201).json({ success: true, data: serializeReview(review) });
  } catch (err: any) {
    if (err.name === 'ZodError') { res.status(400).json({ success: false, message: err.issues[0]?.message }); return; }
    next(err);
  }
};

// DELETE /hotels/:id/reviews/:reviewId - owner only
export const deleteReview = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const hotel_id = parseInt(req.params.id as string, 10);
    const review_id = BigInt(req.params.reviewId as string);
    const user_id = req.user!.user_id;

    const review = await prisma.review.findUnique({ where: { review_id } });
    if (!review) { res.status(404).json({ success: false, message: 'Review not found' }); return; }
    if (review.user_id !== user_id) { res.status(403).json({ success: false, message: 'Forbidden' }); return; }

    await prisma.review.delete({ where: { review_id } });

    // Recalculate average
    const agg = await prisma.review.aggregate({ where: { hotel_id }, _avg: { rating: true } });
    await prisma.hotel.update({ where: { hotel_id }, data: { average_rating: agg._avg.rating || 0 } });

    res.json({ success: true, message: 'Review deleted' });
  } catch (err) { next(err); }
};
