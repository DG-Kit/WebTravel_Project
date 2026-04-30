import { Request, Response, NextFunction } from 'express';
import * as hotelService from '../services/hotel.service';
import { hotelSchema, updateHotelSchema } from '../schemas/hotel.schema';
import { ZodError } from 'zod';

export const getHotels = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const locIdStr = req.query.location_id as string;
    const ownIdStr = req.query.owner_id as string;
    
    const locationId = (locIdStr && !isNaN(parseInt(locIdStr))) ? parseInt(locIdStr, 10) : undefined;
    const ownerId = (ownIdStr && !isNaN(parseInt(ownIdStr))) ? parseInt(ownIdStr, 10) : undefined;
    
    const hotels = await hotelService.getAllHotels(locationId, ownerId);
    
    // Formatting response
    const formattedHotels = hotels.map((hotel: any) => ({
      ...hotel,
      tags: hotel.tags.map((t: any) => t.tag),
      images: hotel.images.map((img: any) => img.image_url),
      amenities: hotel.amenities.map((amenity: any) => amenity.amenity_name)
    }));

    res.json({ success: true, count: formattedHotels.length, data: formattedHotels });
  } catch (error) {
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
    
    // Formatting response
    const formattedHotel = {
      ...hotel,
      tags: hotel.tags.map((t: any) => t.tag),
      images: hotel.images.map((img: any) => img.image_url),
      amenities: hotel.amenities.map((amenity: any) => amenity.amenity_name)
    };

    res.json({ success: true, data: formattedHotel });
  } catch (error) {
    next(error);
  }
};

export const createHotel = async (req: any, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    let validatedData = hotelSchema.parse(req.body);

    // If user is a HOST, they can only create hotels for themselves
    if (user.role.toUpperCase() === 'HOST') {
      validatedData.owner_id = user.user_id;
    }

    const hotel = await hotelService.createHotel(validatedData);
    
    const formattedHotel = {
      ...hotel,
      // @ts-ignore
      tags: hotel.tags ? hotel.tags.map((t: any) => t.tag) : [],
      // @ts-ignore
      images: hotel.images ? hotel.images.map((img: any) => img.image_url) : [],
      // @ts-ignore
      amenities: hotel.amenities ? hotel.amenities.map((a: any) => a.amenity_name) : []
    };

    res.status(201).json({ success: true, data: formattedHotel });
  } catch (error: any) {
    if (error instanceof ZodError) {
       res.status(400).json({ success: false, message: 'Validation error', errors: error.issues });
       return;
    }
    next(error);
  }
};

export const updateHotel = async (req: any, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const user = req.user;

    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid hotel ID' });
      return;
    }

    // Check ownership
    const existingHotel = await hotelService.getHotelById(id);
    if (!existingHotel) {
      res.status(404).json({ success: false, message: 'Hotel not found' });
      return;
    }

    if (user.role.toUpperCase() !== 'ADMIN' && existingHotel.owner_id !== user.user_id) {
      res.status(403).json({ success: false, message: 'Forbidden: You do not own this hotel' });
      return;
    }

    const validatedData = updateHotelSchema.parse(req.body);
    // Hosts cannot change the owner of the hotel
    if (user.role.toUpperCase() === 'HOST') {
      delete validatedData.owner_id;
    }

    const hotel = await hotelService.updateHotel(id, validatedData);
    
    const formattedHotel = {
      ...hotel,
      // @ts-ignore
      tags: hotel.tags ? hotel.tags.map((t: any) => t.tag) : [],
      // @ts-ignore
      images: hotel.images ? hotel.images.map((img: any) => img.image_url) : [],
      // @ts-ignore
      amenities: hotel.amenities ? hotel.amenities.map((a: any) => a.amenity_name) : []
    };

    res.json({ success: true, data: formattedHotel });
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

export const deleteHotel = async (req: any, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const user = req.user;

    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid hotel ID' });
      return;
    }

    // Check ownership
    const existingHotel = await hotelService.getHotelById(id);
    if (!existingHotel) {
      res.status(404).json({ success: false, message: 'Hotel not found' });
      return;
    }

    if (user.role.toUpperCase() !== 'ADMIN' && existingHotel.owner_id !== user.user_id) {
      res.status(403).json({ success: false, message: 'Forbidden: You do not own this hotel' });
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
