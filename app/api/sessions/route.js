// app/api/sessions/route.js
import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

// GET: Fetch sessions for a user
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = parseInt(searchParams.get('userId'));
    const status = searchParams.get('status'); // PENDING, CONFIRMED, etc.
    const timeFilter = searchParams.get('timeFilter'); // upcoming, past, today

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    console.log('📅 Fetching sessions for user:', userId);

    // Build where clause
    const where = {
      connection: {
        OR: [
          { mentorId: userId },
          { studentId: userId }
        ]
      },
      ...(status && { status })
    };

    // Add time filters
    const now = new Date();
    if (timeFilter === 'upcoming') {
      where.startTime = { gte: now };
    } else if (timeFilter === 'past') {
      where.startTime = { lt: now };
    } else if (timeFilter === 'today') {
      const startOfDay = new Date(now.setHours(0, 0, 0, 0));
      const endOfDay = new Date(now.setHours(23, 59, 59, 999));
      where.startTime = { gte: startOfDay, lte: endOfDay };
    }

    const sessions = await prisma.session.findMany({
      where,
      include: {
        connection: {
          include: {
            mentor: {
              select: { id: true, name: true, email: true }
            },
            student: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        reminders: true
      },
      orderBy: { startTime: 'asc' }
    });

    console.log('✅ Found', sessions.length, 'sessions');

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('❌ Error fetching sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions', details: error.message },
      { status: 500 }
    );
  }
}

// POST: Create a new session
export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      connectionId, 
      title, 
      description, 
      startTime, 
      endTime,
      duration,
      meetingLink,
      userId 
    } = body;

    console.log('📅 Creating session:', { connectionId, title, startTime });

    // Validation
    if (!connectionId || !title || !startTime || !endTime || !userId) {
      return NextResponse.json(
        { error: 'connectionId, title, startTime, endTime, and userId are required' },
        { status: 400 }
      );
    }

    // Verify connection exists and user is part of it
    const connection = await prisma.connection.findUnique({
      where: { id: parseInt(connectionId) },
      include: {
        mentor: { select: { id: true, name: true } },
        student: { select: { id: true, name: true } }
      }
    });

    if (!connection) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      );
    }

    // Check if user is part of this connection
    const userIdInt = parseInt(userId);
    if (connection.mentorId !== userIdInt && connection.studentId !== userIdInt) {
      return NextResponse.json(
        { error: 'You are not part of this connection' },
        { status: 403 }
      );
    }

    // Check if connection is accepted
    if (connection.status !== 'ACCEPTED') {
      return NextResponse.json(
        { error: 'Connection must be accepted before booking sessions' },
        { status: 400 }
      );
    }

    // Validate times
    const start = new Date(startTime);
    const end = new Date(endTime);
    const now = new Date();

    if (start < now) {
      return NextResponse.json(
        { error: 'Cannot book sessions in the past' },
        { status: 400 }
      );
    }

    if (end <= start) {
      return NextResponse.json(
        { error: 'End time must be after start time' },
        { status: 400 }
      );
    }

    // Calculate duration if not provided
    const calculatedDuration = duration || Math.round((end - start) / (1000 * 60));

    // Check for overlapping sessions
    const overlapping = await prisma.session.findFirst({
      where: {
        connectionId: parseInt(connectionId),
        status: { in: ['PENDING', 'CONFIRMED'] },
        OR: [
          {
            AND: [
              { startTime: { lte: start } },
              { endTime: { gt: start } }
            ]
          },
          {
            AND: [
              { startTime: { lt: end } },
              { endTime: { gte: end } }
            ]
          },
          {
            AND: [
              { startTime: { gte: start } },
              { endTime: { lte: end } }
            ]
          }
        ]
      }
    });

    if (overlapping) {
      return NextResponse.json(
        { error: 'This time slot overlaps with an existing session' },
        { status: 409 }
      );
    }

    // Create session
    const session = await prisma.session.create({
      data: {
        connectionId: parseInt(connectionId),
        title: title.trim(),
        description: description?.trim(),
        startTime: start,
        endTime: end,
        duration: calculatedDuration,
        meetingLink: meetingLink?.trim(),
        status: 'PENDING'
      },
      include: {
        connection: {
          include: {
            mentor: { select: { id: true, name: true, email: true } },
            student: { select: { id: true, name: true, email: true } }
          }
        }
      }
    });

    // Create automatic reminders
    const reminderTimes = [
      { type: '1_DAY_BEFORE', offset: 24 * 60 },
      { type: '1_HOUR_BEFORE', offset: 60 },
      { type: '15_MIN_BEFORE', offset: 15 }
    ];

    for (const reminder of reminderTimes) {
      const scheduledFor = new Date(start.getTime() - reminder.offset * 60 * 1000);
      
      // Only create reminder if it's in the future
      if (scheduledFor > now) {
        await prisma.reminder.create({
          data: {
            sessionId: session.id,
            reminderType: reminder.type,
            scheduledFor,
            sent: false
          }
        });
      }
    }

    console.log('✅ Session created:', session.id);

    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    console.error('❌ Error creating session:', error);
    return NextResponse.json(
      { error: 'Failed to create session', details: error.message },
      { status: 500 }
    );
  }
}