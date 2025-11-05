// app/api/sessions/[id]/complete/route.js
import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

export async function POST(request, { params }) {
  try {
    const resolvedParams = await params;
    const sessionId = parseInt(resolvedParams.id);

    // Get session with connection details
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { connection: true }
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    const now = new Date();
    const endTime = new Date(session.endTime);

    // Check if session has ended
    if (endTime > now) {
      return NextResponse.json(
        { error: 'Cannot mark as completed - session has not ended yet' },
        { status: 400 }
      );
    }

    // Determine if it should be COMPLETED or MISSED
    // COMPLETED: At least one person joined (mentor OR student)
    // MISSED: Nobody joined
    const shouldBeCompleted = session.joinedByMentor || session.joinedByStudent;
    const newStatus = shouldBeCompleted ? 'COMPLETED' : 'MISSED';

    const updatedSession = await prisma.session.update({
      where: { id: sessionId },
      data: { status: newStatus }
    });

    console.log(`✅ Session ${sessionId} marked as ${newStatus}`);

    return NextResponse.json({ 
      success: true,
      session: updatedSession,
      status: newStatus
    });
  } catch (error) {
    console.error('❌ Error marking session as complete:', error);
    return NextResponse.json(
      { error: 'Failed to mark session as complete', details: error.message },
      { status: 500 }
    );
  }
}

// Auto-check and update expired sessions
export async function GET(request) {
  try {
    const now = new Date();

    // Find all sessions that have ended but still have PENDING or CONFIRMED status
    const expiredSessions = await prisma.session.findMany({
      where: {
        endTime: { lt: now },
        status: { in: ['PENDING', 'CONFIRMED'] }
      },
      include: { connection: true }
    });

    const updates = [];

    for (const session of expiredSessions) {
      // Determine status based on join tracking
      let newStatus;
      
      if (session.joinedByMentor || session.joinedByStudent) {
        // At least one person joined - mark as COMPLETED
        newStatus = 'COMPLETED';
      } else {
        // Nobody joined - mark as MISSED
        newStatus = 'MISSED';
      }

      updates.push(
        prisma.session.update({
          where: { id: session.id },
          data: { status: newStatus }
        })
      );
    }

    await Promise.all(updates);

    console.log(`✅ Auto-updated ${updates.length} expired sessions`);

    return NextResponse.json({
      success: true,
      updated: updates.length,
      message: `Updated ${updates.length} expired sessions`
    });
  } catch (error) {
    console.error('❌ Error auto-updating sessions:', error);
    return NextResponse.json(
      { error: 'Failed to auto-update sessions', details: error.message },
      { status: 500 }
    );
  }
}