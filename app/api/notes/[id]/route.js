import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const noteId = parseInt(id);
    const body = await request.json();
    const { userId, title, content, tags, isPinned } = body;

    if (!userId || !noteId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const note = await prisma.note.findUnique({
      where: { id: noteId },
      include: {
        skillGroup: {
          select: { mentorId: true }
        }
      }
    });

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    if (note.skillGroup.mentorId !== userId) {
      return NextResponse.json(
        { error: 'Only mentors can edit notes' },
        { status: 403 }
      );
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (content !== undefined) updateData.content = content.trim();
    if (tags !== undefined) updateData.tags = tags;
    if (isPinned !== undefined) updateData.isPinned = isPinned;

    const updatedNote = await prisma.note.update({
      where: { id: noteId },
      data: updateData,
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return NextResponse.json({ note: updatedNote }, { status: 200 });
  } catch (error) {
    console.error('Error updating note:', error);
    return NextResponse.json(
      { error: 'Failed to update note' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const noteId = parseInt(id);
    const body = await request.json();
    const { userId } = body;

    if (!userId || !noteId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const note = await prisma.note.findUnique({
      where: { id: noteId },
      include: {
        skillGroup: {
          select: { mentorId: true }
        }
      }
    });

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    if (note.skillGroup.mentorId !== userId) {
      return NextResponse.json(
        { error: 'Only mentors can delete notes' },
        { status: 403 }
      );
    }

    if (note.fileUrl) {
      try {
        const filePath = join(process.cwd(), 'public', note.fileUrl);
        if (existsSync(filePath)) {
          await unlink(filePath);
          console.log('File deleted successfully:', filePath);
        }
      } catch (fileError) {
        console.error('Error deleting file:', fileError);
      }
    }

    await prisma.note.delete({
      where: { id: noteId }
    });

    return NextResponse.json(
      { message: 'Note deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting note:', error);
    return NextResponse.json(
      { error: 'Failed to delete note' },
      { status: 500 }
    );
  }
}