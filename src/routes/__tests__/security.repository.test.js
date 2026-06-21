const jwt = require('jsonwebtoken');

describe('SecurityRepository', () => {
  let SecurityRepository;
  let repo;

  beforeAll(() => {
    SecurityRepository = require('../../repositories/security.repository');
  });

  beforeEach(() => {
    repo = new SecurityRepository();
  });

  describe('hash', () => {
    it('should hash a string', async () => {
      const hashed = await repo.hash('myPassword123');
      expect(hashed).toBeDefined();
      expect(typeof hashed).toBe('string');
      expect(hashed).not.toBe('myPassword123');
    });

    it('should produce different hashes for the same input', async () => {
      const h1 = await repo.hash('samepassword');
      const h2 = await repo.hash('samepassword');
      expect(h1).not.toBe(h2);
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching password', async () => {
      const hashed = await repo.hash('correctPassword');
      const result = await repo.comparePassword('correctPassword', hashed);
      expect(result).toBe(true);
    });

    it('should return false for wrong password', async () => {
      const hashed = await repo.hash('correctPassword');
      const result = await repo.comparePassword('wrongPassword', hashed);
      expect(result).toBe(false);
    });
  });

  describe('assignJwt', () => {
    it('should sign a valid JWT access token', () => {
      const payload = { id: 'user123', email: 'test@test.com' };
      const token = repo.assignJwt(payload, '1h');

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_test_key_only');
      expect(decoded.id).toBe('user123');
      expect(decoded.email).toBe('test@test.com');
    });

    it('should respect custom TTL', () => {
      const payload = { id: '1' };
      const tokenShort = repo.assignJwt(payload, '1s');
      const tokenDefault = repo.assignJwt(payload, null);

      expect(tokenShort).toBeDefined();
      expect(tokenDefault).toBeDefined();
    });
  });

  describe('assignRefreshJwt', () => {
    it('should sign a valid JWT refresh token', () => {
      const payload = { id: 'user123' };
      const token = repo.assignRefreshJwt(payload, '7d');

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_key');
      expect(decoded.id).toBe('user123');
    });
  });
});

describe('verifyJwt (standalone export)', () => {
  let mod;

  beforeAll(() => {
    mod = require('../../repositories/security.repository');
  });

  it('should verify a valid access token', () => {
    const token = jwt.sign(
      { id: 'abc' },
      process.env.JWT_SECRET || 'super_secret_test_key_only',
      { expiresIn: '1h' }
    );

    const decoded = mod.verifyJwt(token);
    expect(decoded.id).toBe('abc');
  });

  it('should throw on invalid signature', () => {
    const token = jwt.sign({ id: 'abc' }, 'wrong-secret', { expiresIn: '1h' });
    expect(() => mod.verifyJwt(token)).toThrow();
  });

  it('should throw on expired token', () => {
    const token = jwt.sign(
      { id: 'abc' },
      process.env.JWT_SECRET || 'super_secret_test_key_only',
      { expiresIn: '0s' }
    );
    expect(() => mod.verifyJwt(token)).toThrow();
  });
});

describe('verifyRefreshJwt (standalone export)', () => {
  let mod;

  beforeAll(() => {
    mod = require('../../repositories/security.repository');
  });

  it('should verify a valid refresh token', () => {
    const token = jwt.sign(
      { id: 'abc' },
      process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_key',
      { expiresIn: '7d' }
    );

    const decoded = mod.verifyRefreshJwt(token);
    expect(decoded.id).toBe('abc');
  });

  it('should throw on invalid refresh secret', () => {
    const token = jwt.sign({ id: 'abc' }, 'wrong-refresh-secret', { expiresIn: '7d' });
    expect(() => mod.verifyRefreshJwt(token)).toThrow();
  });
});
