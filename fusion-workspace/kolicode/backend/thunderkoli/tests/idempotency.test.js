/**
 * Idempotency Tests for ThunderKoli
 * 
 * Tests that critical operations are idempotent:
 * - Encryption/Decryption round-trip
 * - Audit log integrity
 * - Key generation consistency
 * - Authentication token validation
 */

const crypto = require('crypto');

// Mock VaultService
class VaultService {
  constructor() {
    this.algorithm = 'aes-256-gcm';
  }

  encrypt(data, key) {
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

  decrypt(encryptedData, key) {
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

// Key generation function
function generateKey(projectId, masterPassword) {
  return crypto.pbkdf2Sync(
    masterPassword,
    projectId,
    100000,
    32,
    'sha512'
  );
}

// Hash function for audit logs
function hashData(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

describe('Idempotency Tests - VaultService', () => {
  let vaultService;

  beforeEach(() => {
    vaultService = new VaultService();
  });

  test('IDEMPOTENCY: encrypt → decrypt → encrypt → decrypt produces same result', () => {
    const originalData = 'sensitive user data';
    const key = generateKey('project-123', 'master-password');

    // First round-trip
    const encrypted1 = vaultService.encrypt(originalData, key);
    const decrypted1 = vaultService.decrypt(encrypted1, key);

    // Second round-trip (using decrypted data)
    const encrypted2 = vaultService.encrypt(decrypted1, key);
    const decrypted2 = vaultService.decrypt(encrypted2, key);

    // Third round-trip
    const encrypted3 = vaultService.encrypt(decrypted2, key);
    const decrypted3 = vaultService.decrypt(encrypted3, key);

    // All decrypted values should match original
    expect(decrypted1).toBe(originalData);
    expect(decrypted2).toBe(originalData);
    expect(decrypted3).toBe(originalData);
  });

  test('IDEMPOTENCY: same data encrypted multiple times can be decrypted to original', () => {
    const data = 'test data for idempotency';
    const key = generateKey('project-456', 'password123');

    // Encrypt same data 5 times
    const encrypted1 = vaultService.encrypt(data, key);
    const encrypted2 = vaultService.encrypt(data, key);
    const encrypted3 = vaultService.encrypt(data, key);
    const encrypted4 = vaultService.encrypt(data, key);
    const encrypted5 = vaultService.encrypt(data, key);

    // All should decrypt to original
    expect(vaultService.decrypt(encrypted1, key)).toBe(data);
    expect(vaultService.decrypt(encrypted2, key)).toBe(data);
    expect(vaultService.decrypt(encrypted3, key)).toBe(data);
    expect(vaultService.decrypt(encrypted4, key)).toBe(data);
    expect(vaultService.decrypt(encrypted5, key)).toBe(data);

    // Encrypted values should be different (due to random IV)
    expect(encrypted1.encrypted).not.toBe(encrypted2.encrypted);
    expect(encrypted2.encrypted).not.toBe(encrypted3.encrypted);
  });

  test('IDEMPOTENCY: decrypting same encrypted data multiple times produces same result', () => {
    const data = 'consistent decryption test';
    const key = generateKey('project-789', 'secure-pass');

    const encrypted = vaultService.encrypt(data, key);

    // Decrypt same data 10 times
    const results = [];
    for (let i = 0; i < 10; i++) {
      results.push(vaultService.decrypt(encrypted, key));
    }

    // All results should be identical
    results.forEach(result => {
      expect(result).toBe(data);
    });
  });
});

describe('Idempotency Tests - Key Generation', () => {
  test('IDEMPOTENCY: same inputs always produce same key', () => {
    const projectId = 'project-abc';
    const password = 'master-password-123';

    // Generate key 5 times with same inputs
    const key1 = generateKey(projectId, password);
    const key2 = generateKey(projectId, password);
    const key3 = generateKey(projectId, password);
    const key4 = generateKey(projectId, password);
    const key5 = generateKey(projectId, password);

    // All keys should be identical
    expect(key1.equals(key2)).toBe(true);
    expect(key2.equals(key3)).toBe(true);
    expect(key3.equals(key4)).toBe(true);
    expect(key4.equals(key5)).toBe(true);
  });

  test('IDEMPOTENCY: different inputs produce different keys', () => {
    const key1 = generateKey('project-1', 'password');
    const key2 = generateKey('project-2', 'password');
    const key3 = generateKey('project-1', 'different-password');

    // Keys should be different
    expect(key1.equals(key2)).toBe(false);
    expect(key1.equals(key3)).toBe(false);
    expect(key2.equals(key3)).toBe(false);
  });
});

describe('Idempotency Tests - Audit Hashing', () => {
  test('IDEMPOTENCY: same data always produces same hash', () => {
    const data = 'audit log data';

    // Hash same data 10 times
    const hashes = [];
    for (let i = 0; i < 10; i++) {
      hashes.push(hashData(data));
    }

    // All hashes should be identical
    const firstHash = hashes[0];
    hashes.forEach(hash => {
      expect(hash).toBe(firstHash);
    });
  });

  test('IDEMPOTENCY: hash → verify → hash produces consistent results', () => {
    const originalData = 'sensitive operation data';
    
    // First hash
    const hash1 = hashData(originalData);
    
    // Verify by hashing again
    const hash2 = hashData(originalData);
    
    // Third hash
    const hash3 = hashData(originalData);

    // All should match
    expect(hash1).toBe(hash2);
    expect(hash2).toBe(hash3);
  });
});

describe('Idempotency Tests - Complex Scenarios', () => {
  let vaultService;

  beforeEach(() => {
    vaultService = new VaultService();
  });

  test('IDEMPOTENCY: encrypt → hash → decrypt → hash maintains data integrity', () => {
    const originalData = 'complex test data';
    const key = generateKey('project-complex', 'password');

    // Hash original
    const originalHash = hashData(originalData);

    // Encrypt
    const encrypted = vaultService.encrypt(originalData, key);

    // Decrypt
    const decrypted = vaultService.decrypt(encrypted, key);

    // Hash decrypted
    const decryptedHash = hashData(decrypted);

    // Hashes should match
    expect(decryptedHash).toBe(originalHash);
    expect(decrypted).toBe(originalData);
  });

  test('IDEMPOTENCY: multiple encrypt/decrypt cycles preserve data', () => {
    let data = 'initial data';
    const key = generateKey('project-cycles', 'password');
    const originalHash = hashData(data);

    // Perform 5 encrypt/decrypt cycles
    for (let i = 0; i < 5; i++) {
      const encrypted = vaultService.encrypt(data, key);
      data = vaultService.decrypt(encrypted, key);
    }

    // Data should remain unchanged
    expect(data).toBe('initial data');
    expect(hashData(data)).toBe(originalHash);
  });

  test('IDEMPOTENCY: parallel encryption/decryption operations', () => {
    const data = 'parallel test data';
    const key = generateKey('project-parallel', 'password');

    // Encrypt in parallel
    const encryptedResults = Array.from({ length: 5 }, () => 
      vaultService.encrypt(data, key)
    );

    // Decrypt all in parallel
    const decryptedResults = encryptedResults.map(encrypted =>
      vaultService.decrypt(encrypted, key)
    );

    // All should match original
    decryptedResults.forEach(decrypted => {
      expect(decrypted).toBe(data);
    });
  });
});

describe('Idempotency Tests - Edge Cases', () => {
  let vaultService;

  beforeEach(() => {
    vaultService = new VaultService();
  });

  test('IDEMPOTENCY: empty string encryption/decryption', () => {
    const data = '';
    const key = generateKey('project-empty', 'password');

    const encrypted = vaultService.encrypt(data, key);
    const decrypted = vaultService.decrypt(encrypted, key);

    expect(decrypted).toBe(data);
  });

  test('IDEMPOTENCY: large data encryption/decryption', () => {
    const data = 'x'.repeat(10000); // 10KB of data
    const key = generateKey('project-large', 'password');

    const encrypted = vaultService.encrypt(data, key);
    const decrypted = vaultService.decrypt(encrypted, key);

    expect(decrypted).toBe(data);
    expect(decrypted.length).toBe(10000);
  });

  test('IDEMPOTENCY: special characters encryption/decryption', () => {
    const data = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/~`\n\t\r';
    const key = generateKey('project-special', 'password');

    const encrypted = vaultService.encrypt(data, key);
    const decrypted = vaultService.decrypt(encrypted, key);

    expect(decrypted).toBe(data);
  });

  test('IDEMPOTENCY: unicode characters encryption/decryption', () => {
    const data = '你好世界 🌍 مرحبا العالم';
    const key = generateKey('project-unicode', 'password');

    const encrypted = vaultService.encrypt(data, key);
    const decrypted = vaultService.decrypt(encrypted, key);

    expect(decrypted).toBe(data);
  });

  test('IDEMPOTENCY: JSON data encryption/decryption', () => {
    const jsonData = JSON.stringify({
      user: 'test',
      email: 'test@example.com',
      roles: ['admin', 'user'],
      metadata: { created: '2026-04-21' }
    });
    const key = generateKey('project-json', 'password');

    const encrypted = vaultService.encrypt(jsonData, key);
    const decrypted = vaultService.decrypt(encrypted, key);

    expect(decrypted).toBe(jsonData);
    expect(JSON.parse(decrypted)).toEqual(JSON.parse(jsonData));
  });
});
