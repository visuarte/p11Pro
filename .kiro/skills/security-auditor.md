# Security Auditor Skill

## Description

Enables the agent to review code for security vulnerabilities, validate encryption implementations, audit authentication mechanisms, and ensure compliance with security best practices.

## Capabilities

- Identify common vulnerabilities (OWASP Top 10)
- Review encryption implementations (AES-256)
- Audit authentication and authorization
- Detect SQL injection vulnerabilities
- Identify XSS vulnerabilities
- Review input validation
- Check for hardcoded secrets
- Validate secure communication (HTTPS)
- Review error handling for information leakage
- Audit logging and monitoring

## When to Activate

- Reviewing new code for security issues
- Validating encryption implementations
- Auditing authentication flows
- Before deploying to production
- After security incidents
- During code reviews
- When handling sensitive data

## Security Checklist

### Input Validation
```typescript
// ✅ GOOD: Validate and sanitize
function createUser(email: string) {
  if (!isValidEmail(email)) {
    throw new ValidationError('Invalid email');
  }
  const sanitized = sanitizeInput(email);
  return db.query('INSERT INTO users (email) VALUES ($1)', [sanitized]);
}

// ❌ BAD: No validation
function createUser(email: string) {
  return db.query(`INSERT INTO users (email) VALUES ('${email}')`);
}
```

### SQL Injection Prevention
```typescript
// ✅ GOOD: Parameterized query
const user = await db.query('SELECT * FROM users WHERE id = $1', [userId]);

// ❌ BAD: String concatenation
const user = await db.query(`SELECT * FROM users WHERE id = '${userId}'`);
```

### XSS Prevention
```typescript
// ✅ GOOD: Sanitize output
import DOMPurify from 'dompurify';
element.innerHTML = DOMPurify.sanitize(userInput);

// ❌ BAD: Direct rendering
element.innerHTML = userInput;
```

### Secrets Management
```typescript
// ✅ GOOD: Use environment variables
const apiKey = process.env.API_KEY;

// ❌ BAD: Hardcoded secret
const apiKey = 'sk-1234567890abcdef';
```

### Encryption
```typescript
// ✅ GOOD: AES-256-GCM
const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

// ❌ BAD: Weak encryption
const cipher = crypto.createCipheriv('des', key, iv);
```

## OWASP Top 10

1. Broken Access Control
2. Cryptographic Failures
3. Injection
4. Insecure Design
5. Security Misconfiguration
6. Vulnerable Components
7. Authentication Failures
8. Software and Data Integrity Failures
9. Security Logging Failures
10. Server-Side Request Forgery

## Best Practices

1. Never trust user input
2. Use parameterized queries
3. Implement proper authentication
4. Encrypt sensitive data
5. Use HTTPS in production
6. Keep dependencies updated
7. Implement rate limiting
8. Log security events
9. Handle errors securely
10. Regular security audits

## References

- OWASP: https://owasp.org/
- Node.js Security: https://nodejs.org/en/docs/guides/security/
- CWE Top 25: https://cwe.mitre.org/top25/
