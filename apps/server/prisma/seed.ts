// ============================================
// Database Seed Script
// ============================================

import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create sample players
  const player1 = await prisma.player.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      displayName: 'Alice',
      avatarUrl: '🌸',
    },
  });

  const player2 = await prisma.player.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000003',
      displayName: 'Bob',
      avatarUrl: '🚀',
    },
  });

  // Create active sessions
  await prisma.session.create({
    data: {
      playerId: player1.id,
      token: uuidv4(),
      expiresAt: new Date(Date.now() + 72 * 3600 * 1000),
    },
  });

  await prisma.session.create({
    data: {
      playerId: player2.id,
      token: uuidv4(),
      expiresAt: new Date(Date.now() + 72 * 3600 * 1000),
    },
  });

  // Create player stats
  await prisma.playerStats.upsert({
    where: { playerId: player1.id },
    update: {},
    create: {
      playerId: player1.id,
      gamesPlayed: 5,
      gamesWon: 3,
      totalScore: 450,
      avgScore: 90.0,
    },
  });

  await prisma.playerStats.upsert({
    where: { playerId: player2.id },
    update: {},
    create: {
      playerId: player2.id,
      gamesPlayed: 5,
      gamesWon: 2,
      totalScore: 380,
      avgScore: 76.0,
    },
  });

  // Create a sample demo room
  const demoRoom = await prisma.room.upsert({
    where: { code: 'DEMO99' },
    update: {},
    create: {
      code: 'DEMO99',
      hostId: player1.id,
      status: 'WAITING',
      isPrivate: false,
      settings: JSON.stringify({
        rounds: 5,
        roundDuration: 60,
        minPlayers: 2,
        maxPlayers: 10,
      }),
      roomPlayers: {
        create: [
          { playerId: player1.id, isHost: true, isOnline: true },
          { playerId: player2.id, isHost: false, isOnline: true },
        ],
      },
    },
  });

  console.log(`✅ Database seeded successfully! Demo room created: ${demoRoom.code}`);
}

main()
  .catch((e) => {
    console.error('❌ Database seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
