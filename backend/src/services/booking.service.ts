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
  roomsReq: { room_id: number; quantity: number }[],
  couponCode?: string
) => {
  const checkIn = new Date(checkInStr);
  const checkOut = new Date(checkOutStr);

  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 3600 * 24));
  if (nights <= 0) throw new Error('Check-out must be after Check-in');

  let base_price = 0;
  const bookingDetailsToCreate: any[] = [];
  let totalCapacity = 0;

  for (const req of roomsReq) {
    // 1. Validate room belongs to the correct hotel
    const room = await prisma.room.findUnique({ where: { room_id: req.room_id } });
    if (!room) throw new Error(`Room ${req.room_id} not found`);
    if (room.hotel_id !== hotelId) {
      throw new Error(`Room ${req.room_id} does not belong to hotel ${hotelId}`);
    }

    // 2. Check availability
    const isAvail = await checkAvailability(req.room_id, checkIn, checkOut, req.quantity);
    if (!isAvail) {
      throw new Error(`Room ${req.room_id} is sold out or does not have enough quantity for the selected dates`);
    }

    // 3. Accumulate capacity
    totalCapacity += room.capacity * req.quantity;

    // 4. Calculate price
    const roomPriceForStay = Number(room.price) * req.quantity * nights;
    base_price += roomPriceForStay;

    bookingDetailsToCreate.push({
      room_id: room.room_id,
      quantity: req.quantity,
      price_at_booking: room.price
    });
  }

  // 5. Validate guests vs total capacity
  if (guests > totalCapacity) {
    throw new Error(
      `Number of guests (${guests}) exceeds total room capacity (${totalCapacity}). Please select more rooms or fewer guests.`
    );
  }

  // 6. Validate and apply coupon if provided
  let discount_amount = 0;
  let appliedCoupon: any = null;

  if (couponCode) {
    const coupon = await prisma.coupon.findUnique({
      where: { code: couponCode.trim().toUpperCase() }
    });

    if (!coupon) throw new Error(`Coupon code "${couponCode}" is invalid or does not exist`);
    if (!coupon.is_active) throw new Error(`Coupon "${couponCode}" is no longer active`);
    if (new Date() > coupon.expiry_date) throw new Error(`Coupon "${couponCode}" has expired`);

    // Check usage limit: count how many bookings have used this coupon
    const usageCount = await prisma.bookingCoupon.count({
      where: { coupon_id: coupon.coupon_id }
    });
    if (usageCount >= coupon.usage_limit) {
      throw new Error(`Coupon "${couponCode}" has reached its usage limit`);
    }

    // Calculate discount
    if (coupon.discount_type === 'PERCENTAGE') {
      discount_amount = (base_price * Number(coupon.discount_value)) / 100;
      // Apply max_discount cap
      if (Number(coupon.max_discount) > 0) {
        discount_amount = Math.min(discount_amount, Number(coupon.max_discount));
      }
    } else if (coupon.discount_type === 'FIXED') {
      discount_amount = Math.min(Number(coupon.discount_value), base_price);
    }

    appliedCoupon = coupon;
  }

  const total_price = Math.max(0, base_price - discount_amount);

  // 7. Create Booking, Details, Payment (and BookingCoupon if applicable) via Transaction
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

    // Record coupon usage
    if (appliedCoupon) {
      await tx.bookingCoupon.create({
        data: {
          booking_id: booking.booking_id,
          coupon_id: appliedCoupon.coupon_id,
          discount_amount
        }
      });
    }

    return booking;
  });

  return {
    ...newBooking,
    base_price,
    discount_amount,
    coupon_applied: appliedCoupon ? appliedCoupon.code : null
  };
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
      payment: true,
      coupons: {
        select: { discount_amount: true, coupon: { select: { code: true } } }
      }
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
      payment: true,
      coupons: {
        select: { discount_amount: true, coupon: { select: { code: true } } }
      }
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

/**
 * Preview coupon discount without modifying any booking.
 * Used by the frontend "Apply" button before final payment.
 */
export const previewCoupon = async (couponCode: string, baseAmount: number) => {
  const coupon = await prisma.coupon.findUnique({
    where: { code: couponCode.trim().toUpperCase() }
  });

  if (!coupon) throw new Error(`Coupon code "${couponCode}" is invalid or does not exist`);
  if (!coupon.is_active) throw new Error(`Coupon "${couponCode}" is no longer active`);
  if (new Date() > coupon.expiry_date) throw new Error(`Coupon "${couponCode}" has expired`);

  const usageCount = await prisma.bookingCoupon.count({ where: { coupon_id: coupon.coupon_id } });
  if (usageCount >= coupon.usage_limit) {
    throw new Error(`Coupon "${couponCode}" has reached its usage limit`);
  }

  let discount_amount = 0;
  if (coupon.discount_type === 'PERCENTAGE') {
    discount_amount = (baseAmount * Number(coupon.discount_value)) / 100;
    if (Number(coupon.max_discount) > 0) {
      discount_amount = Math.min(discount_amount, Number(coupon.max_discount));
    }
  } else if (coupon.discount_type === 'FIXED') {
    discount_amount = Math.min(Number(coupon.discount_value), baseAmount);
  }

  return {
    code: coupon.code,
    discount_type: coupon.discount_type,
    discount_value: Number(coupon.discount_value),
    discount_amount: Math.round(discount_amount * 100) / 100,
    final_amount: Math.max(0, baseAmount - discount_amount)
  };
};
