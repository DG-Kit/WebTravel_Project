import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { getMe, updateProfile, updateProfileSchema } from '../services/user.service';
import { ZodError } from 'zod';

export const getMyProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await getMe(req.user!.user_id);
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

export const updateMyProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const parsed = updateProfileSchema.parse(req.body);
    const user = await updateProfile(req.user!.user_id, parsed);
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({ success: false, message: err.issues[0]?.message });
      return;
    }
    next(err);
  }
};
