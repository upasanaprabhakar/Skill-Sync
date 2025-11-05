// app/api/notes/[id]/complete/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/app/lib/prisma';

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      console.error('❌ No session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user ID and convert to integer
    const userId = parseInt(session.user?.id);
    
    if (!userId || isNaN(userId)) {
      console.error('❌ Invalid userId in session:', session.user);
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Await params for Next.js 15
    const resolvedParams = await params;
    const { id } = resolvedParams;
    
    const body = await request.json();
    const { isCompleted } = body;

    console.log('🔄 Starting homework update:', { 
      noteId: id, 
      isCompleted, 
      userId,
      sessionUserId: session.user.id
    });

    // First, just get the note to see if it exists
    const note = await prisma.note.findUnique({
      where: { id: parseInt(id) }
    });

    if (!note) {
      console.error('❌ Note not found:', id);
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    console.log('✅ Note exists:', { 
      id: note.id, 
      title: note.title,
      tags: note.tags,
      skillGroupId: note.skillGroupId 
    });

    // Check access - get the skill group with connections
    const skillGroup = await prisma.skillGroup.findUnique({
      where: { id: note.skillGroupId },
      include: {
        connections: {
          where: {
            status: 'ACCEPTED'
          }
        }
      }
    });

    if (!skillGroup) {
      console.error('❌ Skill group not found');
      return NextResponse.json({ error: 'Skill group not found' }, { status: 404 });
    }

    console.log('📚 Skill group found:', {
      id: skillGroup.id,
      name: skillGroup.name,
      connections: skillGroup.connections.length
    });

    // Check if user has access (either as student or mentor)
    const hasAccess = skillGroup.connections.some(
      conn => conn.studentId === userId || conn.mentorId === userId
    );

    if (!hasAccess && skillGroup.mentorId !== userId) {
      console.error('❌ User has no access:', {
        userId: userId,
        mentorId: skillGroup.mentorId,
        connections: skillGroup.connections.map(c => ({ 
          student: c.studentId, 
          mentor: c.mentorId 
        }))
      });
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    console.log('✅ Access granted');

    // Check if it's a homework note
    const tagsArray = Array.isArray(note.tags) ? note.tags : [];
    const hasHomeworkTag = tagsArray.some(tag => {
      const tagStr = tag.toString();
      return tagStr === 'HOMEWORK' || tagStr === 'homework';
    });

    console.log('🏷️ Tags check:', {
      tags: note.tags,
      tagsArray,
      hasHomeworkTag
    });

    if (!hasHomeworkTag) {
      console.error('❌ Not a homework note');
      return NextResponse.json({ 
        error: 'This is not a homework assignment',
        tags: note.tags
      }, { status: 400 });
    }

    console.log('✅ Valid homework, updating...');

    // Update the note
    const updatedNote = await prisma.note.update({
      where: { id: parseInt(id) },
      data: {
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
        completedBy: isCompleted ? userId : null
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    console.log('✅✅✅ Homework updated successfully!');

    return NextResponse.json({
      success: true,
      note: updatedNote,
      message: isCompleted 
        ? 'Homework marked as complete!' 
        : 'Homework marked as pending'
    });

  } catch (error) {
    console.error('❌❌❌ FATAL ERROR:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    });
    return NextResponse.json(
      { 
        error: 'Failed to update homework status',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// GET endpoint
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Await params for Next.js 15
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const note = await prisma.note.findUnique({
      where: { id: parseInt(id) },
      include: {
        creator: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: note.id,
      title: note.title,
      content: note.content,
      isCompleted: note.isCompleted,
      completedAt: note.completedAt,
      completedBy: note.completedBy,
      createdAt: note.createdAt,
      creator: note.creator
    });

  } catch (error) {
    console.error('Error fetching homework status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch homework status' },
      { status: 500 }
    );
  }
}