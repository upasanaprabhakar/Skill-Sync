//app/api/messages/route.js
import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

// GET - Fetch messages for a connection
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

    // Verify user is part of this connection
    const connection = await prisma.connection.findUnique({
      where: { id: connectionId },
      select: {
        mentorId: true,
        studentId: true
      }
    });

    if (!connection || (connection.mentorId !== userId && connection.studentId !== userId)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Fetch messages
    const messages = await prisma.message.findMany({
      where: { connectionId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        senderId: true,
        receiverId: true,
        content: true,
        read: true,
        createdAt: true
      }
    });

    // Mark messages as read if user is the receiver
    await prisma.message.updateMany({
      where: {
        connectionId,
        receiverId: userId,
        read: false
      },
      data: { read: true }
    });

    return NextResponse.json({ messages }, { status: 200 });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// POST - Send a new message
export async function POST(request) {
  try {
    const body = await request.json();
    const { senderId, receiverId, connectionId, content } = body;

    if (!senderId || !receiverId || !connectionId || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify connection exists and is accepted
    const connection = await prisma.connection.findUnique({
      where: { id: connectionId },
      select: {
        status: true,
        mentorId: true,
        studentId: true
      }
    });

    if (!connection) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      );
    }

    if (connection.status !== 'ACCEPTED') {
      return NextResponse.json(
        { error: 'Connection not accepted' },
        { status: 403 }
      );
    }

    // Verify sender is part of connection
    if (connection.mentorId !== senderId && connection.studentId !== senderId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        senderId,
        receiverId,
        connectionId,
        content: content.trim()
      },
      select: {
        id: true,
        senderId: true,
        receiverId: true,
        content: true,
        read: true,
        createdAt: true
      }
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}