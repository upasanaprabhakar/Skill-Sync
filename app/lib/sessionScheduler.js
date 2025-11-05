// app/lib/sessionScheduler.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

let reminderInterval = null;

function startReminderScheduler(io) {
  // Check every minute for reminders to send
  reminderInterval = setInterval(async () => {
    try {
      const now = new Date();
      
      // Find reminders that should be sent
      const dueReminders = await prisma.reminder.findMany({
        where: {
          sent: false,
          scheduledFor: {
            lte: now
          }
        },
        include: {
          session: {
            include: {
              connection: {
                include: {
                  mentor: { select: { id: true, name: true, email: true } },
                  student: { select: { id: true, name: true, email: true } }
                }
              }
            }
          }
        }
      });

      for (const reminder of dueReminders) {
        // Skip if session is cancelled or completed
        if (['CANCELLED', 'COMPLETED', 'MISSED'].includes(reminder.session.status)) {
          await prisma.reminder.update({
            where: { id: reminder.id },
            data: { sent: true, sentAt: now }
          });
          continue;
        }

        console.log(`📧 Sending ${reminder.reminderType} reminder for session:`, reminder.session.title);

        const session = reminder.session;
        const mentor = session.connection.mentor;
        const student = session.connection.student;

        // Send reminder via Socket.IO to both mentor and student
        if (io) {
          io.to(`user:${mentor.id}`).emit('session-reminder', {
            sessionId: session.id,
            reminderType: reminder.reminderType,
            session: {
              title: session.title,
              startTime: session.startTime,
              endTime: session.endTime,
              meetingLink: session.meetingLink
            },
            message: `Upcoming session: "${session.title}" with ${student.name}`,
            timestamp: now
          });

          io.to(`user:${student.id}`).emit('session-reminder', {
            sessionId: session.id,
            reminderType: reminder.reminderType,
            session: {
              title: session.title,
              startTime: session.startTime,
              endTime: session.endTime,
              meetingLink: session.meetingLink
            },
            message: `Upcoming session: "${session.title}" with ${mentor.name}`,
            timestamp: now
          });
        }

        // Mark reminder as sent
        await prisma.reminder.update({
          where: { id: reminder.id },
          data: { sent: true, sentAt: now }
        });

        console.log(`✅ Reminder sent successfully`);
      }

      // Check for missed sessions
      const missedSessions = await prisma.session.findMany({
        where: {
          status: { in: ['PENDING', 'CONFIRMED'] },
          endTime: {
            lt: new Date(now.getTime() - 30 * 60 * 1000)
          }
        }
      });

      for (const session of missedSessions) {
        console.log(`⚠️ Marking session as MISSED:`, session.title);
        await prisma.session.update({
          where: { id: session.id },
          data: { status: 'MISSED' }
        });
      }

    } catch (error) {
      console.error('❌ Error in reminder scheduler:', error);
    }
  }, 60000); // Run every minute

  console.log('✅ Session reminder scheduler started');
}

function stopReminderScheduler() {
  if (reminderInterval) {
    clearInterval(reminderInterval);
    reminderInterval = null;
    console.log('🛑 Session reminder scheduler stopped');
  }
}

module.exports = { startReminderScheduler, stopReminderScheduler };