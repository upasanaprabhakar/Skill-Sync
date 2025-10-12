// app/api/notes/route.js
import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const connectionId = parseInt(searchParams.get('connectionId'));
    const userId = parseInt(searchParams.get('userId'));

    if (!connectionId || !userId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const connection = await prisma.connection.findUnique({
      where: { id: connectionId },
      select: { mentorId: true, studentId: true }
    });

    if (!connection || (connection.mentorId !== userId && connection.studentId !== userId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const notes = await prisma.note.findMany({
      where: { connectionId },
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

    return NextResponse.json({ notes }, { status: 200 });
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notes' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    
    const connectionId = parseInt(formData.get('connectionId'));
    const userId = parseInt(formData.get('userId'));
    const title = formData.get('title');
    const content = formData.get('content');
    const tags = JSON.parse(formData.get('tags') || '[]');
    const file = formData.get('file');

    if (!connectionId || !userId || !title || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const connection = await prisma.connection.findUnique({
      where: { id: connectionId },
      select: { status: true, mentorId: true, studentId: true }
    });

    if (!connection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
    }

    if (connection.status !== 'ACCEPTED') {
      return NextResponse.json({ error: 'Connection not accepted' }, { status: 403 });
    }

    if (connection.mentorId !== userId && connection.studentId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
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
        connectionId,
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