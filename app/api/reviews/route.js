// app/api/reviews/route.js - CORRECTED FILE
import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

// GET - Fetch reviews for a mentor
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const mentorId = searchParams.get('mentorId');

    if (!mentorId) {
      return NextResponse.json(
        { error: 'mentorId is required' },
        { status: 400 }
      );
    }

    const reviews = await prisma.review.findMany({
      where: {
        mentorId: parseInt(mentorId)
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        connection: {
          select: {
            id: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calculate average rating
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    return NextResponse.json({
      reviews,
      averageRating: Math.round(avgRating * 10) / 10,
      totalReviews: reviews.length
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create or update a review
export async function POST(request) {
  try {
    const body = await request.json();
    const { connectionId, mentorId, studentId, rating, comment } = body;

    console.log('📝 Review submission received:', { connectionId, mentorId, studentId, rating });

    // Validation
    if (!connectionId || !mentorId || !studentId || !rating) {
      console.error('❌ Missing required fields');
      return NextResponse.json(
        { error: 'connectionId, mentorId, studentId, and rating are required' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      console.error('❌ Invalid rating value');
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Parse to integers
    const parsedConnectionId = parseInt(connectionId);
    const parsedMentorId = parseInt(mentorId);
    const parsedStudentId = parseInt(studentId);

    if (isNaN(parsedConnectionId) || isNaN(parsedMentorId) || isNaN(parsedStudentId)) {
      console.error('❌ Invalid ID format');
      return NextResponse.json(
        { error: 'Invalid ID format' },
        { status: 400 }
      );
    }

    // Verify connection exists and is accepted
    const connection = await prisma.connection.findUnique({
      where: {
        id: parsedConnectionId
      }
    });

    if (!connection) {
      console.error('❌ Connection not found:', parsedConnectionId);
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      );
    }

    if (connection.status !== 'ACCEPTED') {
      console.error('❌ Connection not accepted:', connection.status);
      return NextResponse.json(
        { error: 'Can only review accepted connections' },
        { status: 400 }
      );
    }

    if (connection.mentorId !== parsedMentorId || connection.studentId !== parsedStudentId) {
      console.error('❌ Connection mismatch');
      return NextResponse.json(
        { error: 'Connection does not match provided mentor and student IDs' },
        { status: 400 }
      );
    }

    // Check if review already exists
    const existingReview = await prisma.review.findUnique({
      where: {
        connectionId: parsedConnectionId
      }
    });

    let review;

    if (existingReview) {
      // Update existing review
      console.log('📝 Updating existing review:', existingReview.id);
      review = await prisma.review.update({
        where: {
          id: existingReview.id
        },
        data: {
          rating: rating,
          comment: comment || null
        },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          mentor: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });
      console.log('✅ Review updated successfully:', review.id);
    } else {
      // Create new review
      console.log('📝 Creating new review');
      review = await prisma.review.create({
        data: {
          connectionId: parsedConnectionId,
          mentorId: parsedMentorId,
          studentId: parsedStudentId,
          rating: rating,
          comment: comment || null
        },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          mentor: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });
      console.log('✅ Review created successfully:', review.id);
    }

    return NextResponse.json({
      review: {
        id: review.id,
        connectionId: review.connectionId,
        mentorId: review.mentorId,
        studentId: review.studentId,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt
      },
      message: existingReview ? 'Review updated successfully' : 'Review submitted successfully'
    }, { status: existingReview ? 200 : 201 });

  } catch (error) {
    console.error('❌ Error submitting review:', error);
    
    // Handle specific Prisma errors
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Review already exists for this connection' },
        { status: 409 }
      );
    }

    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Invalid connection, mentor, or student ID' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to submit review', 
        details: error.message,
        code: error.code 
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete a review (optional feature)
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get('reviewId');

    if (!reviewId) {
      return NextResponse.json(
        { error: 'reviewId is required' },
        { status: 400 }
      );
    }

    const parsedReviewId = parseInt(reviewId);

    if (isNaN(parsedReviewId)) {
      return NextResponse.json(
        { error: 'Invalid reviewId format' },
        { status: 400 }
      );
    }

    // Check if review exists
    const review = await prisma.review.findUnique({
      where: {
        id: parsedReviewId
      }
    });

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    // Delete the review
    await prisma.review.delete({
      where: {
        id: parsedReviewId
      }
    });

    console.log('✅ Review deleted successfully:', parsedReviewId);

    return NextResponse.json({
      message: 'Review deleted successfully'
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Error deleting review:', error);
    return NextResponse.json(
      { error: 'Failed to delete review', details: error.message },
      { status: 500 }
    );
  }
}