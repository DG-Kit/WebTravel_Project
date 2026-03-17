import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting Phase 2 seed...');

  const hashedPassword = await bcrypt.hash('password123', 10);

  // ─── Users ────────────────────────────────────────────────────────────
  const hostUser = await prisma.user.upsert({
    where: { email: 'host@webtravel.com' },
    update: {},
    create: { email: 'host@webtravel.com', password_hash: hashedPassword, full_name: 'Hotel Manager', role: 'HOST' },
  });
  await prisma.user.upsert({
    where: { email: 'admin@webtravel.com' },
    update: {},
    create: { email: 'admin@webtravel.com', password_hash: hashedPassword, full_name: 'Admin User', role: 'ADMIN' },
  });
  console.log('Users OK');

  // ─── Tags ──────────────────────────────────────────────────────────────
  const tagDefs = [
    { name: 'Adventure', type: 'Travel Style' },
    { name: 'Relaxing', type: 'Travel Style' },
    { name: 'Cultural', type: 'Travel Style' },
    { name: 'Luxury', type: 'Travel Style' },
    { name: 'Free Wi-Fi', type: 'Hotel Amenity' },
    { name: 'Swimming Pool', type: 'Hotel Amenity' },
    { name: 'Spa', type: 'Hotel Amenity' },
    { name: 'Restaurant', type: 'Hotel Amenity' },
    { name: 'Beach Access', type: 'Hotel Amenity' },
    { name: 'Fitness Center', type: 'Hotel Amenity' },
  ];
  for (const t of tagDefs) {
    await prisma.tag.upsert({ where: { name: t.name }, update: {}, create: t });
  }
  const wifiTag = await prisma.tag.findUnique({ where: { name: 'Free Wi-Fi' } });
  const poolTag = await prisma.tag.findUnique({ where: { name: 'Swimming Pool' } });
  const adventureTag = await prisma.tag.findUnique({ where: { name: 'Adventure' } });
  const culturalTag = await prisma.tag.findUnique({ where: { name: 'Cultural' } });
  console.log('Tags OK');

  // ─── Locations ─────────────────────────────────────────────────────────
  const locDefs = [
    { name: 'Da Nang', country: 'Vietnam', latitude: 16.0544, longitude: 108.2022 },
    { name: 'Tokyo', country: 'Japan', latitude: 35.6762, longitude: 139.6503 },
    { name: 'Maldives', country: 'Maldives', latitude: 3.2028, longitude: 73.2207 },
    { name: 'Paris', country: 'France', latitude: 48.8566, longitude: 2.3522 },
    { name: 'Bali', country: 'Indonesia', latitude: -8.3405, longitude: 115.0920 },
    { name: 'Dubai', country: 'UAE', latitude: 25.2048, longitude: 55.2708 },
  ];

  const locations: Record<string, any> = {};
  for (const loc of locDefs) {
    // Use findFirst so it's idempotent
    const existing = await prisma.location.findFirst({ where: { name: loc.name, country: loc.country } });
    locations[loc.name] = existing ?? await prisma.location.create({ data: loc });
  }
  console.log('Locations OK');

  // ─── Attractions ───────────────────────────────────────────────────────
  const attractionDefs = [
    // Da Nang
    { name: 'Marble Mountains', category: 'Nature', description: 'A cluster of five limestone and marble mountains riddled with Buddhist sanctuaries and caves.', popularity_score: 9.1, best_time_to_visit: 'February – May', location: 'Da Nang', tagIds: [culturalTag?.tag_id, adventureTag?.tag_id] },
    { name: 'Dragon Bridge', category: 'Landmark', description: 'Iconic dragon-shaped bridge spanning the Han River, breathing fire on weekends.', popularity_score: 8.8, best_time_to_visit: 'Year-round', location: 'Da Nang', tagIds: [culturalTag?.tag_id] },
    { name: 'My Khe Beach', category: 'Beach', description: 'Pristine white-sand beach stretching 20 km along the coast — one of Asia\'s finest.', popularity_score: 9.2, best_time_to_visit: 'May – August', location: 'Da Nang', tagIds: [adventureTag?.tag_id] },
    { name: 'Son Tra Peninsula', category: 'Nature', description: 'A nature reserve home to red-shanked douc langurs, stunning viewpoints and the Lady Buddha statue.', popularity_score: 9.0, best_time_to_visit: 'March – September', location: 'Da Nang', tagIds: [adventureTag?.tag_id] },
    // Tokyo
    { name: 'Mount Fuji', category: 'Nature', description: 'Japan\'s highest peak and most iconic symbol — a UNESCO World Heritage site.', popularity_score: 9.8, best_time_to_visit: 'July – August', location: 'Tokyo', tagIds: [adventureTag?.tag_id] },
    { name: 'Senso-ji Temple', category: 'Cultural', description: 'Tokyo\'s oldest Buddhist temple in Asakusa, surrounded by traditional shops.', popularity_score: 9.5, best_time_to_visit: 'Spring – Autumn', location: 'Tokyo', tagIds: [culturalTag?.tag_id] },
    { name: 'Shibuya Crossing', category: 'Landmark', description: 'The world\'s busiest pedestrian crossing, a symbol of Tokyo\'s vibrant energy.', popularity_score: 9.4, best_time_to_visit: 'Year-round', location: 'Tokyo', tagIds: [culturalTag?.tag_id] },
    // Maldives
    { name: 'Bioluminescent Beach', category: 'Nature', description: 'A magical beach where the ocean glows blue at night due to phytoplankton.', popularity_score: 9.9, best_time_to_visit: 'November – April', location: 'Maldives', tagIds: [adventureTag?.tag_id] },
    { name: 'Coral Reef Diving', category: 'Adventure', description: 'World-class scuba diving and snorkelling among vibrant coral gardens.', popularity_score: 9.7, best_time_to_visit: 'December – April', location: 'Maldives', tagIds: [adventureTag?.tag_id] },
    // Paris
    { name: 'Eiffel Tower', category: 'Landmark', description: 'The iconic iron lattice tower on the Champ de Mars — symbol of France.', popularity_score: 9.9, best_time_to_visit: 'April – June', location: 'Paris', tagIds: [culturalTag?.tag_id] },
    { name: 'Louvre Museum', category: 'Cultural', description: 'World\'s largest art museum, home to the Mona Lisa and Venus de Milo.', popularity_score: 9.8, best_time_to_visit: 'Year-round', location: 'Paris', tagIds: [culturalTag?.tag_id] },
    // Bali
    { name: 'Uluwatu Temple', category: 'Cultural', description: 'Clifftop Hindu temple offering dramatic Indian Ocean views and fire dance performances.', popularity_score: 9.3, best_time_to_visit: 'June – September', location: 'Bali', tagIds: [culturalTag?.tag_id] },
    { name: 'Tegallalang Rice Terraces', category: 'Nature', description: 'Stunning UNESCO-listed terraced rice paddies in the highlands of Ubud.', popularity_score: 9.2, best_time_to_visit: 'July – August', location: 'Bali', tagIds: [adventureTag?.tag_id] },
    // Dubai
    { name: 'Burj Khalifa', category: 'Landmark', description: 'The world\'s tallest building at 828 m — observation deck offers breathtaking views.', popularity_score: 9.8, best_time_to_visit: 'October – April', location: 'Dubai', tagIds: [culturalTag?.tag_id] },
    { name: 'Dubai Desert Safari', category: 'Adventure', description: 'Thrilling dune bashing, camel riding and traditional Bedouin dinner under the stars.', popularity_score: 9.5, best_time_to_visit: 'October – March', location: 'Dubai', tagIds: [adventureTag?.tag_id] },
  ];

  for (const a of attractionDefs) {
    const loc = locations[a.location];
    if (!loc) continue;
    const existing = await prisma.attraction.findFirst({ where: { name: a.name, location_id: loc.location_id } });
    if (!existing) {
      await prisma.attraction.create({
        data: {
          name: a.name,
          category: a.category,
          description: a.description,
          popularity_score: a.popularity_score,
          best_time_to_visit: a.best_time_to_visit,
          location_id: loc.location_id,
          tags: {
            create: a.tagIds.filter(Boolean).map((tid) => ({ tag_id: tid as number })),
          },
        },
      });
    }
  }
  console.log('Attractions OK');

  // ─── Hotels ────────────────────────────────────────────────────────────
  const hotelDefs = [
    {
      name: 'InterContinental Danang Sun Peninsula Resort',
      address: 'Bai Bac, Son Tra Peninsula, Da Nang',
      location: 'Da Nang', star_rating: 5, average_rating: 4.8, popularity_score: 9.9,
      description: 'Nestled in pristine nature on Son Tra Peninsula, this award-winning resort blends luxury with spectacular ocean views.',
      images: ['https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1000&q=80', 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1000&q=80'],
      amenities: ['Free Wi-Fi', 'Infinity Pool', 'Spa & Wellness', 'Private Beach', 'Fitness Center', 'Fine Dining Restaurant', '24/7 Concierge'],
      rooms: [
        { room_type: 'Classic Ocean View', price: 500, capacity: 2, image: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1000&q=80' },
        { room_type: 'Son Tra Terrace Suite', price: 850, capacity: 2, image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1000&q=80' },
        { room_type: 'Presidential Villa', price: 2000, capacity: 4, image: 'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?auto=format&fit=crop&w=1000&q=80' },
      ],
    },
    {
      name: 'Fusion Maia Da Nang',
      address: 'Vo Nguyen Giap, My Khe Beach, Da Nang',
      location: 'Da Nang', star_rating: 5, average_rating: 4.7, popularity_score: 9.5,
      description: 'Asia\'s first all-spa resort where breakfast is served whenever and wherever you want.',
      images: ['https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=1000&q=80', 'https://images.unsplash.com/photo-1568084680786-a84f91d1153c?auto=format&fit=crop&w=1000&q=80'],
      amenities: ['Free Wi-Fi', 'Swimming Pool', 'Unlimited Spa', 'Beach Access', 'Restaurant', 'Butler Service'],
      rooms: [
        { room_type: 'Pool Villa', price: 400, capacity: 2, image: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1000&q=80' },
        { room_type: 'Garden Pool Villa', price: 550, capacity: 3, image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1000&q=80' },
      ],
    },
    {
      name: 'Park Hyatt Tokyo',
      address: 'Shinjuku Park Tower, Nishi-Shinjuku, Tokyo',
      location: 'Tokyo', star_rating: 5, average_rating: 4.9, popularity_score: 9.8,
      description: 'Occupying the top 14 floors of Shinjuku Park Tower with panoramic views of Mount Fuji.',
      images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1000&q=80', 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1000&q=80'],
      amenities: ['Free Wi-Fi', 'Indoor Pool', 'Spa', 'New York Grill Restaurant', 'Fitness Center', 'Business Center'],
      rooms: [
        { room_type: 'Park Room', price: 600, capacity: 2, image: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1000&q=80' },
        { room_type: 'Deluxe Room City View', price: 800, capacity: 2, image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1000&q=80' },
        { room_type: 'Suite', price: 1500, capacity: 4, image: 'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?auto=format&fit=crop&w=1000&q=80' },
      ],
    },
    {
      name: 'Gili Lankanfushi',
      address: 'North Malé Atoll, Maldives',
      location: 'Maldives', star_rating: 5, average_rating: 4.9, popularity_score: 9.9,
      description: 'No news, no shoes — an overwater paradise where barefoot luxury meets pristine nature.',
      images: ['https://images.unsplash.com/photo-1573843981267-be1999ff37cd?auto=format&fit=crop&w=1000&q=80', 'https://images.unsplash.com/photo-1526481280693-3bfa7568e0f3?auto=format&fit=crop&w=1000&q=80'],
      amenities: ['Free Wi-Fi', 'Overwater Bungalow', 'Snorkelling', 'Spa', 'Restaurant', 'Diving Center', 'Butler Service'],
      rooms: [
        { room_type: 'Overwater Villa', price: 1200, capacity: 2, image: 'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?auto=format&fit=crop&w=1000&q=80' },
        { room_type: 'Private Residence', price: 3500, capacity: 6, image: 'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?auto=format&fit=crop&w=1000&q=80' },
      ],
    },
  ];

  for (const h of hotelDefs) {
    const loc = locations[h.location];
    if (!loc) continue;
    const existing = await prisma.hotel.findFirst({ where: { name: h.name } });
    if (!existing) {
      await prisma.hotel.create({
        data: {
          name: h.name,
          address: h.address,
          star_rating: h.star_rating,
          average_rating: h.average_rating,
          popularity_score: h.popularity_score,
          description: h.description,
          owner_id: hostUser.user_id,
          location_id: loc.location_id,
          images: { create: h.images.map(url => ({ image_url: url })) },
          amenities: { create: h.amenities.map(name => ({ amenity_name: name })) },
          tags: {
            create: [
              ...(wifiTag ? [{ tag_id: wifiTag.tag_id }] : []),
              ...(poolTag ? [{ tag_id: poolTag.tag_id }] : []),
            ],
          },
          rooms: {
            create: h.rooms.map(r => ({
              room_type: r.room_type,
              price: r.price,
              capacity: r.capacity,
              images: { create: r.image ? [{ image_url: r.image }] : [] },
            })),
          },
        },
      });
    }
  }
  console.log('Hotels OK');
  console.log('🌱 Phase 2 seed complete!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
