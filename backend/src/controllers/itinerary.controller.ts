import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middlewares/auth';

export const saveItinerary = async (req: AuthRequest, res: Response) => {
  try {
    const { locationId, hotelId, itineraryData } = req.body;
    const userId = req.user?.user_id;

    if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const saved = await prisma.savedItinerary.create({
      data: {
        user_id: userId,
        location_id: parseInt(locationId),
        hotel_id: parseInt(hotelId),
        itinerary_data: JSON.stringify(itineraryData)
      },
      include: {
        location: true,
        hotel: true
      }
    });

    res.json({ success: true, data: saved });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyItineraries = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.user_id;
    if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const itineraries = await prisma.savedItinerary.findMany({
      where: { user_id: userId },
      include: {
        location: true,
        hotel: {
          include: {
            images: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    // Parse JSON string back to object
    const parsedItineraries = itineraries.map((it: any) => ({
      ...it,
      itinerary_data: JSON.parse(it.itinerary_data)
    }));

    res.json({ success: true, data: parsedItineraries });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteItinerary = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.user_id;
    if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    await prisma.savedItinerary.delete({
      where: { 
        itinerary_id: parseInt(id as string),
        user_id: userId 
      }
    });

    res.json({ success: true, message: 'Đã xóa lịch trình.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
