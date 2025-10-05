// app/api/users/[id]/route.js
import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

// GET - Fetch a single user by ID
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const userId = parseInt(id);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        role: true,
        skillsKnown: {
          select: {
            id: true,
            name: true,
            category: true
          }
        },
        skillsLearning: {
          select: {
            id: true,
            name: true,
            category: true
          }
        },
        createdAt: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// PATCH - Update user profile
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const userId = parseInt(id);
    const body = await request.json();
    const { name, bio, role, skillIds } = body;

    // Build update data object
    const updateData = {};
    
    if (name) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (role) updateData.role = role;

    // Handle skills based on role
    if (skillIds && Array.isArray(skillIds) && skillIds.length > 0) {
      if (role === 'MENTOR') {
        // Connect skills to skillsKnown only
        updateData.skillsKnown = {
          set: [],
          connect: skillIds.map(id => ({ id: parseInt(id) }))
        };
      } else if (role === 'STUDENT') {
        // Connect skills to skillsLearning only
        updateData.skillsLearning = {
          set: [],
          connect: skillIds.map(id => ({ id: parseInt(id) }))
        };
      } else if (role === 'BOTH') {
        // Connect skills to BOTH skillsKnown AND skillsLearning
        updateData.skillsKnown = {
          set: [],
          connect: skillIds.map(id => ({ id: parseInt(id) }))
        };
        updateData.skillsLearning = {
          set: [],
          connect: skillIds.map(id => ({ id: parseInt(id) }))
        };
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        role: true,
        skillsKnown: {
          select: {
            id: true,
            name: true,
            category: true
          }
        },
        skillsLearning: {
          select: {
            id: true,
            name: true,
            category: true
          }
        }
      }
    });

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete a user
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const userId = parseInt(id);

    await prisma.user.delete({
      where: { id: userId }
    });

    return NextResponse.json(
      { message: 'User deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}