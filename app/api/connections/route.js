// app/api/connections/route.js
import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

// GET - Fetch all connections for a user
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');

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
            },
            // NEW: Include mentor's reviews for rating calculation
            reviewsReceived: {
              select: {
                rating: true
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
        },
        skillGroup: {
          include: {
            skill: true
          }
        },
        // NEW: Include the review for this specific connection
        review: {
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // NEW: Calculate average rating for each mentor
    const connectionsWithRatings = connections.map(conn => {
      if (conn.mentor.reviewsReceived) {
        const reviews = conn.mentor.reviewsReceived;
        const avgRating = reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : 0;
        
        return {
          ...conn,
          mentor: {
            ...conn.mentor,
            averageRating: Math.round(avgRating * 10) / 10,
            totalReviews: reviews.length,
            isTopRated: avgRating >= 4.5 && reviews.length >= 3,
            reviewsReceived: undefined // Remove detailed reviews from response
          }
        };
      }
      return conn;
    });

    return NextResponse.json({ connections: connectionsWithRatings }, { status: 200 });
  } catch (error) {
    console.error('❌ Error fetching connections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch connections', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create a new connection request
export async function POST(request) {
  try {
    const body = await request.json();
    const { mentorId, studentId, message } = body;

    console.log('📝 Connection request received:', { mentorId, studentId, message });

    // Validation
    if (!mentorId || !studentId) {
      console.error('❌ Missing required fields');
      return NextResponse.json(
        { error: 'mentorId and studentId are required' },
        { status: 400 }
      );
    }

    // Parse to integers
    const parsedMentorId = parseInt(mentorId);
    const parsedStudentId = parseInt(studentId);

    if (isNaN(parsedMentorId) || isNaN(parsedStudentId)) {
      console.error('❌ Invalid ID format');
      return NextResponse.json(
        { error: 'Invalid mentorId or studentId format' },
        { status: 400 }
      );
    }

    // Check if both users exist
    const [mentor, student] = await Promise.all([
      prisma.user.findUnique({
        where: { id: parsedMentorId },
        select: { id: true, name: true, role: true }
      }),
      prisma.user.findUnique({
        where: { id: parsedStudentId },
        select: { id: true, name: true, role: true }
      })
    ]);

    if (!mentor) {
      console.error('❌ Mentor not found:', parsedMentorId);
      return NextResponse.json(
        { error: 'Mentor not found' },
        { status: 404 }
      );
    }

    if (!student) {
      console.error('❌ Student not found:', parsedStudentId);
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Verify roles
    if (mentor.role !== 'MENTOR' && mentor.role !== 'BOTH') {
      console.error('❌ User is not a mentor:', mentor);
      return NextResponse.json(
        { error: 'Selected user is not a mentor' },
        { status: 400 }
      );
    }

    if (student.role !== 'STUDENT' && student.role !== 'BOTH') {
      console.error('❌ User is not a student:', student);
      return NextResponse.json(
        { error: 'You must be a student to send connection requests' },
        { status: 400 }
      );
    }

    // Check if connection already exists
    const existingConnection = await prisma.connection.findUnique({
      where: {
        mentorId_studentId: {
          mentorId: parsedMentorId,
          studentId: parsedStudentId
        }
      }
    });

    if (existingConnection) {
      console.log('⚠️ Connection already exists:', existingConnection.status);
      return NextResponse.json(
        { error: `Connection request already exists with status: ${existingConnection.status}` },
        { status: 409 }
      );
    }

    // Create new connection
    const connection = await prisma.connection.create({
      data: {
        mentorId: parsedMentorId,
        studentId: parsedStudentId,
        status: 'PENDING',
        message: message || 'Hi! I would like to learn from you.'
      },
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

    console.log('✅ Connection created successfully:', connection.id);

    return NextResponse.json({ connection }, { status: 201 });
  } catch (error) {
    console.error('❌ Error creating connection:', error);
    
    // Handle specific Prisma errors
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Connection request already exists' },
        { status: 409 }
      );
    }

    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Invalid mentor or student ID' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to create connection', 
        details: error.message,
        code: error.code 
      },
      { status: 500 }
    );
  }
}