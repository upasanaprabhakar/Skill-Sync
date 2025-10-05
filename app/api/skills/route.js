// app/api/skills/route.js
import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

// GET all skills
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const skills = await prisma.skill.findMany({
      where: category ? { category } : {},
      include: {
        _count: {
          select: {
            knownBy: true,
            learningBy: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json({ skills }, { status: 200 });
  } catch (error) {
    console.error('Error fetching skills:', error);
    return NextResponse.json(
      { error: 'Failed to fetch skills' },
      { status: 500 }
    );
  }
}

// POST create new skill
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, description, category } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Skill name is required' },
        { status: 400 }
      );
    }

    // Check if skill already exists
    const existingSkill = await prisma.skill.findUnique({
      where: { name }
    });

    if (existingSkill) {
      return NextResponse.json(
        { error: 'Skill already exists' },
        { status: 409 }
      );
    }

    const skill = await prisma.skill.create({
      data: {
        name,
        description: description || null,
        category: category || null
      }
    });

    return NextResponse.json({ skill }, { status: 201 });
  } catch (error) {
    console.error('Error creating skill:', error);
    return NextResponse.json(
      { error: 'Failed to create skill' },
      { status: 500 }
    );
  }
}