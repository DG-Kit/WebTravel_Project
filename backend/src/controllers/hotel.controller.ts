import { Request, Response, NextFunction } from 'express';
import * as hotelService from '../services/hotel.service';
import { getAIRecommendations, generateAIItinerary } from '../services/ai.service';
import prisma from '../config/prisma';
import { hotelSchema, updateHotelSchema } from '../schemas/hotel.schema';
import { ZodError } from 'zod';

export const getHotels = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const locIdStr = req.query.location_id as string;
    const ownIdStr = req.query.owner_id as string;
    
    const locationId = (locIdStr && !isNaN(parseInt(locIdStr))) ? parseInt(locIdStr, 10) : undefined;
    const ownerId = (ownIdStr && !isNaN(parseInt(ownIdStr))) ? parseInt(ownIdStr, 10) : undefined;
    
    const hotels = await hotelService.getAllHotels(locationId, ownerId);
    
    // Default sorting: highest rating first
    hotels.sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));

    res.json({ success: true, count: hotels.length, data: hotels });
  } catch (error) {
    next(error);
  }
};

export const getRecommendedHotels = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // user_id comes from the JWT token via authenticate middleware
    const userId = (req as any).user?.user_id;
    if (!userId) {
      res.json({ success: true, data: [], hasPreferences: false });
      return;
    }

    const hotels = await hotelService.getAllHotels();
    const recommended = await getAIRecommendations(userId, hotels);

    console.log('DEBUG: Recommendations calculated:', recommended.length);

    // Check if user has actually filled in preferences (not just has a record)
    const userPreference = await prisma.userPreference.findUnique({ 
      where: { user_id: userId } 
    });
    const hasPreferences = !!(
      userPreference && 
      (userPreference.travel_style?.trim() || userPreference.preferred_categories?.trim())
    );

    res.json({ 
      success: true, 
      data: recommended, // Remove slice limit
      hasPreferences
    });
  } catch (error: any) {
    console.error('DEBUG: Error in getRecommendedHotels:', error.message);
    next(error);
  }
};

export const getFilterMetadata = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const countries = await prisma.location.findMany({
      select: { country: true },
      distinct: ['country']
    });

    const amenities = await prisma.hotelAmenity.findMany({
      select: { amenity_name: true },
      distinct: ['amenity_name']
    });

    const travelStyles = await prisma.tag.findMany({
      where: { type: 'travel_style' },
      select: { name: true }
    });

    res.json({
      success: true,
      data: {
        countries: countries.map(c => c.country),
        amenities: amenities.map(a => a.amenity_name),
        travelStyles: travelStyles.map(t => t.name)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getItinerary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.user_id;
    const locationId = parseInt(req.params.locationId as string, 10);

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const result = await generateAIItinerary(userId, locationId);
    res.json(result);
  } catch (error: any) {
    next(error);
  }
};

export const getHotel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid hotel ID' });
      return;
    }
    const hotel = await hotelService.getHotelById(id);
    if (!hotel) {
       res.status(404).json({ success: false, message: 'Hotel not found' });
       return;
    }
    res.json({ success: true, data: hotel });
  } catch (error) {
    next(error);
  }
};

export const createHotel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = hotelSchema.parse(req.body);
    const hotel = await hotelService.createHotel(validatedData);
    res.status(201).json({ success: true, data: hotel });
  } catch (error: any) {
    if (error instanceof ZodError) {
       res.status(400).json({ success: false, message: 'Validation error', errors: error.issues });
       return;
    }
    next(error);
  }
};

export const updateHotel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid hotel ID' });
      return;
    }
    const validatedData = updateHotelSchema.parse(req.body);
    const hotel = await hotelService.updateHotel(id, validatedData);
    res.json({ success: true, data: hotel });
  } catch (error: any) {
    if (error instanceof ZodError) {
       res.status(400).json({ success: false, message: 'Validation error', errors: error.issues });
       return;
    }
    if (error.code === 'P2025') {
       res.status(404).json({ success: false, message: 'Hotel not found' });
       return;
    }
    next(error);
  }
};

export const deleteHotel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid hotel ID' });
      return;
    }
    await hotelService.deleteHotel(id);
    res.json({ success: true, message: 'Hotel deleted successfully' });
  } catch (error: any) {
    if (error.code === 'P2025') {
       res.status(404).json({ success: false, message: 'Hotel not found' });
       return;
    }
    next(error);
  }
};
