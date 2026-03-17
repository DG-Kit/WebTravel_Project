import prisma from '../config/prisma';

export const getAllLocations = async () => {
  return await prisma.location.findMany();
};

export const getLocationById = async (id: number) => {
  return await prisma.location.findUnique({
    where: { location_id: id },
    include: {
      attractions: true,
      hotels: true
    }
  });
};

export const searchLocations = async (query: string) => {
  return await prisma.location.findMany({
    where: {
      OR: [
        { name: { contains: query } },
        { country: { contains: query } }
      ]
    }
  });
};

export const createLocation = async (data: { name: string; country: string; latitude: number; longitude: number }) => {
  return await prisma.location.create({
    data
  });
};

export const updateLocation = async (id: number, data: { name?: string; country?: string; latitude?: number; longitude?: number }) => {
  return await prisma.location.update({
    where: { location_id: id },
    data
  });
};

export const deleteLocation = async (id: number) => {
  return await prisma.location.delete({
    where: { location_id: id }
  });
};
