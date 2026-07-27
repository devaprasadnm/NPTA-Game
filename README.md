# NPTA — Name, Place, Thing, Animal, Profession

A real-time multiplayer word game built with React, Node.js, Socket.IO, and PostgreSQL.

![NPTA](https://img.shields.io/badge/NPTA-Multiplayer_Word_Game-6366F1?style=for-the-badge)

## 🎮 Overview

NPTA is a multiplayer word game where players join a room, receive a randomly generated letter, and race to fill in words for five categories (Name, Place, Thing, Animal, Profession) before the timer runs out. All game logic is server-authoritative.

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, Framer Motion |
| Backend | Node.js, Express 5, TypeScript, Socket.IO |
| Database | PostgreSQL, Prisma ORM |
| Auth | Guest sessions with UUID tokens |

## 📁 Project Structure

```
NPTAL/
├── packages/shared/     # Shared types, constants, utilities
├── apps/
│   ├── client/          # React frontend (Vite)
│   └── server/          # Node.js backend (Express + Socket.IO)
├── docker-compose.yml   # Local development
└── .github/workflows/   # CI/CD
```

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL (or use Docker)

### Option 1: Local Development

```bash
# Clone and install
git clone <repo-url>
cd NPTAL
npm install

# Setup database (automatic SQLite local dev)
npm run db:push
npm run db:seed

# Start development (runs client & server together, or run individually)
npm run dev

# Or run individually in separate terminals:
npm run dev:server   # Backend → http://localhost:3001
npm run dev:client   # Frontend → http://localhost:5173
```

### Option 2: Docker

```bash
docker-compose up
# Client: http://localhost:5173
# Server: http://localhost:3001
```

## 🎯 Game Rules

1. Players join a room via room code
2. Host starts the game
3. Each round: a random letter is revealed
4. Players fill in words starting with that letter for 5 categories
5. **Scoring**: Unique answer = **10 pts**, Duplicate = **5 pts**, Invalid = **0 pts**
6. Winner is the player with the highest total score after all rounds

## 🏗 Architecture

- **Server-Authoritative**: All scoring, validation, and game logic runs on the server
- **Real-time**: Socket.IO for instant game state synchronization
- **Clean Architecture**: Controllers → Services → Engine → Database
- **Type-Safe**: Shared TypeScript types between client and server

## 📦 Deployment

| Service | Platform |
|---------|----------|
| Frontend | Vercel |
| Backend | Render |
| Database | Neon PostgreSQL |

## 📄 License

MIT
