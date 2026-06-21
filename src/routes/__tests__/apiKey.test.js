describe('ApiKeyService', () => {
  let ApiKeyService;
  let mockApiKeyRepository;
  let mockSecurityService;
  let service;

  beforeAll(() => {
    ApiKeyService = require('../../services/apiKeyService');
  });

  beforeEach(() => {
    mockApiKeyRepository = {
      findByPrefix: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      create: jest.fn(),
      updateLastUsed: jest.fn(),
      deactivate: jest.fn(),
    };

    mockSecurityService = {
      hashPassword: jest.fn(),
      comparePassword: jest.fn(),
    };

    service = new ApiKeyService({
      apiKeyRepository: mockApiKeyRepository,
      securityService: mockSecurityService,
    });
  });

  describe('generateKey', () => {
    it('should create a key with bcrypt hash and return raw key', async () => {
      const userId = 'user-123';
      const name = 'My Test Key';

      mockSecurityService.hashPassword.mockResolvedValue('$2b$10$hashed_value');
      mockApiKeyRepository.create.mockResolvedValue({
        _id: 'key-1',
        prefix: 'sass_a1b2c3d4',
        hashedKey: '$2b$10$hashed_value',
        name: 'My Test Key',
        user: userId,
        active: true,
        permissions: [],
        toObject: () => ({
          _id: 'key-1',
          prefix: 'sass_a1b2c3d4',
          hashedKey: '$2b$10$hashed_value',
          name: 'My Test Key',
          user: userId,
          active: true,
          permissions: [],
        }),
      });

      const result = await service.generateKey(userId, name);

      expect(result.rawKey).toMatch(/^sass_[a-f0-9]+$/);
      expect(result.apiKey.name).toBe('My Test Key');
      expect(result.apiKey.hashedKey).toBeUndefined();
      expect(mockSecurityService.hashPassword).toHaveBeenCalledWith(result.rawKey);
      expect(mockApiKeyRepository.create).toHaveBeenCalledWith({
        prefix: expect.any(String),
        hashedKey: '$2b$10$hashed_value',
        name: 'My Test Key',
        user: userId,
        permissions: [],
      });
    });

    it('should accept optional permissions', async () => {
      mockSecurityService.hashPassword.mockResolvedValue('hash');
      mockApiKeyRepository.create.mockResolvedValue({
        _id: 'key-2', prefix: 'sass_', hashedKey: 'hash',
        name: 'Admin Key', user: 'u1', active: true,
        permissions: ['read:users', 'write:users'],
        toObject: () => ({}),
      });

      await service.generateKey('u1', 'Admin Key', ['read:users', 'write:users']);

      expect(mockApiKeyRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ permissions: ['read:users', 'write:users'] })
      );
    });
  });

  describe('validateKey', () => {
    it('should return record for a valid active key', async () => {
      const rawKey = 'sass_a1b2c3d4e5f67890abcdef1234567890abcdef12';
      const prefix = rawKey.substring(0, 12);

      mockApiKeyRepository.findByPrefix.mockResolvedValue({
        _id: 'key-1',
        prefix,
        hashedKey: '$2b$10$stored_hash',
        name: 'My Key',
        user: 'user-123',
        active: true,
      });
      mockSecurityService.comparePassword.mockResolvedValue(true);

      const result = await service.validateKey(rawKey);

      expect(result).not.toBeNull();
      expect(result._id).toBe('key-1');
      expect(mockApiKeyRepository.findByPrefix).toHaveBeenCalledWith(prefix);
      expect(mockSecurityService.comparePassword).toHaveBeenCalledWith(rawKey, '$2b$10$stored_hash');
    });

    it('should return null for an unknown prefix', async () => {
      mockApiKeyRepository.findByPrefix.mockResolvedValue(null);

      const result = await service.validateKey('sass_unknown1234567890abcdef');

      expect(result).toBeNull();
    });

    it('should return null for an inactive key', async () => {
      mockApiKeyRepository.findByPrefix.mockResolvedValue({
        _id: 'key-1', prefix: 'sass_a1b2c3d4',
        hashedKey: 'hash', active: false,
      });

      const result = await service.validateKey('sass_a1b2c3d4...');
      expect(result).toBeNull();
      expect(mockSecurityService.comparePassword).not.toHaveBeenCalled();
    });

    it('should return null for a key with wrong secret', async () => {
      mockApiKeyRepository.findByPrefix.mockResolvedValue({
        _id: 'key-1', prefix: 'sass_a1b2c3d4',
        hashedKey: '$2b$10$stored_hash', active: true,
      });
      mockSecurityService.comparePassword.mockResolvedValue(false);

      const result = await service.validateKey('sass_a1b2c3d4wrongsecret');
      expect(result).toBeNull();
    });

    it('should return null for an expired key', async () => {
      const yesterday = new Date(Date.now() - 86400000);
      mockApiKeyRepository.findByPrefix.mockResolvedValue({
        _id: 'key-1', prefix: 'sass_a1b2c3d4',
        hashedKey: 'hash', active: true,
        expiresAt: yesterday,
      });
      mockSecurityService.comparePassword.mockResolvedValue(true);

      const result = await service.validateKey('sass_a1b2c3d4...');
      expect(result).toBeNull();
    });
  });

  describe('revokeKey', () => {
    it('should deactivate an existing key', async () => {
      mockApiKeyRepository.findById.mockResolvedValue({ _id: 'key-1', active: true });
      mockApiKeyRepository.deactivate.mockResolvedValue({ _id: 'key-1', active: false });

      const result = await service.revokeKey('key-1');

      expect(mockApiKeyRepository.deactivate).toHaveBeenCalledWith('key-1');
      expect(result.active).toBe(false);
    });

    it('should throw NotFoundError for missing key', async () => {
      mockApiKeyRepository.findById.mockResolvedValue(null);

      await expect(service.revokeKey('nonexistent')).rejects.toThrow('API key not found');
    });
  });

  describe('listKeys', () => {
    it('should return keys by user ID', async () => {
      const keys = [{ _id: 'k1', name: 'Key 1' }, { _id: 'k2', name: 'Key 2' }];
      mockApiKeyRepository.findByUserId.mockResolvedValue(keys);

      const result = await service.listKeys('user-123');

      expect(mockApiKeyRepository.findByUserId).toHaveBeenCalledWith('user-123');
      expect(result).toEqual(keys);
    });
  });
});
