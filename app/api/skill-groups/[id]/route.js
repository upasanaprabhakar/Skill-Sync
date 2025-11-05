// app/api/skill-groups/[id]/route.js (FIXED - COMPLETE FILE)
import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

// GET: Fetch a specific skill group
export async function GET(request, { params }) {
  try {
    // CRITICAL FIX: Await params before accessing properties
    const resolvedParams = await params;
    const groupId = parseInt(resolvedParams.id);

    console.log('📚 Fetching skill group:', groupId);

    const group = await prisma.skillGroup.findUnique({
      where: { id: groupId },
      include: {
        skill: true,
        mentor: {
          select: { id: true, name: true, email: true, bio: true }
        },
        connections: {
          where: { status: 'ACCEPTED' },
          include: {
            student: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        notes: {
          include: {
            creator: {
              select: { id: true, name: true, email: true }
            }
          },
          orderBy: [
            { isPinned: 'desc' },
            { createdAt: 'desc' }
          ]
        },
        _count: {
          select: {
            connections: { where: { status: 'ACCEPTED' } },
            notes: true
          }
        }
      }
    });

    if (!group) {
      console.error('❌ Skill group not found:', groupId);
      return NextResponse.json(
        { error: 'Skill group not found' },
        { status: 404 }
      );
    }

    console.log('✅ Skill group loaded:', group.name);

    return NextResponse.json({ group });
  } catch (error) {
    console.error('❌ Error fetching skill group:', error);
    return NextResponse.json(
      { error: 'Failed to fetch skill group', details: error.message },
      { status: 500 }
    );
  }
}

// PATCH: Update skill group
export async function PATCH(request, { params }) {
  try {
    // CRITICAL FIX: Await params before accessing properties
    const resolvedParams = await params;
    const groupId = parseInt(resolvedParams.id);
    const { userId, name, description } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Verify user is the mentor of this group
    const group = await prisma.skillGroup.findUnique({
      where: { id: groupId }
    });

    if (!group) {
      return NextResponse.json(
        { error: 'Skill group not found' },
        { status: 404 }
      );
    }

    if (group.mentorId !== parseInt(userId)) {
      return NextResponse.json(
        { error: 'Only the mentor can update this group' },
        { status: 403 }
      );
    }

    // Update group
    const updatedGroup = await prisma.skillGroup.update({
      where: { id: groupId },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() })
      },
      include: {
        skill: true,
        mentor: {
          select: { id: true, name: true, email: true }
        },
        _count: {
          select: {
            connections: { where: { status: 'ACCEPTED' } },
            notes: true
          }
        }
      }
    });

    return NextResponse.json({ group: updatedGroup });
  } catch (error) {
    console.error('❌ Error updating skill group:', error);
    return NextResponse.json(
      { error: 'Failed to update skill group', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE: Delete skill group
export async function DELETE(request, { params }) {
  try {
    // CRITICAL FIX: Await params before accessing properties
    const resolvedParams = await params;
    const groupId = parseInt(resolvedParams.id);
    const { searchParams } = new URL(request.url);
    const userId = parseInt(searchParams.get('userId'));

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Verify user is the mentor of this group
    const group = await prisma.skillGroup.findUnique({
      where: { id: groupId }
    });

    if (!group) {
      return NextResponse.json(
        { error: 'Skill group not found' },
        { status: 404 }
      );
    }

    if (group.mentorId !== userId) {
      return NextResponse.json(
        { error: 'Only the mentor can delete this group' },
        { status: 403 }
      );
    }

    // Remove skillGroupId from all connections before deleting
    await prisma.connection.updateMany({
      where: { skillGroupId: groupId },
      data: { skillGroupId: null }
    });

    // Delete the group (notes will be cascade deleted)
    await prisma.skillGroup.delete({
      where: { id: groupId }
    });

    return NextResponse.json({ message: 'Skill group deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting skill group:', error);
    return NextResponse.json(
      { error: 'Failed to delete skill group', details: error.message },
      { status: 500 }
    );
  }
}