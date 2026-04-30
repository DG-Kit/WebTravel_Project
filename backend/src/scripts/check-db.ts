import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const hotels = await prisma.hotel.findMany({
    select: { hotel_id: true, name: true, owner_id: true }
  });
  console.log('HOTELS IN DB:');
  console.log(hotels);

  const users = await prisma.user.findMany({
    select: { user_id: true, email: true, role: true }
  });
  console.log('USERS IN DB:');
  console.log(users);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
