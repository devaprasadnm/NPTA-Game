# NPTA — REST API Specification

## Base URL

- Development: `http://localhost:3001`
- Production: `https://npta-api.onrender.com`

## Authentication

All authenticated endpoints require a `Bearer` token in the `Authorization` header:
```
Authorization: Bearer <session-token>
```

---

## Endpoints

### Health

#### `GET /api/health`

**Response** `200 OK`
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2026-07-25T10:00:00.000Z",
    "uptime": 3600,
    "version": "1.0.0"
  }
}
```

---

### Auth

#### `POST /api/auth/guest`

Create a guest player session.

**Request Body**
```json
{
  "displayName": "Alice"
}
```

**Validation**
- `displayName`: 2-20 characters, alphanumeric/spaces/underscores/hyphens

**Response** `201 Created`
```json
{
  "success": true,
  "data": {
    "player": {
      "id": "uuid",
      "displayName": "Alice",
      "avatarUrl": null
    },
    "token": "uuid-session-token",
    "expiresAt": "2026-07-28T10:00:00.000Z"
  }
}
```

#### `GET /api/auth/session`

Validate current session token.

**Headers**: `Authorization: Bearer <token>`

**Response** `200 OK`
```json
{
  "success": true,
  "data": {
    "valid": true,
    "player": {
      "id": "uuid",
      "displayName": "Alice",
      "avatarUrl": null
    }
  }
}
```

---

## Error Responses

All errors follow this format:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable description"
  }
}
```

### Error Codes

| Code | Status | Description |
|------|--------|-------------|
| INVALID_SESSION | 401 | No or invalid session token |
| SESSION_EXPIRED | 401 | Session token has expired |
| INVALID_INPUT | 400 | Request body validation failed |
| INVALID_NAME | 400 | Display name doesn't meet requirements |
| ROOM_NOT_FOUND | 404 | Room with given code doesn't exist |
| NOT_FOUND | 404 | Resource not found |
| RATE_LIMITED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Server error |
