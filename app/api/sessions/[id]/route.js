// app/api/sessions/[id]/route.js - COMPLETE FIXED VERSION
import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

// GET: Fetch a single session
export async function GET(request, { params }) {
  try {
    const resolvedParams = await params;
    const sessionId = parseInt(resolvedParams.id);

    console.log('📅 Fetching session:', sessionId);

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        connection: {
          include: {
            mentor: { select: { id: true, name: true, email: true } },
            student: { select: { id: true, name: true, email: true } }
          }
        },
        reminders: true
      }
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error('❌ Error fetching session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session', details: error.message },
      { status: 500 }
    );
  }
}

// PATCH: Update session (confirm, cancel, reschedule)
export async function PATCH(request, { params }) {
  try {
    const resolvedParams = await params;
    const sessionId = parseInt(resolvedParams.id);
    const body = await request.json();
    const { status, startTime, endTime, meetingLink, notes, title, description } = body;

    console.log('📅 Updating session:', sessionId, { status });

    // Get session first to verify it exists and get user info
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        connection: {
          include: {
            mentor: { select: { id: true, name: true, email: true } },
            student: { select: { id: true, name: true, email: true } }
          }
        }
      }
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Build update data
    const updateData = {};

    // Status updates
    if (status) {
      // Validate status transitions
      if (status === 'CONFIRMED' && session.status === 'PENDING') {
        updateData.status = 'CONFIRMED';
      } else if (status === 'CANCELLED') {
        updateData.status = 'CANCELLED';
      } else if (status === 'COMPLETED') {
        updateData.status = 'COMPLETED';
      } else if (status === 'MISSED') {
        updateData.status = 'MISSED';
      } else {
        return NextResponse.json(
          { error: 'Invalid status transition' },
          { status: 400 }
        );
      }
    }

    // Reschedule
    if (startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);
      const now = new Date();

      if (start < now) {
        return NextResponse.json(
          { error: 'Cannot reschedule to a past time' },
          { status: 400 }
        );
      }

      if (end <= start) {
        return NextResponse.json(
          { error: 'End time must be after start time' },
          { status: 400 }
        );
      }

      // Check for overlaps
      const overlapping = await prisma.session.findFirst({
        where: {
          id: { not: sessionId },
          connectionId: session.connectionId,
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
            }
          ]
        }
      });

      if (overlapping) {
        return NextResponse.json(
          { error: 'New time slot overlaps with an existing session' },
          { status: 409 }
        );
      }

      updateData.startTime = start;
      updateData.endTime = end;
      updateData.duration = Math.round((end - start) / (1000 * 60));

      // Delete old reminders and create new ones
      await prisma.reminder.deleteMany({
        where: { sessionId }
      });

      const reminderTimes = [
        { type: '1_DAY_BEFORE', offset: 24 * 60 },
        { type: '1_HOUR_BEFORE', offset: 60 },
        { type: '15_MIN_BEFORE', offset: 15 }
      ];

      for (const reminder of reminderTimes) {
        const scheduledFor = new Date(start.getTime() - reminder.offset * 60 * 1000);
        if (scheduledFor > now) {
          await prisma.reminder.create({
            data: {
              sessionId,
              reminderType: reminder.type,
              scheduledFor,
              sent: false
            }
          });
        }
      }
    }

    // Other fields
    if (meetingLink !== undefined) {
      updateData.meetingLink = meetingLink?.trim() || null;
    }

    if (notes !== undefined) {
      updateData.notes = notes?.trim() || null;
    }

    if (title) {
      updateData.title = title.trim();
    }
    
    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    // Update session
    const updatedSession = await prisma.session.update({
      where: { id: sessionId },
      data: updateData,
      include: {
        connection: {
          include: {
            mentor: { select: { id: true, name: true, email: true } },
            student: { select: { id: true, name: true, email: true } }
          }
        },
        reminders: true
      }
    });

    console.log('✅ Session updated:', sessionId);

    // Send Socket.IO notifications
    if (status === 'CONFIRMED' && global.io) {
      global.io.to(`user:${session.connection.studentId}`).emit('session-confirmed', {
        sessionId: updatedSession.id,
        session: updatedSession,
        message: `Your session "${updatedSession.title}" has been confirmed by ${session.connection.mentor.name}`,
        timestamp: new Date()
      });
      console.log(`✅ Confirmation notification sent to student ${session.connection.studentId}`);
    } else if (status === 'CANCELLED' && global.io) {
      // Notify both parties
      global.io.to(`user:${session.connection.mentorId}`).emit('session-cancelled', {
        sessionId: updatedSession.id,
        message: `Session "${updatedSession.title}" has been cancelled`,
        timestamp: new Date()
      });
      
      global.io.to(`user:${session.connection.studentId}`).emit('session-cancelled', {
        sessionId: updatedSession.id,
        message: `Session "${updatedSession.title}" has been cancelled`,
        timestamp: new Date()
      });
      console.log(`✅ Cancellation notifications sent`);
    } else if ((startTime || endTime) && global.io) {
      // Notify both about reschedule
      global.io.to(`user:${session.connection.mentorId}`).emit('session-updated', {
        sessionId: updatedSession.id,
        session: updatedSession,
        message: `Session "${updatedSession.title}" has been rescheduled`,
        timestamp: new Date()
      });
      
      global.io.to(`user:${session.connection.studentId}`).emit('session-updated', {
        sessionId: updatedSession.id,
        session: updatedSession,
        message: `Session "${updatedSession.title}" has been rescheduled`,
        timestamp: new Date()
      });
      console.log(`✅ Update notifications sent`);
    }

    return NextResponse.json({ 
      session: updatedSession,
      message: 'Session updated successfully' 
    });
  } catch (error) {
    console.error('❌ Error updating session:', error);
    return NextResponse.json(
      { error: 'Failed to update session', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE: Delete a session
export async function DELETE(request, { params }) {
  try {
    const resolvedParams = await params;
    const sessionId = parseInt(resolvedParams.id);
    const { searchParams } = new URL(request.url);
    const userId = parseInt(searchParams.get('userId'));

    console.log('📅 Deleting session:', sessionId);

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required for deletion' },
        { status: 400 }
      );
    }

    // Get session and verify permissions
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { 
        connection: {
          include: {
            mentor: { select: { id: true, name: true } },
            student: { select: { id: true, name: true } }
          }
        }
      }
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    const userIdInt = parseInt(userId);
    if (session.connection.mentorId !== userIdInt && session.connection.studentId !== userIdInt) {
      return NextResponse.json(
        { error: 'You are not authorized to delete this session' },
        { status: 403 }
      );
    }

    // Delete session (reminders will be cascade deleted)
    await prisma.session.delete({
      where: { id: sessionId }
    });

    console.log('✅ Session deleted:', sessionId);

    // Notify both parties
    if (global.io) {
      global.io.to(`user:${session.connection.mentorId}`).emit('session-cancelled', {
        sessionId,
        message: `Session "${session.title}" has been deleted`,
        timestamp: new Date()
      });
      
      global.io.to(`user:${session.connection.studentId}`).emit('session-cancelled', {
        sessionId,
        message: `Session "${session.title}" has been deleted`,
        timestamp: new Date()
      });
    }

    return NextResponse.json({ 
      message: 'Session deleted successfully' 
    });
  } catch (error) {
    console.error('❌ Error deleting session:', error);
    return NextResponse.json(
      { error: 'Failed to delete session', details: error.message },
      { status: 500 }
    );
  }
}