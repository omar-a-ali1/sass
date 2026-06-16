const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const mockUserDoc = {
  _id: '507f1f77bcf86cd799439011',
  name: 'Test User',
  email: 'test@example.com',
  password: '',
  __v: 0,
};

const mockModel = {
  findOne: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  lean: jest.fn(),
};

mockModel.findOne.mockReturnValue(mockModel);
mockModel.findById.mockReturnValue(mockModel);
mockModel.lean.mockResolvedValue(null);

function MockSchema(def) { this.def = def; }
MockSchema.prototype.pre = function () { return this; };
MockSchema.prototype.post = function () { return this; };
MockSchema.prototype.methods = function () { return this; };
MockSchema.prototype.statics = function () { return this; };
MockSchema.prototype.virtual = function () { return this; };
MockSchema.prototype.index = function () { return this; };
MockSchema.prototype.plugin = function () { return this; };

jest.mock('mongoose', () => ({
  Schema: MockSchema,
  model: jest.fn().mockReturnValue(mockModel),
}));

describe('Auth Integration', () => {
  let app;
  let securityRepo;

  beforeAll(async () => {
    mockUserDoc.password = await bcrypt.hash('password123', 12);
    app = require('../app');
    const container = require('../services/container');
    securityRepo = container.get('securityRepository');
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockModel.lean.mockResolvedValue(null);
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      mockModel.lean.mockResolvedValue(null);
      mockModel.create.mockResolvedValue({
        _id: 'new-id',
        name: 'Jane',
        email: 'jane@test.com',
        password: 'hashed',
        __v: 0,
        toObject: () => ({ _id: 'new-id', name: 'Jane', email: 'jane@test.com' }),
      });

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ name: 'Jane', email: 'jane@test.com', password: 'password123' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Jane');
      expect(res.body.data.email).toBe('jane@test.com');
      expect(res.body.data).not.toHaveProperty('password');
    });

    it('should return 400 for invalid payload', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ name: 'J', email: 'not-an-email' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toHaveProperty('fields');
    });

    it('should return 409 when email already exists', async () => {
      mockModel.lean.mockResolvedValue({ _id: 'existing', email: 'dup@test.com' });

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ name: 'Dup', email: 'dup@test.com', password: 'password123' });

      expect(res.status).toBe(409);
      expect(res.body.error.message).toMatch(/already registered/i);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login with valid credentials', async () => {
      mockModel.lean.mockResolvedValue({ ...mockUserDoc });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
      expect(res.body.data.user.email).toBe('test@example.com');
    });

    it('should return 401 with wrong password', async () => {
      mockModel.lean.mockResolvedValue({ ...mockUserDoc });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'test@example.com', password: 'wrongpassword' });

      expect(res.status).toBe(401);
      expect(res.body.error.message).toMatch(/invalid email or password/i);
    });

    it('should return 401 for non-existent user', async () => {
      mockModel.lean.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'nobody@test.com', password: 'password123' });

      expect(res.status).toBe(401);
      expect(res.body.error.message).toMatch(/invalid email or password/i);
    });

    it('should return 400 for missing fields', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toHaveProperty('fields');
    });
  });

  describe('POST /api/v1/auth/refresh-token', () => {
    it('should return a new token pair with a valid refresh token', async () => {
      const refreshToken = securityRepo.assignRefreshJwt(
        { id: mockUserDoc._id, email: mockUserDoc.email },
        '7d'
      );

      mockModel.lean.mockResolvedValue({ ...mockUserDoc });

      const res = await request(app)
        .post('/api/v1/auth/refresh-token')
        .send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
      expect(res.body.data.accessToken).not.toBe(refreshToken);
    });

    it('should return 401 with an expired refresh token', async () => {
      const expiredToken = jwt.sign(
        { id: mockUserDoc._id },
        process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_key',
        { expiresIn: '0s' }
      );

      const res = await request(app)
        .post('/api/v1/auth/refresh-token')
        .send({ refreshToken: expiredToken });

      expect(res.status).toBe(401);
      expect(res.body.error.message).toMatch(/invalid or expired refresh token/i);
    });

    it('should return 400 when no refresh token is provided', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh-token')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toHaveProperty('fields');
    });
  });

  describe('GET / — root endpoint', () => {
    it('should return the status message', async () => {
      const res = await request(app).get('/');
      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/SASS work/i);
    });
  });

  describe('404 fallback', () => {
    it('should return 404 for unknown routes', async () => {
      const res = await request(app).get('/nonexistent-route');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
