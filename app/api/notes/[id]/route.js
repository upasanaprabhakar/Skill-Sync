// app/api/notes/[id]/route.js
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

    // Get the note with connection info
    const note = await prisma.note.findUnique({
      where: { id: noteId },
      include: {
        connection: {
          select: { mentorId: true, studentId: true }
        }
      }
    });

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Verify user is the mentor
    if (note.connection.mentorId !== userId) {
      return NextResponse.json(
        { error: 'Only mentors can edit notes' },
        { status: 403 }
      );
    }

    // Build update data object
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

    // Get the note with connection info
    const note = await prisma.note.findUnique({
      where: { id: noteId },
      include: {
        connection: {
          select: { mentorId: true, studentId: true }
        }
      }
    });

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Verify user is the mentor
    if (note.connection.mentorId !== userId) {
      return NextResponse.json(
        { error: 'Only mentors can delete notes' },
        { status: 403 }
      );
    }

    // Delete associated file if exists
    if (note.fileUrl) {
      try {
        const filePath = join(process.cwd(), 'public', note.fileUrl);
        if (existsSync(filePath)) {
          await unlink(filePath);
          console.log('File deleted successfully:', filePath);
        }
      } catch (fileError) {
        console.error('Error deleting file:', fileError);
        // Continue with note deletion even if file deletion fails
      }
    }

    // Delete the note
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