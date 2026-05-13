import axios from 'axios';
import prisma from '../config/prisma';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export const getAIRecommendations = async (userId: number, hotels: any[]) => {
  try {
    // 1. Get user preferences
    const preferences = await prisma.userPreference.findUnique({
      where: { user_id: userId }
    });

    if (!preferences) return hotels; // Fallback to original list if no prefs

    // 2. Prepare payload for Python AI Service
    // We send: 
    // - user_interests: comma-separated tags from profile
    // - budget_level: user budget (1-3)
    // - hotels: list of hotels with their tags for scoring
    const payload = {
      user_interests: (preferences.preferred_categories || '') + ',' + (preferences.travel_style || ''),
      budget_level: preferences.budget_level || 2,
      hotels: hotels.map(h => ({
        id: h.hotel_id,
        name: h.name,
        price: h.rooms?.[0]?.price || 0,
        tags: h.tags?.map((t: any) => t.tag.name) || [],
        rating: h.average_rating || 0
      }))
    };

    // 3. Call Python FastAPI Service
    console.log(`Calling AI Service at ${AI_SERVICE_URL}/recommend...`);
    const response = await axios.post(`${AI_SERVICE_URL}/recommend`, payload, {
        timeout: 2000 // 2 second timeout for fast response
    });

    if (response.data.success) {
      const rankedIds = response.data.data; // Array of { id, score }
      
      // 4. Merge scores into original hotel objects and sort
      return hotels.map(h => {
        const rank = rankedIds.find((r: any) => r.id === h.hotel_id);
        return {
          ...h,
          match_score: rank ? Math.round(rank.score * 100) : 0
        };
      }).sort((a, b) => (b.match_score || 0) - (a.match_score || 0));
    }

    return hotels;
  } catch (error: any) {
    console.error('AI Service Error:', error.message);
    return hotels; // Fallback to normal list on error
  }
};

export const generateAIItinerary = async (userId: number, locationId: number) => {
  try {
    // 1. Get user preferences
    const preferences = await prisma.userPreference.findUnique({ where: { user_id: userId } });
    if (!preferences) throw new Error('Vui lòng thiết lập sở thích trong Profile trước.');

    // 2. Get hotels and attractions for this location
    const [hotels, attractions] = await Promise.all([
      prisma.hotel.findMany({ 
        where: { location_id: locationId },
        include: { tags: { include: { tag: true } }, rooms: true }
      }),
      prisma.attraction.findMany({
        where: { location_id: locationId },
        include: { tags: { include: { tag: true } } }
      })
    ]);

    // 3. Prepare payload
    const payload = {
      user_interests: (preferences.preferred_categories || '') + ',' + (preferences.travel_style || ''),
      budget_level: preferences.budget_level || 2,
      hotels: hotels.map(h => ({
        id: h.hotel_id,
        name: h.name,
        price: Number(h.rooms?.[0]?.price || 0),
        tags: h.tags?.map((t: any) => t.tag.name) || [],
        rating: h.average_rating || 0
      })),
      attractions: attractions.map(a => ({
        id: a.attraction_id,
        name: a.name,
        tags: a.tags?.map((t: any) => t.tag.name) || [],
        popularity: a.popularity_score || 0
      }))
    };

    // 4. Call Python FastAPI Service
    const response = await axios.post(`${AI_SERVICE_URL}/generate-itinerary`, payload);
    return response.data;
  } catch (error: any) {
    console.error('Itinerary Error:', error.message);
    throw error;
  }
};
