import { Request, Response, NextFunction } from 'express';
import * as attractionService from '../services/attraction.service';
import { attractionSchema, updateAttractionSchema } from '../schemas/attraction.schema';
import { ZodError } from 'zod';

export const getAttractions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const locationId = req.query.location_id ? parseInt(req.query.location_id as string, 10) : undefined;
    
    // Parse tags query parameter (e.g. ?tags=Adventure,Summer)
    let tagNames: string[] | undefined;
    if (typeof req.query.tags === 'string') {
      tagNames = req.query.tags.split(',').map(tag => tag.trim());
    }

    const attractions = await attractionService.getAllAttractions(locationId, tagNames);
    
    // Format output to remove the join table structure for a cleaner response
    const formattedAttractions = attractions.map((att: any) => ({
      ...att,
      tags: att.tags.map((t: any) => t.tag)
    }));

    res.json({ success: true, count: formattedAttractions.length, data: formattedAttractions });
  } catch (error) {
    next(error);
  }
};

export const getAttraction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid attraction ID' });
      return;
    }
    const attraction = await attractionService.getAttractionById(id);
    if (!attraction) {
       res.status(404).json({ success: false, message: 'Attraction not found' });
       return;
    }
    
    // Format tags
    const formattedAttraction = {
      ...attraction,
      // @ts-ignore
      tags: attraction.tags.map((t: any) => t.tag)
    };

    res.json({ success: true, data: formattedAttraction });
  } catch (error) {
    next(error);
  }
};

export const createAttraction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = attractionSchema.parse(req.body);
    const attraction = await attractionService.createAttraction(validatedData);
    
    const formattedAttraction = {
      ...attraction,
      // @ts-ignore
      tags: attraction.tags.map((t: any) => t.tag)
    };
    
    res.status(201).json({ success: true, data: formattedAttraction });
  } catch (error: any) {
    if (error instanceof ZodError) {
       res.status(400).json({ success: false, message: 'Validation error', errors: error.issues });
       return;
    }
    next(error);
  }
};

export const updateAttraction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid attraction ID' });
      return;
    }
    const validatedData = updateAttractionSchema.parse(req.body);
    const attraction = await attractionService.updateAttraction(id, validatedData);
    
    const formattedAttraction = {
      ...attraction,
      // @ts-ignore
      tags: attraction.tags.map((t: any) => t.tag)
    };
    
    res.json({ success: true, data: formattedAttraction });
  } catch (error: any) {
    if (error instanceof ZodError) {
       res.status(400).json({ success: false, message: 'Validation error', errors: error.issues });
       return;
    }
    if (error.code === 'P2025') {
       res.status(404).json({ success: false, message: 'Attraction not found' });
       return;
    }
    next(error);
  }
};

export const deleteAttraction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid attraction ID' });
      return;
    }
    await attractionService.deleteAttraction(id);
    res.json({ success: true, message: 'Attraction deleted successfully' });
  } catch (error: any) {
    if (error.code === 'P2025') {
       res.status(404).json({ success: false, message: 'Attraction not found' });
       return;
    }
    next(error);
  }
};
