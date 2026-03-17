import { Request, Response, NextFunction } from 'express';
import * as tagService from '../services/tag.service';
import { tagSchema, updateTagSchema } from '../schemas/tag.schema';
import { ZodError } from 'zod';

export const getTags = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tags = await tagService.getAllTags();
    res.json({ success: true, data: tags });
  } catch (error) {
    next(error);
  }
};

export const getTag = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid tag ID' });
      return;
    }
    const tag = await tagService.getTagById(id);
    if (!tag) {
       res.status(404).json({ success: false, message: 'Tag not found' });
       return;
    }
    res.json({ success: true, data: tag });
  } catch (error) {
    next(error);
  }
};

export const createTag = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = tagSchema.parse(req.body);
    const tag = await tagService.createTag(validatedData);
    res.status(201).json({ success: true, data: tag });
  } catch (error: any) {
    if (error instanceof ZodError) {
       res.status(400).json({ success: false, message: 'Validation error', errors: error.issues });
       return;
    }
    // Handle unique constraint violation
    if (error.code === 'P2002') {
       res.status(409).json({ success: false, message: 'Tag with this name already exists' });
       return;
    }
    next(error);
  }
};

export const updateTag = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid tag ID' });
      return;
    }
    const validatedData = updateTagSchema.parse(req.body);
    const tag = await tagService.updateTag(id, validatedData);
    res.json({ success: true, data: tag });
  } catch (error: any) {
    if (error instanceof ZodError) {
       res.status(400).json({ success: false, message: 'Validation error', errors: error.issues });
       return;
    }
    if (error.code === 'P2025') {
       res.status(404).json({ success: false, message: 'Tag not found' });
       return;
    }
    if (error.code === 'P2002') {
       res.status(409).json({ success: false, message: 'Tag with this name already exists' });
       return;
    }
    next(error);
  }
};

export const deleteTag = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid tag ID' });
      return;
    }
    await tagService.deleteTag(id);
    res.json({ success: true, message: 'Tag deleted successfully' });
  } catch (error: any) {
    if (error.code === 'P2025') {
       res.status(404).json({ success: false, message: 'Tag not found' });
       return;
    }
    next(error);
  }
};
