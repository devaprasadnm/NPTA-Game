# NPTA — Database Design

## ER Diagram

```mermaid
erDiagram
    Player ||--o{ Session : has
    Player ||--o{ RoomPlayer : "participates in"
    Player ||--o{ Answer : submits
    Player ||--o{ GameHistory : "has results"
    Player ||--o| PlayerStats : "has stats"
    Player ||--o{ Room : "hosts"
    
    Room ||--o{ RoomPlayer : contains
    Room ||--o{ Game : "has games"
    
    Game ||--o{ Round : "has rounds"
    Game ||--o{ GameHistory : "has results"
    
    Round ||--o{ Answer : "has answers"

    Player {
        uuid id PK
        varchar displayName
        varchar avatarUrl
        datetime createdAt
        datetime updatedAt
    }

    Session {
        uuid id PK
        uuid playerId FK
        uuid token UK
        datetime expiresAt
        datetime createdAt
    }

    Room {
        uuid id PK
        varchar code UK
        uuid hostId FK
        enum status
        boolean isPrivate
        json settings
        datetime createdAt
        datetime updatedAt
    }

    RoomPlayer {
        uuid id PK
        uuid roomId FK
        uuid playerId FK
        boolean isHost
        boolean isOnline
        boolean isReady
        datetime joinedAt
    }

    Game {
        uuid id PK
        uuid roomId FK
        enum status
        int currentRound
        int totalRounds
        text[] usedLetters
        datetime startedAt
        datetime finishedAt
    }

    Round {
        uuid id PK
        uuid gameId FK
        int roundNumber
        char letter
        enum status
        int duration
        datetime startedAt
        datetime endedAt
    }

    Answer {
        uuid id PK
        uuid roundId FK
        uuid playerId FK
        enum category
        varchar value
        boolean isValid
        int score
        datetime createdAt
    }

    GameHistory {
        uuid id PK
        uuid gameId FK
        uuid playerId FK
        int totalScore
        int rank
        datetime finishedAt
    }

    PlayerStats {
        uuid id PK
        uuid playerId FK UK
        int gamesPlayed
        int gamesWon
        int totalScore
        float avgScore
    }
```

## Indexes

| Table | Index | Columns | Purpose |
|-------|-------|---------|---------|
| Session | idx_session_token | token | Fast token lookup for auth |
| Session | idx_session_player | playerId | Find player sessions |
| Session | idx_session_expiry | expiresAt | Cleanup expired sessions |
| Room | idx_room_code | code (UNIQUE) | Fast room code lookup |
| Room | idx_room_status | status | Filter active rooms |
| RoomPlayer | ux_room_player | (roomId, playerId) UNIQUE | Prevent duplicate joins |
| Game | idx_game_room | roomId | Find games for a room |
| Round | ux_round_game_number | (gameId, roundNumber) UNIQUE | Prevent duplicate rounds |
| Answer | ux_answer_round_player_cat | (roundId, playerId, category) UNIQUE | One answer per category per player |
| GameHistory | ux_history_game_player | (gameId, playerId) UNIQUE | One result per player per game |
| PlayerStats | ux_stats_player | playerId (UNIQUE) | One stats record per player |

## Enums

| Enum | Values |
|------|--------|
| RoomStatus | WAITING, LOBBY, IN_GAME, FINISHED |
| GameStatus | WAITING, ROUND_STARTING, ROUND_ACTIVE, ROUND_REVIEW, NEXT_ROUND, GAME_FINISHED |
| RoundStatus | PENDING, ACTIVE, COMPLETED |
| Category | NAME, PLACE, THING, ANIMAL, PROFESSION |
