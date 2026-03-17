import prisma from '../config/prisma';

export const getAllTags = async () => {
  return await prisma.tag.findMany();
};

export const getTagById = async (id: number) => {
  return await prisma.tag.findUnique({
    where: { tag_id: id }
  });
};

export const createTag = async (data: { name: string; type: string }) => {
  return await prisma.tag.create({
    data
  });
};

export const updateTag = async (id: number, data: { name?: string; type?: string }) => {
  return await prisma.tag.update({
    where: { tag_id: id },
    data
  });
};

export const deleteTag = async (id: number) => {
  return await prisma.tag.delete({
    where: { tag_id: id }
  });
};
