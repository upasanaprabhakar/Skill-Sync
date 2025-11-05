import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/app/lib/prisma';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId') || session.user.id;
    const period = searchParams.get('period') || 'all'; // all, week, month

    // Calculate date range
    const now = new Date();
    let startDate = null;
    
    if (period === 'week') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === 'month') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get all connections for the student
    const connections = await prisma.connection.findMany({
      where: {
        studentId: parseInt(studentId),
        status: 'ACCEPTED'
      },
      select: { id: true }
    });

    const connectionIds = connections.map(c => c.id);

    if (connectionIds.length === 0) {
      return NextResponse.json({
        totalHours: 0,
        sessionsAttended: 0,
        sessionsMissed: 0,
        tasksCompleted: 0,
        tasksPending: 0,
        completionRate: 0,
        period
      });
    }

    // Get sessions data
    const sessionsQuery = {
      where: {
        connectionId: { in: connectionIds },
        ...(startDate && { startTime: { gte: startDate } })
      }
    };

    const [completedSessions, missedSessions] = await Promise.all([
      prisma.session.findMany({
        ...sessionsQuery,
        where: {
          ...sessionsQuery.where,
          status: 'COMPLETED'
        },
        select: { duration: true }
      }),
      prisma.session.count({
        ...sessionsQuery,
        where: {
          ...sessionsQuery.where,
          status: 'MISSED'
        }
      })
    ]);

    // Calculate total hours
    const totalMinutes = completedSessions.reduce((sum, s) => sum + s.duration, 0);
    const totalHours = parseFloat((totalMinutes / 60).toFixed(1));

    // Get skill groups for the student's connections
    const skillGroupIds = await prisma.connection.findMany({
      where: {
        studentId: parseInt(studentId),
        status: 'ACCEPTED',
        skillGroupId: { not: null }
      },
      select: { skillGroupId: true }
    });

    const validSkillGroupIds = skillGroupIds
      .map(c => c.skillGroupId)
      .filter(id => id !== null);

    // Get homework tasks data
    const tasksQuery = {
      where: {
        skillGroupId: { in: validSkillGroupIds },
        tags: { has: 'HOMEWORK' },
        ...(startDate && { createdAt: { gte: startDate } })
      }
    };

    const [tasksCompleted, tasksPending] = await Promise.all([
      prisma.note.count({
        ...tasksQuery,
        where: {
          ...tasksQuery.where,
          isCompleted: true
        }
      }),
      prisma.note.count({
        ...tasksQuery,
        where: {
          ...tasksQuery.where,
          isCompleted: false
        }
      })
    ]);

    const totalTasks = tasksCompleted + tasksPending;
    const completionRate = totalTasks > 0 
      ? parseFloat(((tasksCompleted / totalTasks) * 100).toFixed(1))
      : 0;

    return NextResponse.json({
      totalHours,
      sessionsAttended: completedSessions.length,
      sessionsMissed: missedSessions,
      tasksCompleted,
      tasksPending,
      completionRate,
      period
    });

  } catch (error) {
    console.error('Error fetching progress stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch progress stats' },
      { status: 500 }
    );
  }
}