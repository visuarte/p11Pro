# API Documentation - KoliCode

## Overview

KoliCode exposes a unified API through the API Gateway (Port 4000). All requests from the frontend go through the gateway, which routes them to appropriate microservices.

## Base URL

```
http://localhost:4000/api/v1
```

## Authentication

All endpoints require authentication via:
- **Google OAuth 2.0** - For web/desktop clients
- **WhatsApp** - For mobile notifications
- **Session Token** - For subsequent requests

## ThunderKoli Endpoints (Security & Audit)

### User Management

#### GET /users
List all users in the system.

**Response:**
```json
[
  {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "Developer",
    "avatar": "https://i.pravatar.cc/150?u=john",
    "bio": "Full-stack developer"
  }
]
```

**Status Codes:**
- `200` - Success
- `500` - Database error

---

#### POST /users
Create a new user.

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "role": "Designer",
  "avatar": "https://i.pravatar.cc/150?u=jane",
  "bio": "UI/UX Designer"
}
```

**Response:**
```json
{
  "id": 2,
  "name": "Jane Smith",
  "email": "jane@example.com",
  "role": "Designer",
  "avatar": "https://i.pravatar.cc/150?u=jane",
  "bio": "UI/UX Designer"
}
```

**Status Codes:**
- `201` - Created
- `400` - Missing required fields
- `500` - Server error

---

#### DELETE /users/:id
Delete a user by ID.

**Response:**
```json
{
  "message": "Usuario eliminado correctamente.",
  "id": 1
}
```

**Status Codes:**
- `200` - Success
- `404` - User not found
- `500` - Server error

---

#### GET /users/:id/documents
Get documents associated with a user (DMS - Document Management System).

**Response:**
```json
[
  {
    "id": 101,
    "title": "CV_Resumen_Tecnico.pdf",
    "type": "CURRICULUM",
    "date": "2026-01-15",
    "tags": ["OFICIAL", "VERIFICADO"],
    "status": "PROCESSED"
  }
]
```

**Status Codes:**
- `200` - Success
- `404` - User not found

---

#### GET /users/:id/update
Update user profile.

**Query Parameters:**
```
?name=NewName&bio=NewBio&role=NewRole
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "NewName",
    "email": "john@example.com",
    "role": "NewRole",
    "bio": "NewBio"
  }
}
```

**Status Codes:**
- `200` - Success
- `404` - User not found
- `500` - Server error

---

### Identity & QR

#### GET /users/:id/qr
Generate QR code for user identity verification.

**Response:**
```json
{
  "userId": 1,
  "userName": "John Doe",
  "qr": "data:image/png;base64,...",
  "url": "http://localhost:3500/card/1?t=token&e=expiry",
  "expiresIn": "5m"
}
```

**Security:**
- Token expires in 5 minutes
- HMAC-SHA256 validation
- One-time use per generation

**Status Codes:**
- `200` - Success
- `404` - User not found
- `500` - Generation error

---

#### GET /card/:id
Sovereign landing page for verified identity (public endpoint).

**Query Parameters:**
```
?t=token&e=expiry
```

**Response:** HTML page with user identity card

**Security Checks:**
- Token validation (HMAC-SHA256)
- Expiry validation (5 minutes)
- Audit logging on access

**Status Codes:**
- `200` - Success
- `401` - Invalid or missing token
- `403` - Token expired
- `404` - User not found

---

### Agent & AI Processing

#### POST /agent/interact
Process a prompt through ThunderEngine (AI processing).

**Request Body:**
```json
{
  "prompt": "Generate a React component for user authentication",
  "mode": "internal",
  "role": "default",
  "userState": "directo"
}
```

**Response:**
```json
{
  "id": "1234567890-agent",
  "agent": "ThunderKoli Agent v1.0",
  "message": "Generated component code...",
  "context": {
    "meta": { "goal": "Code Generation" },
    "steps": []
  },
  "mode": "internal",
  "role": "default",
  "mcp": "ThunderCore Engine",
  "timestamp": "2026-04-21T10:30:00Z"
}
```

**Status Codes:**
- `200` - Success
- `400` - Missing prompt
- `500` - Engine error

---

#### GET /agent/config
Get current system configuration.

**Response:**
```json
{
  "provider": "ollama",
  "ollama_model": "deepseek-coder:1.3b",
  "deepseek_model": "deepseek-chat",
  "whatsapp_busy_mode": false,
  "sync_interval": 3600,
  "hasDeepseekKey": false,
  "hasGoogleConfig": true,
  "google_client_id": "masked",
  "whatsapp_status": "READY"
}
```

**Status Codes:**
- `200` - Success

---

#### POST /agent/config/keys
Configure API keys (DeepSeek, Google).

**Request Body:**
```json
{
  "key": "api_key_here",
  "google_client_id": "client_id_here",
  "google_client_secret": "client_secret_here",
  "ollama_model": "deepseek-coder:1.3b"
}
```

**Response:**
```json
{
  "message": "Configuración actualizada y guardada correctamente.",
  "settings": {}
}
```

**Status Codes:**
- `200` - Success
- `400` - Invalid fields
- `401` - Invalid API key

---

#### POST /agent/config/provider
Switch AI provider (Ollama or DeepSeek).

**Request Body:**
```json
{
  "provider": "deepseek"
}
```

**Response:**
```json
{
  "message": "Proveedor cambiado a deepseek",
  "provider": "deepseek"
}
```

**Status Codes:**
- `200` - Success
- `400` - Invalid provider

---

### Conversation History

#### GET /agent/history
Get conversation history.

**Response:**
```json
[
  {
    "id": "1234567890-user",
    "role": "user",
    "text": "Generate a React component",
    "timestamp": "2026-04-21T10:30:00Z"
  }
]
```

**Status Codes:**
- `200` - Success

---

#### DELETE /agent/history/all
Clear entire conversation history.

**Response:**
```json
{
  "message": "Historial completo eliminado."
}
```

**Status Codes:**
- `200` - Success

---

#### DELETE /agent/history/:id
Delete specific message.

**Response:**
```json
{
  "message": "Mensaje eliminado."
}
```

**Status Codes:**
- `200` - Success

---

#### POST /agent/history/save/:id
Save message to Vault (encrypted storage).

**Response:**
```json
{
  "message": "Guardado con éxito",
  "fileName": "message_title_2026-04-21.md"
}
```

**Status Codes:**
- `200` - Success
- `404` - Message not found
- `500` - Vault error

---

#### POST /agent/history/delete-bulk
Delete multiple messages.

**Request Body:**
```json
{
  "ids": ["id1", "id2", "id3"]
}
```

**Response:**
```json
{
  "message": "Mensajes eliminados en bloque."
}
```

**Status Codes:**
- `200` - Success
- `400` - Invalid IDs format

---

### Background Tasks

#### GET /agent/tasks
Get active tasks and notifications.

**Response:**
```json
{
  "tasks": [
    {
      "id": 1234567890,
      "type": "scout",
      "target": "React Developer",
      "status": "RUNNING",
      "progress": 45,
      "startTime": "2026-04-21T10:30:00Z"
    }
  ],
  "notifications": []
}
```

**Status Codes:**
- `200` - Success

---

#### POST /agent/tasks/spawn
Create new background task.

**Request Body:**
```json
{
  "type": "scout",
  "target": "React Developer"
}
```

**Response:**
```json
{
  "id": 1234567890,
  "type": "scout",
  "target": "React Developer",
  "status": "RUNNING",
  "progress": 0,
  "startTime": "2026-04-21T10:30:00Z"
}
```

**Status Codes:**
- `201` - Created

---

#### DELETE /agent/tasks/clear-notifications
Clear all notifications.

**Response:**
```json
{
  "message": "Notificaciones despejadas."
}
```

**Status Codes:**
- `200` - Success

---

### Authentication

#### GET /auth/google/url
Get Google OAuth authentication URL.

**Response:**
```json
{
  "url": "https://accounts.google.com/o/oauth2/v2/auth?..."
}
```

**Status Codes:**
- `200` - Success
- `500` - Configuration error

---

#### GET /auth/google/callback
Google OAuth callback endpoint.

**Query Parameters:**
```
?code=authorization_code
```

**Response:** HTML confirmation page

**Status Codes:**
- `200` - Success
- `500` - Authentication error

---

### WhatsApp Integration

#### GET /whatsapp/status
Get WhatsApp connection status.

**Response:**
```json
{
  "status": "READY",
  "connected": true,
  "phoneNumber": "+1234567890"
}
```

**Status Codes:**
- `200` - Success

---

#### POST /whatsapp/logout
Logout from WhatsApp.

**Response:**
```json
{
  "message": "Sesión cerrada."
}
```

**Status Codes:**
- `200` - Success

---

### System Status

#### GET /core/status
Get overall system status.

**Response:**
```json
{
  "isConfigured": true,
  "google": true,
  "whatsapp": "READY"
}
```

**Status Codes:**
- `200` - Success

---

#### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-04-21T10:30:00Z"
}
```

**Status Codes:**
- `200` - Healthy

---

## Error Response Format

All errors follow this standard format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {},
    "timestamp": "2026-04-21T10:30:00Z"
  }
}
```

## Rate Limiting

- Authentication endpoints: 5 requests per minute per IP
- General endpoints: 100 requests per minute per user
- File upload: 10 requests per minute per user

## Security Headers

All responses include:
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
```

## Versioning

Current API version: **v1**

---

**Last Updated:** 2026-04-21  
**API Version:** 1.0.0
