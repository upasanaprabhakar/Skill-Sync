// app/api/sessions/availability/route.js - EXTENDED HOURS
import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const mentorId = parseInt(searchParams.get('mentorId'));
    const date = searchParams.get('date'); // YYYY-MM-DD format

    if (!mentorId || !date) {
      return NextResponse.json(
        { error: 'mentorId and date are required' },
        { status: 400 }
      );
    }

    // Parse the date - use local timezone consistently
    const [year, month, day] = date.split('-').map(Number);
    
    // Create dates in local timezone
    const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
    const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

    console.log('📅 Checking availability for:', {
      mentorId,
      date,
      startOfDay: startOfDay.toISOString(),
      endOfDay: endOfDay.toISOString(),
      localStartOfDay: startOfDay.toString()
    });

    // Get all sessions for this mentor on this date
    const bookedSessions = await prisma.session.findMany({
      where: {
        connection: {
          mentorId: mentorId
        },
        status: {
          in: ['PENDING', 'CONFIRMED']
        },
        startTime: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      select: {
        startTime: true,
        endTime: true
      },
      orderBy: {
        startTime: 'asc'
      }
    });

    console.log('📊 Found booked sessions:', bookedSessions.length);

    // FLEXIBLE TIMING: Extended hours from 9 AM - 9 PM (instead of 9 AM - 5 PM)
    // This allows connections after 4:30 PM
    const workStart = new Date(year, month - 1, day, 9, 0, 0, 0);  // 9 AM
    const workEnd = new Date(year, month - 1, day, 21, 0, 0, 0);    // 9 PM (21:00)
    
    // Generate available slots (9 AM - 9 PM, 30-min intervals)
    const availableSlots = [];
    let currentSlot = new Date(workStart);
    const now = new Date();

    // Compare dates properly in local timezone
    const nowYear = now.getFullYear();
    const nowMonth = now.getMonth();
    const nowDay = now.getDate();
    
    // Check if the target date is today or future (allow today and future dates)
    const isToday = (year === nowYear && month - 1 === nowMonth && day === nowDay);
    const todayStart = new Date(nowYear, nowMonth, nowDay, 0, 0, 0, 0);
    const isPastDate = startOfDay < todayStart;

    console.log('🕐 Time check:', {
      requestedDate: `${year}-${month}-${day}`,
      todayDate: `${nowYear}-${nowMonth + 1}-${nowDay}`,
      isToday,
      isPastDate,
      currentTime: now.toString(),
      targetStartOfDay: startOfDay.toString(),
      todayStart: todayStart.toString()
    });

    // Don't show any slots for past dates (before today)
    if (isPastDate) {
      console.log('⚠️ Requested date is in the past');
      return NextResponse.json({
        date,
        availableSlots: [],
        bookedSlots: []
      });
    }

    while (currentSlot < workEnd) {
      const slotEnd = new Date(currentSlot.getTime() + 30 * 60 * 1000);

      // Show ALL slots for today and future dates
      // Since mentor needs to review/confirm, show all slots
      const isValidTime = true;

      if (isValidTime) {
        // Check if slot overlaps with any booked session
        const isBooked = bookedSessions.some(session => {
          const sessionStart = new Date(session.startTime);
          const sessionEnd = new Date(session.endTime);
          
          return (
            (currentSlot >= sessionStart && currentSlot < sessionEnd) ||
            (slotEnd > sessionStart && slotEnd <= sessionEnd) ||
            (currentSlot <= sessionStart && slotEnd >= sessionEnd)
          );
        });

        if (!isBooked) {
          availableSlots.push({
            startTime: currentSlot.toISOString(),
            endTime: slotEnd.toISOString(),
            available: true
          });
        }
      }

      currentSlot = slotEnd;
    }

    console.log('✅ Available slots found:', availableSlots.length);
    console.log('⏰ Time range: 9:00 AM - 9:00 PM');

    return NextResponse.json({
      date,
      availableSlots,
      bookedSlots: bookedSessions.map(s => ({
        startTime: s.startTime,
        endTime: s.endTime
      }))
    });
  } catch (error) {
    console.error('❌ Error fetching availability:', error);
    return NextResponse.json(
      { error: 'Failed to fetch availability', details: error.message },
      { status: 500 }
    );
  }
}