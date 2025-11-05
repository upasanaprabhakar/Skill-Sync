import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/app/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// GET: Fetch notes for a skill group (with auth)
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const skillGroupId = parseInt(searchParams.get('skillGroupId'));
    const userId = parseInt(searchParams.get('userId')) || session.user.id;

    if (!skillGroupId || !userId) {
      return NextResponse.json(
        { error: 'skillGroupId and userId are required' },
        { status: 400 }
      );
    }

    console.log('📚 Fetching notes - Group:', skillGroupId, 'User:', userId);

    const skillGroup = await prisma.skillGroup.findUnique({
      where: { id: skillGroupId },
      include: {
        skill: true
      }
    });

    if (!skillGroup) {
      console.error('❌ Skill group not found:', skillGroupId);
      return NextResponse.json(
        { error: 'Skill group not found' },
        { status: 404 }
      );
    }

    const isMentor = skillGroup.mentorId === userId;

    const isAuthorizedStudent = await prisma.connection.findFirst({
      where: {
        mentorId: skillGroup.mentorId,
        studentId: userId,
        status: 'ACCEPTED',
        student: {
          skillsLearning: {
            some: { id: skillGroup.skillId }
          }
        }
      }
    });

    if (!isMentor && !isAuthorizedStudent) {
      console.error('❌ Access denied - User:', userId, 'not authorized for group:', skillGroupId);
      return NextResponse.json(
        { error: 'Access denied to this skill group' },
        { status: 403 }
      );
    }

    console.log('✅ Access granted -', isMentor ? 'Mentor' : 'Student');

    const notes = await prisma.note.findMany({
      where: { skillGroupId },
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    console.log('✅ Notes loaded:', notes.length);

    return NextResponse.json({ notes }, { status: 200 });
  } catch (error) {
    console.error('❌ Error fetching notes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notes' },
      { status: 500 }
    );
  }
}

// POST: Create a new note
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    
    const skillGroupId = parseInt(formData.get('skillGroupId'));
    const userId = parseInt(formData.get('userId')) || session.user.id;
    const title = formData.get('title');
    const content = formData.get('content');
    const tags = JSON.parse(formData.get('tags') || '[]');
    const file = formData.get('file');

    if (!skillGroupId || !userId || !title || !content) {
      return NextResponse.json(
        { error: 'skillGroupId, userId, title, and content are required' },
        { status: 400 }
      );
    }

    const skillGroup = await prisma.skillGroup.findUnique({
      where: { id: skillGroupId }
    });

    if (!skillGroup) {
      return NextResponse.json(
        { error: 'Skill group not found' },
        { status: 404 }
      );
    }

    if (skillGroup.mentorId !== userId) {
      return NextResponse.json(
        { error: 'Only the mentor can create notes in this group' },
        { status: 403 }
      );
    }

    let fileUrl = null;
    let fileName = null;
    let fileType = null;

    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadDir = join(process.cwd(), 'public', 'uploads', 'notes');
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }

      const timestamp = Date.now();
      const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const uniqueFileName = `${timestamp}_${originalName}`;
      const filePath = join(uploadDir, uniqueFileName);

      await writeFile(filePath, buffer);

      fileUrl = `/uploads/notes/${uniqueFileName}`;
      fileName = file.name;
      fileType = file.type;
    }

    const note = await prisma.note.create({
      data: {
        skillGroupId,
        createdBy: userId,
        title: title.trim(),
        content: content.trim(),
        tags,
        fileUrl,
        fileName,
        fileType
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    console.error('Error creating note:', error);
    return NextResponse.json(
      { error: 'Failed to create note' },
      { status: 500 }
    );
  }
}
