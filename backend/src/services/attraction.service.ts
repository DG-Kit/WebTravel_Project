import prisma from '../config/prisma';

export const getAllAttractions = async (locationId?: number, tagNames?: string[]) => {
  const whereClause: any = {};
  
  if (locationId) {
    whereClause.location_id = locationId;
  }
  
  if (tagNames && tagNames.length > 0) {
    whereClause.tags = {
      some: {
        tag: {
          name: { in: tagNames }
        }
      }
    };
  }

  return await prisma.attraction.findMany({
    where: whereClause,
    include: {
      location: true,
      tags: {
        include: {
          tag: true
        }
      }
    }
  });
};

export const getAttractionById = async (id: number) => {
  return await prisma.attraction.findUnique({
    where: { attraction_id: id },
    include: {
      location: true,
      tags: {
        include: {
          tag: true
        }
      }
    }
  });
};

export const createAttraction = async (data: any) => {
  const { tag_ids, ...attractionData } = data;
  
  return await prisma.attraction.create({
    data: {
      ...attractionData,
      tags: tag_ids && tag_ids.length > 0 ? {
        create: tag_ids.map((tagId: number) => ({
          tag: { connect: { tag_id: tagId } }
        }))
      } : undefined
    },
    include: {
      tags: { include: { tag: true } }
    }
  });
};

export const updateAttraction = async (id: number, data: any) => {
  const { tag_ids, ...attractionData } = data;
  
  // If tag_ids are provided, we replace the existing ones
  // by first deleting all mapping records for this attraction,
  // then creating the new ones.
  if (tag_ids !== undefined) {
    await prisma.attractionTag.deleteMany({
      where: { attraction_id: id }
    });
  }

  return await prisma.attraction.update({
    where: { attraction_id: id },
    data: {
      ...attractionData,
      ...(tag_ids !== undefined && tag_ids.length > 0 ? {
        tags: {
          create: tag_ids.map((tagId: number) => ({
            tag: { connect: { tag_id: tagId } }
          }))
        }
      } : {})
    },
    include: {
      tags: { include: { tag: true } }
    }
  });
};

export const deleteAttraction = async (id: number) => {
  // Delete Many-to-Many relations first
  await prisma.attractionTag.deleteMany({
    where: { attraction_id: id }
  });
  
  return await prisma.attraction.delete({
    where: { attraction_id: id }
  });
};
