// app/api/sessions/stats/route.js
import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = parseInt(searchParams.get('userId'));

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const now = new Date();
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));
    const endOfToday = new Date(now.setHours(23, 59, 59, 999));
    
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get all sessions for user
    const whereClause = {
      connection: {
        OR: [
          { mentorId: userId },
          { studentId: userId }
        ]
      }
    };

    const [
      totalSessions,
      upcomingSessions,
      todaySessions,
      weekSessions,
      monthSessions,
      completedSessions,
      pendingSessions,
      cancelledSessions
    ] = await Promise.all([
      // Total sessions
      prisma.session.count({ where: whereClause }),
      
      // Upcoming sessions
      prisma.session.count({
        where: {
          ...whereClause,
          startTime: { gte: new Date() },
          status: { in: ['PENDING', 'CONFIRMED'] }
        }
      }),
      
      // Today's sessions
      prisma.session.count({
        where: {
          ...whereClause,
          startTime: { gte: startOfToday, lte: endOfToday }
        }
      }),
      
      // This week's sessions
      prisma.session.count({
        where: {
          ...whereClause,
          startTime: { gte: startOfWeek }
        }
      }),
      
      // This month's sessions
      prisma.session.count({
        where: {
          ...whereClause,
          startTime: { gte: startOfMonth }
        }
      }),
      
      // Completed sessions
      prisma.session.count({
        where: { ...whereClause, status: 'COMPLETED' }
      }),
      
      // Pending sessions
      prisma.session.count({
        where: { ...whereClause, status: 'PENDING' }
      }),
      
      // Cancelled sessions
      prisma.session.count({
        where: { ...whereClause, status: 'CANCELLED' }
      })
    ]);

    // Get next session
    const nextSession = await prisma.session.findFirst({
      where: {
        ...whereClause,
        startTime: { gte: new Date() },
        status: { in: ['PENDING', 'CONFIRMED'] }
      },
      orderBy: { startTime: 'asc' },
      include: {
        connection: {
          include: {
            mentor: { select: { id: true, name: true } },
            student: { select: { id: true, name: true } }
          }
        }
      }
    });

    return NextResponse.json({
      stats: {
        total: totalSessions,
        upcoming: upcomingSessions,
        today: todaySessions,
        thisWeek: weekSessions,
        thisMonth: monthSessions,
        completed: completedSessions,
        pending: pendingSessions,
        cancelled: cancelledSessions
      },
      nextSession: nextSession || null
    });
  } catch (error) {
    console.error('❌ Error fetching session stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session stats', details: error.message },
      { status: 500 }
    );
  }
}