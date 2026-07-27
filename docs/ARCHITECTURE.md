# NPTA — System Architecture

## High-Level Architecture

```mermaid
graph TB
    subgraph "Client — Vercel"
        A["React 19 + Vite 6"]
        B["Zustand Stores"]
        C["Socket.IO Client"]
        D["React Router 7"]
        E["Framer Motion"]
        F["Tailwind CSS v4"]
    end

    subgraph "Server — Render"
        G["Express 5"]
        H["Socket.IO Server"]
        I["REST API"]
        J["Game Engine"]
        K["Room Manager"]
        L["Scoring Engine"]
        M["Validation Engine"]
        N["Timer Manager"]
        O["Letter Generator"]
        P["Session Service"]
    end

    subgraph "Database — Neon"
        Q[("PostgreSQL 16")]
        R["Prisma ORM"]
    end

    A --> B
    A --> C
    A --> D
    C <-->|WebSocket| H
    A <-->|REST| I
    H --> J
    H --> K
    J --> L
    J --> M
    J --> N
    J --> O
    I --> P
    J --> R
    P --> R
    K --> R
    R --> Q
```

## Backend Architecture (Clean Architecture)

```
Request Flow:
  Client → Socket.IO/REST → Handler/Controller → Service → Engine → Database
  
Response Flow:
  Database → Engine → Service → Socket.IO Broadcast/REST Response → Client
```

### Layers

| Layer | Responsibility | Example Files |
|-------|---------------|---------------|
| **Transport** | HTTP/WebSocket protocol | `socket/handlers/`, `routes/`, `controllers/` |
| **Service** | Business logic coordination | `services/SessionService.ts` |
| **Engine** | Core game logic | `engine/GameEngine.ts`, `ScoringEngine.ts` |
| **Data** | Database operations | `lib/prisma.ts`, Prisma queries in services |

## Frontend Architecture

```
Component Hierarchy:
  App
  ├── HomePage
  │   ├── ThemeToggle
  │   ├── Input (name)
  │   ├── Button (create/join)
  │   └── Card (recent rooms)
  ├── LobbyPage
  │   ├── RoomCode
  │   ├── QRCode
  │   ├── PlayerCard[]
  │   ├── SettingsPanel (host)
  │   └── Button (start/ready)
  ├── GamePage
  │   ├── Timer
  │   ├── LetterReveal
  │   ├── CategoryInput[5]
  │   └── Button (submit)
  └── WinnerPage
      ├── Podium
      ├── Confetti
      ├── Leaderboard
      └── Buttons (play again/home)
```

### State Management (Zustand)

| Store | Scope | Persistence |
|-------|-------|-------------|
| `playerStore` | Player identity, session | localStorage |
| `roomStore` | Room state, players | Memory |
| `gameStore` | Game/round state, answers | Memory |
| `socketStore` | Socket connection | Memory |
| `settingsStore` | Theme, sound prefs | localStorage |

## Security Architecture

| Layer | Measure |
|-------|---------|
| Transport | Helmet headers, CORS |
| Auth | UUID session tokens, socket auth middleware |
| Input | Zod validation, input sanitization |
| Game Logic | 100% server-authoritative, never trust client |
| Rate Limiting | Express rate limiter on REST endpoints |
| Room Codes | Unambiguous charset (no I/O/0/1) |

## Deployment Architecture

```mermaid
graph LR
    A[GitHub] -->|Push| B[GitHub Actions CI]
    B -->|Build & Test| C{Pass?}
    C -->|Yes| D[Vercel — Frontend]
    C -->|Yes| E[Render — Backend]
    E -->|Prisma| F[Neon — PostgreSQL]
    D -->|API/WS| E
```
