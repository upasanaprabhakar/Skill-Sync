// app/api/skill-groups/route.js - FIXED GET function
import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

// GET: Fetch skill groups for a mentor or student
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const mentorId = searchParams.get('mentorId');
    const studentId = searchParams.get('studentId');

    if (!mentorId && !studentId) {
      return NextResponse.json(
        { error: 'Either mentorId or studentId is required' },
        { status: 400 }
      );
    }

    if (mentorId) {
      // Fetch skill groups created by this mentor
      const groups = await prisma.skillGroup.findMany({
        where: { mentorId: parseInt(mentorId) },
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
        },
        orderBy: { createdAt: 'desc' }
      });

      return NextResponse.json({ groups });
    }

    if (studentId) {
      // ✅ FIXED: Fetch the student's accepted connections first
      const student = await prisma.user.findUnique({
        where: { id: parseInt(studentId) },
        include: {
          skillsLearning: true,
          studentConnections: {
            where: { status: 'ACCEPTED' },
            include: {
              mentor: true
            }
          }
        }
      });

      if (!student) {
        return NextResponse.json({ groups: [] });
      }

      // Get skill IDs the student is learning
      const skillIds = student.skillsLearning.map(skill => skill.id);
      
      // Get mentor IDs the student is connected to
      const mentorIds = student.studentConnections.map(conn => conn.mentorId);

      // ✅ FIXED: Find all skill groups that match BOTH conditions:
      // 1. Created by mentors the student is connected to
      // 2. For skills the student is learning
      const groups = await prisma.skillGroup.findMany({
        where: {
          mentorId: { in: mentorIds },
          skillId: { in: skillIds }
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
        },
        orderBy: { createdAt: 'desc' }
      });

      // ✅ BONUS: Auto-link connections to skill groups if not already linked
      for (const group of groups) {
        await prisma.connection.updateMany({
          where: {
            mentorId: group.mentorId,
            studentId: parseInt(studentId),
            status: 'ACCEPTED',
            skillGroupId: null,
            student: {
              skillsLearning: {
                some: { id: group.skillId }
              }
            }
          },
          data: {
            skillGroupId: group.id
          }
        });
      }

      return NextResponse.json({ groups });
    }
  } catch (error) {
    console.error('Error fetching skill groups:', error);
    return NextResponse.json(
      { error: 'Failed to fetch skill groups' },
      { status: 500 }
    );
  }
}

// POST: Create a new skill group (keep your existing POST function)
export async function POST(request) {
  try {
    const { mentorId, skillId, name, description } = await request.json();

    if (!mentorId || !skillId || !name) {
      return NextResponse.json(
        { error: 'mentorId, skillId, and name are required' },
        { status: 400 }
      );
    }

    const mentor = await prisma.user.findFirst({
      where: {
        id: parseInt(mentorId),
        role: { in: ['MENTOR', 'BOTH'] },
        skillsKnown: {
          some: { id: parseInt(skillId) }
        }
      }
    });

    if (!mentor) {
      return NextResponse.json(
        { error: 'Mentor not found or does not have this skill' },
        { status: 404 }
      );
    }

    const existingGroup = await prisma.skillGroup.findUnique({
      where: {
        mentorId_skillId: {
          mentorId: parseInt(mentorId),
          skillId: parseInt(skillId)
        }
      }
    });

    if (existingGroup) {
      return NextResponse.json(
        { error: 'Skill group already exists for this mentor and skill' },
        { status: 409 }
      );
    }

    const group = await prisma.skillGroup.create({
      data: {
        mentorId: parseInt(mentorId),
        skillId: parseInt(skillId),
        name: name.trim(),
        description: description?.trim()
      },
      include: {
        skill: true,
        mentor: {
          select: { id: true, name: true, email: true }
        },
        _count: {
          select: {
            connections: true,
            notes: true
          }
        }
      }
    });

    await prisma.connection.updateMany({
      where: {
        mentorId: parseInt(mentorId),
        status: 'ACCEPTED',
        student: {
          skillsLearning: {
            some: { id: parseInt(skillId) }
          }
        }
      },
      data: {
        skillGroupId: group.id
      }
    });

    return NextResponse.json({ group }, { status: 201 });
  } catch (error) {
    console.error('Error creating skill group:', error);
    return NextResponse.json(
      { error: 'Failed to create skill group' },
      { status: 500 }
    );
  }
}