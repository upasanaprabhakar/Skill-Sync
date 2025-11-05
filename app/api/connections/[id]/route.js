// app/api/connections/[id]/route.js 
import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

// PATCH - Update connection status (accept/reject)
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const connectionId = parseInt(id);
    const body = await request.json();
    const { status } = body;

    console.log('📝 Updating connection:', connectionId, 'to status:', status);

    if (!status || !['ACCEPTED', 'REJECTED'].includes(status)) {
      return NextResponse.json(
        { error: 'Valid status (ACCEPTED or REJECTED) is required' },
        { status: 400 }
      );
    }

    // Get the connection first to check details
    const existingConnection = await prisma.connection.findUnique({
      where: { id: connectionId },
      include: {
        student: {
          select: {
            id: true,
            skillsLearning: {
              select: { id: true, name: true }
            }
          }
        },
        mentor: {
          select: {
            id: true,
            skillsKnown: {
              select: { id: true, name: true }
            }
          }
        }
      }
    });

    if (!existingConnection) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      );
    }

    // Update the connection status
    const connection = await prisma.connection.update({
      where: { id: connectionId },
      data: { status },
      include: {
        mentor: {
          select: {
            id: true,
            name: true,
            email: true,
            bio: true,
            skillsKnown: {
              select: {
                id: true,
                name: true,
                category: true
              }
            }
          }
        },
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            bio: true,
            skillsLearning: {
              select: {
                id: true,
                name: true,
                category: true
              }
            }
          }
        }
      }
    });

    // If connection is ACCEPTED, auto-assign to skill groups
    if (status === 'ACCEPTED') {
      console.log('✅ Connection accepted, checking for skill groups...');

      // Find matching skills between student's learning skills and mentor's known skills
      const studentSkillIds = existingConnection.student.skillsLearning.map(s => s.id);
      const mentorSkillIds = existingConnection.mentor.skillsKnown.map(s => s.id);
      
      const matchingSkillIds = studentSkillIds.filter(id => mentorSkillIds.includes(id));

      console.log('🔍 Matching skills:', matchingSkillIds);

      if (matchingSkillIds.length > 0) {
        // Find skill groups for these matching skills
        const skillGroups = await prisma.skillGroup.findMany({
          where: {
            mentorId: existingConnection.mentor.id,
            skillId: { in: matchingSkillIds }
          }
        });

        console.log('📚 Found skill groups:', skillGroups.length);

        // If there's exactly one matching skill group, assign it
        if (skillGroups.length === 1) {
          await prisma.connection.update({
            where: { id: connectionId },
            data: { skillGroupId: skillGroups[0].id }
          });
          console.log('✅ Auto-assigned to skill group:', skillGroups[0].id);
        } else if (skillGroups.length > 1) {
          // If multiple groups match, assign to the first one (or implement custom logic)
          await prisma.connection.update({
            where: { id: connectionId },
            data: { skillGroupId: skillGroups[0].id }
          });
          console.log('✅ Auto-assigned to first matching skill group:', skillGroups[0].id);
        } else {
          console.log('ℹ️ No skill groups found for matching skills');
        }
      }
    }

    console.log('✅ Connection updated successfully');

    return NextResponse.json({ connection }, { status: 200 });
  } catch (error) {
    console.error('❌ Error updating connection:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update connection',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete a connection
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const connectionId = parseInt(id);

    console.log('🗑️ Deleting connection:', connectionId);

    await prisma.connection.delete({
      where: { id: connectionId }
    });

    console.log('✅ Connection deleted successfully');

    return NextResponse.json(
      { message: 'Connection deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error deleting connection:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to delete connection',
        details: error.message 
      },
      { status: 500 }
    );
  }
}