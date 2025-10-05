// app/api/connections/route.js
import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

// GET - Fetch all connections for a user
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status'); // PENDING, ACCEPTED, REJECTED

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const where = {
      OR: [
        { mentorId: parseInt(userId) },
        { studentId: parseInt(userId) }
      ],
      ...(status && { status })
    };

    const connections = await prisma.connection.findMany({
      where,
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ connections }, { status: 200 });
  } catch (error) {
    console.error('Error fetching connections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch connections' },
      { status: 500 }
    );
  }
}

// POST - Create a new connection request
export async function POST(request) {
  try {
    const body = await request.json();
    const { mentorId, studentId, message } = body;

    if (!mentorId || !studentId) {
      return NextResponse.json(
        { error: 'mentorId and studentId are required' },
        { status: 400 }
      );
    }

    // Check if connection already exists
    const existingConnection = await prisma.connection.findFirst({
      where: {
        mentorId: parseInt(mentorId),
        studentId: parseInt(studentId)
      }
    });

    if (existingConnection) {
      return NextResponse.json(
        { error: 'Connection request already exists' },
        { status: 400 }
      );
    }

    // Create new connection
    const connection = await prisma.connection.create({
      data: {
        mentorId: parseInt(mentorId),
        studentId: parseInt(studentId),
        status: 'PENDING',
        message: message || ''
      },
      include: {
        mentor: {
          select: {
            id: true,
            name: true,
            email: true,
            bio: true
          }
        },
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            bio: true
          }
        }
      }
    });

    return NextResponse.json({ connection }, { status: 201 });
  } catch (error) {
    console.error('Error creating connection:', error);
    return NextResponse.json(
      { error: 'Failed to create connection', details: error.message },
      { status: 500 }
    );
  }
}