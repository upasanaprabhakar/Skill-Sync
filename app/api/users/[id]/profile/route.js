// app/api/users/[id]/profile/route.js
import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

// POST/PATCH - Complete profile setup (name, bio, role, and skills)
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const userId = parseInt(id);
    const body = await request.json();
    const { name, bio, role, skillsKnown, skillsLearning } = body;

    // Validate required fields
    if (!name || !bio || !role) {
      return NextResponse.json(
        { error: 'Name, bio, and role are required' },
        { status: 400 }
      );
    }

    // Validate role
    if (!['STUDENT', 'MENTOR', 'BOTH'].includes(role)) {
      return NextResponse.json(
        { error: 'Role must be STUDENT, MENTOR, or BOTH' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData = {
      name,
      bio,
      role
    };

    // Add skills connections if provided
    if (skillsKnown && Array.isArray(skillsKnown) && skillsKnown.length > 0) {
      // Verify all skills exist
      const existingSkills = await prisma.skill.findMany({
        where: { id: { in: skillsKnown } },
        select: { id: true }
      });

      if (existingSkills.length !== skillsKnown.length) {
        return NextResponse.json(
          { error: 'Some skills in skillsKnown do not exist' },
          { status: 400 }
        );
      }

      updateData.skillsKnown = {
        connect: skillsKnown.map(skillId => ({ id: skillId }))
      };
    }

    if (skillsLearning && Array.isArray(skillsLearning) && skillsLearning.length > 0) {
      // Verify all skills exist
      const existingSkills = await prisma.skill.findMany({
        where: { id: { in: skillsLearning } },
        select: { id: true }
      });

      if (existingSkills.length !== skillsLearning.length) {
        return NextResponse.json(
          { error: 'Some skills in skillsLearning do not exist' },
          { status: 400 }
        );
      }

      updateData.skillsLearning = {
        connect: skillsLearning.map(skillId => ({ id: skillId }))
      };
    }

    // Update user profile
    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        bio: true,
        role: true,
        createdAt: true,
        skillsKnown: {
          select: {
            id: true,
            name: true,
            category: true,
            description: true
          }
        },
        skillsLearning: {
          select: {
            id: true,
            name: true,
            category: true,
            description: true
          }
        },
        _count: {
          select: {
            mentorConnections: true,
            studentConnections: true
          }
        }
      }
    });

    return NextResponse.json({ 
      message: 'Profile created successfully',
      user 
    }, { status: 200 });

  } catch (error) {
    console.error('Error creating profile:', error);
    return NextResponse.json(
      { error: 'Failed to create profile', details: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Update existing profile
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const userId = parseInt(id);
    const body = await request.json();
    const { name, bio, role, skillsKnown, skillsLearning } = body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        skillsKnown: { select: { id: true } },
        skillsLearning: { select: { id: true } }
      }
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (role !== undefined) {
      if (!['STUDENT', 'MENTOR', 'BOTH'].includes(role)) {
        return NextResponse.json(
          { error: 'Role must be STUDENT, MENTOR, or BOTH' },
          { status: 400 }
        );
      }
      updateData.role = role;
    }

    // Handle skillsKnown update (replace all)
    if (skillsKnown !== undefined) {
      if (!Array.isArray(skillsKnown)) {
        return NextResponse.json(
          { error: 'skillsKnown must be an array' },
          { status: 400 }
        );
      }

      // Verify all skills exist
      if (skillsKnown.length > 0) {
        const existingSkills = await prisma.skill.findMany({
          where: { id: { in: skillsKnown } },
          select: { id: true }
        });

        if (existingSkills.length !== skillsKnown.length) {
          return NextResponse.json(
            { error: 'Some skills in skillsKnown do not exist' },
            { status: 400 }
          );
        }
      }

      // Disconnect all existing and connect new ones
      updateData.skillsKnown = {
        set: skillsKnown.map(skillId => ({ id: skillId }))
      };
    }

    // Handle skillsLearning update (replace all)
    if (skillsLearning !== undefined) {
      if (!Array.isArray(skillsLearning)) {
        return NextResponse.json(
          { error: 'skillsLearning must be an array' },
          { status: 400 }
        );
      }

      // Verify all skills exist
      if (skillsLearning.length > 0) {
        const existingSkills = await prisma.skill.findMany({
          where: { id: { in: skillsLearning } },
          select: { id: true }
        });

        if (existingSkills.length !== skillsLearning.length) {
          return NextResponse.json(
            { error: 'Some skills in skillsLearning do not exist' },
            { status: 400 }
          );
        }
      }

      // Disconnect all existing and connect new ones
      updateData.skillsLearning = {
        set: skillsLearning.map(skillId => ({ id: skillId }))
      };
    }

    // Update user profile
    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        bio: true,
        role: true,
        createdAt: true,
        skillsKnown: {
          select: {
            id: true,
            name: true,
            category: true,
            description: true
          }
        },
        skillsLearning: {
          select: {
            id: true,
            name: true,
            category: true,
            description: true
          }
        },
        _count: {
          select: {
            mentorConnections: true,
            studentConnections: true
          }
        }
      }
    });

    return NextResponse.json({ 
      message: 'Profile updated successfully',
      user 
    }, { status: 200 });

  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile', details: error.message },
      { status: 500 }
    );
  }
}