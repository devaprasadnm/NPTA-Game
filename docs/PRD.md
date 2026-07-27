# NPTA — Product Requirements Document (PRD)

## 1. Product Overview
**NPTA (Name, Place, Thing, Animal, Profession)** is a real-time mobile-first multiplayer word game. Players join a private or public game room, receive a shared randomly generated letter (A-Z), and enter words starting with that letter for 5 predefined categories within a set duration.

## 2. Core Game Loop
1. **Host Setup**: Host creates a room, configures settings (Rounds: 1-26, Duration: 15-180s, Max Players: 2-20).
2. **Lobby**: Players join via 6-character room code or QR code. Non-host players toggle ready status. Host starts game.
3. **Round Countdown**: 3-second visual letter reveal with 3D flip animation.
4. **Active Round**: Players fill answers for Name, Place, Thing, Animal, Profession. Countdown timer ticks on server.
5. **Round End**: Triggered by timer reaching zero or all online players submitting.
6. **Server Scoring**:
   - Unique valid answer: **+10 pts**
   - Duplicate valid answer: **+5 pts**
   - Blank / Wrong letter answer: **0 pts**
7. **Round Review**: Animated score breakdown & live leaderboard updates.
8. **Game Completion**: Winner podium (1st, 2nd, 3rd), confetti celebration, option to play again or return home.

## 3. Functional Requirements
- **FR-1**: UUID-based guest authentication token persisted in client localStorage.
- **FR-2**: Room creation with unambiguous 6-character room code generation (excluding I, O, 0, 1).
- **FR-3**: Real-time room status, player joins/leaves, host migration, and setting updates.
- **FR-4**: Non-repeating random letter generator tracking used letters per game.
- **FR-5**: Server-authoritative validation & scoring algorithm. Client cannot calculate scores.
- **FR-6**: Auto-reconnection & session recovery within 5 minutes of disconnect.
- **FR-7**: In-game chat & emoji reactions broadcast to all room players.

## 4. Non-Functional Requirements
- **NFR-1**: Mobile-first touch targets (minimum 44px height) working across 320px screen width to desktop.
- **NFR-2**: 100% free hosting deployment target (Vercel client, Render server, Neon PostgreSQL).
- **NFR-3**: Sub-100ms real-time event delivery latency over Socket.IO WebSockets.
- **NFR-4**: Strict type safety end-to-end with TypeScript monorepo and Prisma ORM.

## 5. User Stories
- **US-1**: *As a player*, I want to enter my name and immediately join or create a room so I can play without a lengthy signup.
- **US-2**: *As a host*, I want to customize the number of rounds and timer duration so I can tailor game speed.
- **US-3**: *As a mobile player*, I want sticky submit buttons and smooth animations so the game feels like a native mobile app.
- **US-4**: *As a player*, I want to see detailed round breakdowns showing why an answer was scored 10, 5, or 0 points.

## 6. MVP Definition
The MVP includes:
- Monorepo architecture with `@npta/shared`, `@npta/server`, and `@npta/client`
- Guest session authentication
- Room creation, joining via room code, host controls
- 5 categories: Name, Place, Thing, Animal, Profession
- Full server-authoritative game engine, timer manager, letter generator, scoring engine
- Mobile-first responsive UI with glassmorphism, dark/light mode, and Framer Motion animations
- Docker setup & GitHub Actions CI pipeline
