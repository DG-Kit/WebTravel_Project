import prisma from '../config/prisma';

export const getAllHotels = async (locationId?: number) => {
  return await prisma.hotel.findMany({
    where: locationId ? { location_id: locationId } : undefined,
    include: {
      location: true,
      images: true,
      amenities: true,
      tags: { include: { tag: true } }
    }
  });
};

export const getHotelById = async (id: number) => {
  return await prisma.hotel.findUnique({
    where: { hotel_id: id },
    include: {
      location: true,
      images: true,
      amenities: true,
      tags: { include: { tag: true } },
      rooms: { include: { images: true } },
      owner: { select: { user_id: true, full_name: true, email: true } }
    }
  });
};

export const createHotel = async (data: any) => {
  const { tag_ids, amenities, image_urls, rooms, ...hotelData } = data;
  
  return await prisma.hotel.create({
    data: {
      ...hotelData,
      tags: tag_ids && tag_ids.length > 0 ? {
        create: tag_ids.map((tagId: number) => ({
          tag: { connect: { tag_id: tagId } }
        }))
      } : undefined,
      amenities: amenities && amenities.length > 0 ? {
        create: amenities.map((name: string) => ({ amenity_name: name }))
      } : undefined,
      images: image_urls && image_urls.length > 0 ? {
        create: image_urls.map((url: string) => ({ image_url: url }))
      } : undefined,
      rooms: rooms && rooms.length > 0 ? {
        create: rooms.map((room: any) => ({
          room_type: room.room_type,
          price: room.price,
          capacity: room.capacity,
          is_available: room.is_available,
          images: room.image_urls && room.image_urls.length > 0 ? {
            create: room.image_urls.map((url: string) => ({ image_url: url }))
          } : undefined
        }))
      } : undefined
    },
    include: {
      location: true,
      images: true,
      amenities: true,
      tags: { include: { tag: true } },
      rooms: { include: { images: true } }
    }
  });
};

export const updateHotel = async (id: number, data: any) => {
  const { tag_ids, amenities, image_urls, rooms, ...hotelData } = data;
  
  // Handle nested relationships by clearing old mappings if replacements are provided
  if (tag_ids !== undefined) {
    await prisma.hotelTag.deleteMany({ where: { hotel_id: id } });
  }
  if (amenities !== undefined) {
    await prisma.hotelAmenity.deleteMany({ where: { hotel_id: id } });
  }
  if (image_urls !== undefined) {
    await prisma.hotelImage.deleteMany({ where: { hotel_id: id } });
  }

  return await prisma.hotel.update({
    where: { hotel_id: id },
    data: {
      ...hotelData,
      ...(tag_ids !== undefined ? {
        tags: { create: tag_ids.map((tagId: number) => ({ tag: { connect: { tag_id: tagId } } })) }
      } : {}),
      ...(amenities !== undefined ? {
        amenities: { create: amenities.map((name: string) => ({ amenity_name: name })) }
      } : {}),
      ...(image_urls !== undefined ? {
        images: { create: image_urls.map((url: string) => ({ image_url: url })) }
      } : {})
    },
    include: {
      images: true,
      amenities: true,
      tags: { include: { tag: true } }
    }
  });
};

export const deleteHotel = async (id: number) => {
  // Cascading deletes typically configured in Prisma, but missing `onDelete: Cascade` in schema
  // We must delete dependent child records first due to SQL Server constraints
  await prisma.hotelTag.deleteMany({ where: { hotel_id: id } });
  await prisma.hotelAmenity.deleteMany({ where: { hotel_id: id } });
  await prisma.hotelImage.deleteMany({ where: { hotel_id: id } });
  
  // Delete RoomImages then Rooms
  const rooms = await prisma.room.findMany({ where: { hotel_id: id } });
  for (const room of rooms) {
    await prisma.roomImage.deleteMany({ where: { room_id: room.room_id } });
  }
  await prisma.room.deleteMany({ where: { hotel_id: id } });

  return await prisma.hotel.delete({
    where: { hotel_id: id }
  });
};
