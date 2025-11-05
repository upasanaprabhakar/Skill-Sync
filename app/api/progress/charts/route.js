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

    // Get all connections
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
        weeklyHours: [],
        monthlyTasks: [],
        sessionDistribution: [],
        skillProgress: []
      });
    }

    // --- 1. Weekly Learning Hours (Last 8 weeks) ---
    const weeksAgo = new Date();
    weeksAgo.setDate(weeksAgo.getDate() - 56); // 8 weeks

    const completedSessions = await prisma.session.findMany({
      where: {
        connectionId: { in: connectionIds },
        status: 'COMPLETED',
        startTime: { gte: weeksAgo }
      },
      select: {
        startTime: true,
        duration: true
      },
      orderBy: { startTime: 'asc' }
    });

    // Group by week
    const weeklyData = {};
    const now = new Date();
    
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - (i * 7));
      const weekKey = `Week ${8 - i}`;
      weeklyData[weekKey] = 0;
    }

    completedSessions.forEach(session => {
      const weeksAgoCount = Math.floor(
        (now - new Date(session.startTime)) / (7 * 24 * 60 * 60 * 1000)
      );
      if (weeksAgoCount < 8) {
        const weekKey = `Week ${8 - weeksAgoCount}`;
        weeklyData[weekKey] += session.duration / 60; // Convert to hours
      }
    });

    const weeklyHours = Object.entries(weeklyData).map(([week, hours]) => ({
      week,
      hours: parseFloat(hours.toFixed(1))
    }));

    // --- 2. Monthly Tasks Completed (Last 6 months) ---
    const monthsAgo = new Date();
    monthsAgo.setMonth(monthsAgo.getMonth() - 6);

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

    const completedTasks = await prisma.note.findMany({
      where: {
        skillGroupId: { in: validSkillGroupIds },
        tags: { has: 'HOMEWORK' },
        isCompleted: true,
        completedAt: { gte: monthsAgo }
      },
      select: { completedAt: true }
    });

    // Group by month
    const monthlyData = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - i);
      const monthKey = monthNames[date.getMonth()];
      monthlyData[monthKey] = 0;
    }

    completedTasks.forEach(task => {
      if (task.completedAt) {
        const monthKey = monthNames[new Date(task.completedAt).getMonth()];
        if (monthlyData[monthKey] !== undefined) {
          monthlyData[monthKey]++;
        }
      }
    });

    const monthlyTasks = Object.entries(monthlyData).map(([month, tasks]) => ({
      month,
      tasks
    }));

    // --- 3. Session Status Distribution ---
    const sessionCounts = await prisma.session.groupBy({
      by: ['status'],
      where: {
        connectionId: { in: connectionIds }
      },
      _count: true
    });

    const sessionDistribution = sessionCounts.map(item => ({
      status: item.status,
      count: item._count
    }));

    // --- 4. Skill-wise Progress ---
    const skillGroups = await prisma.skillGroup.findMany({
      where: {
        connections: {
          some: {
            studentId: parseInt(studentId),
            status: 'ACCEPTED'
          }
        }
      },
      include: {
        skill: { select: { name: true } },
        notes: {
          where: { tags: { has: 'HOMEWORK' } },
          select: { isCompleted: true }
        }
      }
    });

    const skillProgress = skillGroups.map(group => {
      const totalTasks = group.notes.length;
      const completedTasks = group.notes.filter(n => n.isCompleted).length;
      const percentage = totalTasks > 0 
        ? Math.round((completedTasks / totalTasks) * 100)
        : 0;

      return {
        skill: group.skill.name,
        completed: completedTasks,
        total: totalTasks,
        percentage
      };
    });

    return NextResponse.json({
      weeklyHours,
      monthlyTasks,
      sessionDistribution,
      skillProgress
    });

  } catch (error) {
    console.error('Error fetching chart data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chart data' },
      { status: 500 }
    );
  }
}