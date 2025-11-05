// app/lib/sessionCron.js - UPDATED
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

let cronInterval = null;

async function updateExpiredSessions() {
  try {
    const now = new Date();
    
    // Find sessions that ended but are still CONFIRMED or PENDING
    const expiredSessions = await prisma.session.findMany({
      where: {
        endTime: { lt: now },
        status: { in: ['PENDING', 'CONFIRMED'] }
      }
    });

    for (const session of expiredSessions) {
      let status;
      
      // If either mentor or student joined, mark as COMPLETED
      if (session.joinedByMentor || session.joinedByStudent) {
        status = 'COMPLETED';
      } else {
        // Nobody joined, mark as MISSED
        status = 'MISSED';
      }
      
      await prisma.session.update({
        where: { id: session.id },
        data: { status }
      });
      
      console.log(`⏰ Session ${session.id} marked as ${status} (Mentor joined: ${session.joinedByMentor}, Student joined: ${session.joinedByStudent})`);
    }
    
    if (expiredSessions.length > 0) {
      console.log(`✅ Updated ${expiredSessions.length} expired sessions`);
    }
  } catch (error) {
    console.error('❌ Error updating expired sessions:', error);
  }
}

function startSessionCron() {
  cronInterval = setInterval(updateExpiredSessions, 5 * 60 * 1000);
  updateExpiredSessions();
  console.log('✅ Session cron job started (runs every 5 minutes)');
}

function stopSessionCron() {
  if (cronInterval) {
    clearInterval(cronInterval);
    cronInterval = null;
    console.log('🛑 Session cron job stopped');
  }
}

module.exports = { startSessionCron, stopSessionCron };