// app/api/sessions/[id]/join/route.js
import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

export async function POST(request, { params }) {
  try {
    const resolvedParams = await params;
    const sessionId = parseInt(resolvedParams.id);
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

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

    const userIdInt = parseInt(userId);
    const isMentor = session.connection.mentorId === userIdInt;
    const isStudent = session.connection.studentId === userIdInt;

    if (!isMentor && !isStudent) {
      return NextResponse.json(
        { error: 'You are not part of this session' },
        { status: 403 }
      );
    }

    // Update join tracking
    const updateData = {};
    if (isMentor) {
      updateData.joinedByMentor = true;
    } else if (isStudent) {
      updateData.joinedByStudent = true;
    }

    const updatedSession = await prisma.session.update({
      where: { id: sessionId },
      data: updateData
    });

    console.log(`✅ Session ${sessionId} joined by ${isMentor ? 'mentor' : 'student'}`);

    return NextResponse.json({ 
      success: true,
      session: updatedSession 
    });
  } catch (error) {
    console.error('❌ Error tracking session join:', error);
    return NextResponse.json(
      { error: 'Failed to track join', details: error.message },
      { status: 500 }
    );
  }
}