import { Request, Response, NextFunction } from 'express';
import * as locationService from '../services/location.service';
import { locationSchema, updateLocationSchema } from '../schemas/location.schema';
import { ZodError } from 'zod';

export const getLocations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { query } = req.query;
    if (typeof query === 'string' && query.trim() !== '') {
      const locations = await locationService.searchLocations(query.trim());
      res.json({ success: true, data: locations });
      return;
    }
    
    const locations = await locationService.getAllLocations();
    res.json({ success: true, data: locations });
  } catch (error) {
    next(error);
  }
};

export const getLocation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid location ID' });
      return;
    }
    const location = await locationService.getLocationById(id);
    if (!location) {
       res.status(404).json({ success: false, message: 'Location not found' });
       return;
    }
    res.json({ success: true, data: location });
  } catch (error) {
    next(error);
  }
};

export const createLocation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = locationSchema.parse(req.body);
    const location = await locationService.createLocation(validatedData);
    res.status(201).json({ success: true, data: location });
  } catch (error: any) {
    if (error instanceof ZodError) {
       res.status(400).json({ success: false, message: 'Validation error', errors: error.issues });
       return;
    }
    next(error);
  }
};

export const updateLocation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid location ID' });
      return;
    }
    const validatedData = updateLocationSchema.parse(req.body);
    const location = await locationService.updateLocation(id, validatedData);
    res.json({ success: true, data: location });
  } catch (error: any) {
    if (error instanceof ZodError) {
       res.status(400).json({ success: false, message: 'Validation error', errors: error.issues });
       return;
    }
    if (error.code === 'P2025') {
       res.status(404).json({ success: false, message: 'Location not found' });
       return;
    }
    next(error);
  }
};

export const deleteLocation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid location ID' });
      return;
    }
    await locationService.deleteLocation(id);
    res.json({ success: true, message: 'Location deleted successfully' });
  } catch (error: any) {
    if (error.code === 'P2025') {
       res.status(404).json({ success: false, message: 'Location not found' });
       return;
    }
    next(error);
  }
};
