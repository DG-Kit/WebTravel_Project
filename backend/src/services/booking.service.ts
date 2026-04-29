import prisma from '../config/prisma';

/**
 * Sweepline algorithm to calculate max concurrent rooms booked for a given date range
 */
const getMaxConcurrentBookedRooms = (
  overlappingDetails: any[],
  checkIn: Date,
  checkOut: Date
) => {
  const events: { date: number; type: 'in' | 'out'; quantity: number }[] = [];

  for (const detail of overlappingDetails) {
    const bIn = new Date(detail.booking.check_in).getTime();
    const bOut = new Date(detail.booking.check_out).getTime();
    
    // We only care about overlaps within our checking window
    const overlapStart = Math.max(bIn, checkIn.getTime());
    const overlapEnd = Math.min(bOut, checkOut.getTime());

    if (overlapStart < overlapEnd) {
      events.push({ date: overlapStart, type: 'in', quantity: detail.quantity });
      events.push({ date: overlapEnd, type: 'out', quantity: detail.quantity });
    }
  }

  // Sort events: by date ascending. If same date, process 'out' before 'in' to free up rooms
  events.sort((a, b) => {
    if (a.date !== b.date) return a.date - b.date;
    if (a.type === 'out' && b.type === 'in') return -1;
    if (a.type === 'in' && b.type === 'out') return 1;
    return 0;
  });

  let currentBooked = 0;
  let maxBooked = 0;

  for (const event of events) {
    if (event.type === 'in') currentBooked += event.quantity;
    if (event.type === 'out') currentBooked -= event.quantity;
    if (currentBooked > maxBooked) maxBooked = currentBooked;
  }

  return maxBooked;
};

export const checkAvailability = async (
  roomId: number,
  checkIn: Date,
  checkOut: Date,
  requestedQuantity: number
) => {
  const room = await prisma.room.findUnique({
    where: { room_id: roomId }
  });

  if (!room || !room.is_available) {
    throw new Error(`Room ${roomId} is not available`);
  }

  const overlappingDetails = await prisma.bookingDetail.findMany({
    where: {
      room_id: roomId,
      booking: {
        booking_status: {
          in: ['PENDING_PAYMENT', 'CONFIRMED']
        },
        check_in: { lt: checkOut },
        check_out: { gt: checkIn }
      }
    },
    include: { booking: true }
  });

  const maxBooked = getMaxConcurrentBookedRooms(overlappingDetails, checkIn, checkOut);

  if (maxBooked + requestedQuantity > room.quantity) {
    return false;
  }
  return true;
};

export const createBooking = async (
  userId: number,
  hotelId: number,
  checkInStr: string,
  checkOutStr: string,
  guests: number,
  roomsReq: { room_id: number; quantity: number }[]
) => {
  const checkIn = new Date(checkInStr);
  const checkOut = new Date(checkOutStr);

  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 3600 * 24));
  if (nights <= 0) throw new Error('Check-out must be after Check-in');

  let total_price = 0;
  const bookingDetailsToCreate: any[] = [];

  for (const req of roomsReq) {
    // 1. Check availability
    const isAvail = await checkAvailability(req.room_id, checkIn, checkOut, req.quantity);
    if (!isAvail) {
      throw new Error(`Room ${req.room_id} is sold out or does not have enough quantity for the selected dates`);
    }

    // 2. Get price
    const room = await prisma.room.findUnique({ where: { room_id: req.room_id } });
    if (!room) throw new Error(`Room ${req.room_id} not found`);

    const roomPriceForStay = Number(room.price) * req.quantity * nights;
    total_price += roomPriceForStay;

    bookingDetailsToCreate.push({
      room_id: room.room_id,
      quantity: req.quantity,
      price_at_booking: room.price
    });
  }

  // 3. Create Booking, Details, and Payment via Transaction
  const newBooking = await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.create({
      data: {
        user_id: userId,
        hotel_id: hotelId,
        check_in: checkIn,
        check_out: checkOut,
        guests,
        total_price,
        booking_status: 'PENDING_PAYMENT',
        details: {
          create: bookingDetailsToCreate
        }
      },
      include: {
        details: true
      }
    });

    await tx.payment.create({
      data: {
        booking_id: booking.booking_id,
        payment_method: 'CASH_OR_SIMULATED',
        payment_status: 'PENDING',
        amount: total_price
      }
    });

    return booking;
  });

  return newBooking;
};

export const getMyBookings = async (userId: number) => {
  return await prisma.booking.findMany({
    where: { user_id: userId },
    include: {
      hotel: {
        select: { name: true, address: true, images: true }
      },
      details: {
        include: {
          room: { select: { room_type: true } }
        }
      },
      payment: true
    },
    orderBy: { created_at: 'desc' }
  });
};

export const getBookingById = async (bookingIdStr: string, userId: number) => {
  const bookingId = BigInt(bookingIdStr);
  const booking = await prisma.booking.findUnique({
    where: { booking_id: bookingId },
    include: {
      hotel: {
        include: { images: true }
      },
      details: {
        include: { room: true }
      },
      payment: true
    }
  });

  if (!booking) throw new Error('Booking not found');
  if (booking.user_id !== userId) throw new Error('Unauthorized to view this booking');

  return booking;
};

export const cancelBooking = async (bookingIdStr: string, userId: number) => {
  const bookingId = BigInt(bookingIdStr);
  const booking = await getBookingById(bookingIdStr, userId);

  if (booking.booking_status === 'CANCELLED') {
    throw new Error('Booking is already cancelled');
  }

  if (booking.check_in <= new Date()) {
    throw new Error('Cannot cancel booking on or after check-in date');
  }

  const updated = await prisma.$transaction(async (tx) => {
    const b = await tx.booking.update({
      where: { booking_id: bookingId },
      data: { booking_status: 'CANCELLED' }
    });

    await tx.payment.update({
      where: { booking_id: bookingId },
      data: { payment_status: 'CANCELLED' }
    });
    
    return b;
  });

  return updated;
};

export const simulatePayment = async (bookingIdStr: string, userId: number) => {
  const bookingId = BigInt(bookingIdStr);
  const booking = await getBookingById(bookingIdStr, userId);

  if (booking.booking_status !== 'PENDING_PAYMENT') {
    throw new Error('Booking does not await payment');
  }

  const updated = await prisma.$transaction(async (tx) => {
    const b = await tx.booking.update({
      where: { booking_id: bookingId },
      data: { booking_status: 'CONFIRMED' }
    });

    await tx.payment.update({
      where: { booking_id: bookingId },
      data: { 
        payment_status: 'COMPLETED',
        paid_at: new Date()
      }
    });
    
    return b;
  });

  return updated;
};
