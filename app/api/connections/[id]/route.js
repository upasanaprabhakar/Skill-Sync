// app/api/connections/[id]/route.js
import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

// PATCH - Update connection status (accept/reject)
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const connectionId = parseInt(id);
    const body = await request.json();
    const { status } = body;

    if (!status || !['ACCEPTED', 'REJECTED'].includes(status)) {
      return NextResponse.json(
        { error: 'Valid status (ACCEPTED or REJECTED) is required' },
        { status: 400 }
      );
    }

    const connection = await prisma.connection.update({
      where: { id: connectionId },
      data: { status },
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

    return NextResponse.json({ connection }, { status: 200 });
  } catch (error) {
    console.error('Error updating connection:', error);
    return NextResponse.json(
      { error: 'Failed to update connection' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a connection
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const connectionId = parseInt(id);

    await prisma.connection.delete({
      where: { id: connectionId }
    });

    return NextResponse.json(
      { message: 'Connection deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting connection:', error);
    return NextResponse.json(
      { error: 'Failed to delete connection' },
      { status: 500 }
    );
  }
}