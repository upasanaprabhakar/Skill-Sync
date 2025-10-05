// app/api/users/[id]/skills/route.js
import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

// POST - Add skills to user (known or learning)
export async function POST(request, { params }) {
  try {
    const { id } = await params; // ← AWAIT params first
    const userId = parseInt(id);
    const body = await request.json();
    const { skillIds, type } = body;

    if (!skillIds || !Array.isArray(skillIds)) {
      return NextResponse.json(
        { error: 'skillIds must be an array' },
        { status: 400 }
      );
    }

    if (!['known', 'learning'].includes(type)) {
      return NextResponse.json(
        { error: 'type must be either "known" or "learning"' },
        { status: 400 }
      );
    }

    const updateData = type === 'known' 
      ? { skillsKnown: { connect: skillIds.map(id => ({ id })) } }
      : { skillsLearning: { connect: skillIds.map(id => ({ id })) } };

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        skillsKnown: {
          select: { id: true, name: true, category: true }
        },
        skillsLearning: {
          select: { id: true, name: true, category: true }
        }
      }
    });

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error('Error adding skills:', error);
    return NextResponse.json(
      { error: 'Failed to add skills' },
      { status: 500 }
    );
  }
}

// DELETE - Remove skills from user
export async function DELETE(request, { params }) {
  try {
    const { id } = await params; // ← AWAIT params first
    const userId = parseInt(id);
    const { searchParams } = new URL(request.url);
    const skillIds = searchParams.get('skillIds')?.split(',').map(Number);
    const type = searchParams.get('type');

    if (!skillIds || !skillIds.length) {
      return NextResponse.json(
        { error: 'skillIds are required' },
        { status: 400 }
      );
    }

    if (!['known', 'learning'].includes(type)) {
      return NextResponse.json(
        { error: 'type must be either "known" or "learning"' },
        { status: 400 }
      );
    }

    const updateData = type === 'known'
      ? { skillsKnown: { disconnect: skillIds.map(id => ({ id })) } }
      : { skillsLearning: { disconnect: skillIds.map(id => ({ id })) } };

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        skillsKnown: {
          select: { id: true, name: true, category: true }
        },
        skillsLearning: {
          select: { id: true, name: true, category: true }
        }
      }
    });

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error('Error removing skills:', error);
    return NextResponse.json(
      { error: 'Failed to remove skills' },
      { status: 500 }
    );
  }
}