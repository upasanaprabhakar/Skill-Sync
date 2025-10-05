// app/api/users/find/route.js
import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

// GET - Find mentors or students based on skills
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const skillId = searchParams.get('skillId');
    const category = searchParams.get('category');

    const where = {};

    // Role filter
    if (role) {
      if (role === 'BOTH') {
        where.role = { in: ['MENTOR', 'BOTH'] };
      } else {
        where.role = role;
      }
    }

    // Skill/Category filters
    if (skillId || category) {
      const skillFilter = {};
      
      if (skillId) {
        skillFilter.id = parseInt(skillId);
      }
      
      if (category) {
        skillFilter.category = category;
      }

      if (role === 'MENTOR' || role === 'BOTH') {
        where.skillsKnown = {
          some: skillFilter
        };
      } else if (role === 'STUDENT') {
        where.OR = [
          { skillsKnown: { some: skillFilter } },
          { skillsLearning: { some: skillFilter } }
        ];
      } else {
        where.OR = [
          { skillsKnown: { some: skillFilter } },
          { skillsLearning: { some: skillFilter } }
        ];
      }
    }

    console.log('Query where clause:', JSON.stringify(where, null, 2));

    const users = await prisma.user.findMany({
      where,
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
        _count: {
          select: {
            mentorConnections: true,
            studentConnections: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`Found ${users.length} users`);

    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    console.error('Error finding users:', error);
    return NextResponse.json(
      { error: 'Failed to find users', details: error.message },
      { status: 500 }
    );
  }
}