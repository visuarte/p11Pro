---
inclusion: fileMatch
fileMatchPattern: "**/thunderkoli/**"
---

# ThunderKoli - Security & Audit Guidelines

## Overview

ThunderKoli is the security and audit module of KoliCode. It provides:
- **Vault**: AES-256-GCM encryption for sensitive data
- **Audit Trail**: Complete logging of all user actions
- **Authentication**: Multi-provider (Google + WhatsApp)
- **Identity Management**: User sessions and permissions

## Vault Implementation (AES-256)

### Encryption Pattern

```typescript
import crypto from 'crypto';

class VaultService {
  private algorithm = 'aes-256-gcm';
  
  encrypt(data: string, key: Buffer): EncryptedData {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, key, iv);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }
  
  decrypt(encryptedData: EncryptedData, key: Buffer): string {
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      key,
      Buffer.from(encryptedData.iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
```

### Key Management

```typescript
// Generate project-specific keys using PBKDF2
function generateKey(projectId: string, masterPassword: string): Buffer {
  return crypto.pbkdf2Sync(
    masterPassword,
    projectId,
    100000, // iterations
    32,     // key length
    'sha512'
  );
}

// Rotate keys every 30 days
function shouldRotateKey(lastRotation: Date): boolean {
  const daysSinceRotation = (Date.now() - lastRotation.getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceRotation >= 30;
}
```

## Audit Trail Implementation

### Audit Log Structure

```typescript
interface AuditLog {
  id: string;
  userId: string;
  action: AuditAction;
  resource: string;
  timestamp: string; // ISO 8601
  inputHash: string; // SHA-256 of input
  outputHash: string; // SHA-256 of output
  status: 'success' | 'error';
  metadata: Record<string, any>;
}

type AuditAction = 
  | 'code-gen'
  | 'canvas-edit'
  | 'render'
  | 'pose-transform'
  | 'vault-access'
  | 'auth-attempt'
  | 'file-download';
```

### Logging Pattern

```typescript
class AuditService {
  async log(entry: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void> {
    const auditLog: AuditLog = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      ...entry
    };
    
    // Write to database
    await db.auditLogs.insert(auditLog);
    
    // Also write to file for redundancy
    await fs.appendFile(
      'logs/audit.log',
      JSON.stringify(auditLog) + '\n'
    );
  }
  
  async getTimeline(projectId: string): Promise<AuditLog[]> {
    return db.auditLogs
      .where('resource', 'like', `%${projectId}%`)
      .orderBy('timestamp', 'desc')
      .limit(1000);
  }
}
```

## Authentication Patterns

### Google OAuth

```typescript
import { OAuth2Client } from 'google-auth-library';

class GoogleAuthService {
  private client: OAuth2Client;
  
  constructor() {
    this.client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }
  
  async verifyToken(token: string): Promise<UserInfo> {
    const ticket = await this.client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    
    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture
    };
  }
}
```

### WhatsApp Authentication

```typescript
import { Client } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';

class WhatsAppAuthService {
  private client: Client;
  
  async initialize(): Promise<void> {
    this.client = new Client({
      authStrategy: new LocalAuth({
        dataPath: '.wwebjs_auth'
      })
    });
    
    this.client.on('qr', (qr) => {
      qrcode.generate(qr, { small: true });
    });
    
    this.client.on('ready', () => {
      console.log('WhatsApp client ready');
    });
    
    await this.client.initialize();
  }
}
```

## Security Checklist

### Before Committing Code

- [ ] No hardcoded secrets (API keys, passwords, tokens)
- [ ] All user input validated and sanitized
- [ ] SQL queries use parameterized statements
- [ ] Sensitive data encrypted before storage
- [ ] Audit logs created for sensitive operations
- [ ] Error messages don't leak sensitive information
- [ ] Authentication required for protected endpoints
- [ ] Rate limiting implemented on auth endpoints

### Vault Usage

```typescript
// ✅ GOOD: Encrypt before storing
const encrypted = vaultService.encrypt(sensitiveData, projectKey);
await db.secrets.insert({ data: encrypted });

// ❌ BAD: Storing plaintext
await db.secrets.insert({ data: sensitiveData });
```

### Audit Logging

```typescript
// ✅ GOOD: Log all sensitive operations
await auditService.log({
  userId: user.id,
  action: 'vault-access',
  resource: `project/${projectId}`,
  inputHash: hash(input),
  outputHash: hash(output),
  status: 'success',
  metadata: { operation: 'decrypt' }
});

// ❌ BAD: No logging
const decrypted = vaultService.decrypt(data, key);
```

## Common Vulnerabilities to Avoid

### SQL Injection

```typescript
// ✅ GOOD: Parameterized query
const user = await db.query(
  'SELECT * FROM users WHERE email = ?',
  [email]
);

// ❌ BAD: String concatenation
const user = await db.query(
  `SELECT * FROM users WHERE email = '${email}'`
);
```

### XSS Prevention

```typescript
// ✅ GOOD: Sanitize output
import DOMPurify from 'dompurify';
const clean = DOMPurify.sanitize(userInput);

// ❌ BAD: Direct rendering
element.innerHTML = userInput;
```

### Timing Attacks

```typescript
// ✅ GOOD: Constant-time comparison
import crypto from 'crypto';
const isValid = crypto.timingSafeEqual(
  Buffer.from(hash1),
  Buffer.from(hash2)
);

// ❌ BAD: Direct comparison
const isValid = hash1 === hash2;
```

## Environment Variables

Required `.env` variables for ThunderKoli:

```bash
# Encryption
VAULT_MASTER_PASSWORD=<strong-password>

# Google OAuth
GOOGLE_CLIENT_ID=<client-id>
GOOGLE_CLIENT_SECRET=<client-secret>
GOOGLE_REDIRECT_URI=http://localhost:3001/auth/google/callback

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/unified_db

# Redis
REDIS_URL=redis://localhost:6379

# Session
SESSION_SECRET=<random-secret>
```

## Testing Security

```typescript
describe('VaultService', () => {
  it('should encrypt and decrypt data correctly', () => {
    const data = 'sensitive information';
    const key = generateKey('project-1', 'master-password');
    
    const encrypted = vaultService.encrypt(data, key);
    const decrypted = vaultService.decrypt(encrypted, key);
    
    expect(decrypted).toBe(data);
    expect(encrypted.encrypted).not.toBe(data);
  });
  
  it('should fail with wrong key', () => {
    const data = 'sensitive information';
    const key1 = generateKey('project-1', 'password1');
    const key2 = generateKey('project-1', 'password2');
    
    const encrypted = vaultService.encrypt(data, key1);
    
    expect(() => {
      vaultService.decrypt(encrypted, key2);
    }).toThrow();
  });
});
```

## References

- ThunderKoli Source: `backend/thunderkoli/src/`
- Vault Implementation: `backend/thunderkoli/src/services/vault/`
- Audit Service: `backend/thunderkoli/src/services/audit/`
- Auth Services: `backend/thunderkoli/src/services/auth/`
