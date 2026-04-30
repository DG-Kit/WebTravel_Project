import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { getMe, updateProfile, updateProfileSchema, getAllUsers, toggleUserStatus, adminUpdateUser } from '../services/user.service';
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

export const getUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const users = await getAllUsers();
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (err) {
    next(err);
  }
};

export const updateUserStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const { is_active } = req.body;
    const user = await toggleUserStatus(id, is_active);
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

export const updateUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const user = await adminUpdateUser(id, req.body);
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};
