const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const mockUserDoc = {
  _id: '507f1f77bcf86cd799439011',
  name: 'Test User',
  email: 'test@example.com',
  role: 'user',
};

const mockModel = {
  findOne: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  create: jest.fn(),
  find: jest.fn(),
  sort: jest.fn(),
  skip: jest.fn(),
  limit: jest.fn(),
  lean: jest.fn(),
  countDocuments: jest.fn(),
};

mockModel.findOne.mockReturnValue(mockModel);
mockModel.findById.mockReturnValue(mockModel);
mockModel.findByIdAndUpdate.mockReturnValue(mockModel);
mockModel.find.mockReturnValue(mockModel);
mockModel.sort.mockReturnValue(mockModel);
mockModel.skip.mockReturnValue(mockModel);
mockModel.limit.mockReturnValue(mockModel);
mockModel.lean.mockResolvedValue(null);
mockModel.countDocuments.mockResolvedValue(0);

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

describe('Dynamic Routes — /api/v1/users', () => {
  let app;
  let securityRepo;
  let validToken;

  beforeAll(async () => {
    mockUserDoc.password = await bcrypt.hash('password123', 12);
    app = require('../app');
    const container = require('../services/container');
    securityRepo = container.get('securityRepository');
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockModel.lean.mockResolvedValue(null);

    validToken = securityRepo.assignJwt(
      { id: mockUserDoc._id, email: mockUserDoc.email, role: 'user' },
      '1h'
    );
  });

  it('GET /api/v1/users/:id — returns user when found', async () => {
    mockModel.lean.mockResolvedValue(mockUserDoc);

    const res = await request(app)
      .get(`/api/v1/users/${mockUserDoc._id}`)
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data._id).toBe(mockUserDoc._id);
    expect(res.body.data.email).toBe(mockUserDoc.email);
  });

  it('GET /api/v1/users/:id — returns 404 when user not found', async () => {
    const res = await request(app)
      .get('/api/v1/users/nonexistent-id')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(404);
    expect(res.body.error.message).toMatch(/user not found/i);
  });

  it('GET /api/v1/users/:id — returns 401 without auth header', async () => {
    const res = await request(app)
      .get(`/api/v1/users/${mockUserDoc._id}`);

    expect(res.status).toBe(401);
    expect(res.body.error.message).toMatch(/no token provided/i);
  });

  it('GET /api/v1/users/:id — respects different IDs in params', async () => {
    const differentId = '507f1f77bcf86cd799439099';
    const differentUser = { ...mockUserDoc, _id: differentId, email: 'other@test.com' };
    mockModel.lean.mockResolvedValue(differentUser);

    const res = await request(app)
      .get(`/api/v1/users/${differentId}`)
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe(differentId);
    expect(res.body.data.email).toBe('other@test.com');
  });

  it('GET /api/v1/users/ — supports query params with defaults', async () => {
    mockModel.lean.mockResolvedValue([]);
    mockModel.countDocuments.mockResolvedValue(0);

    const res = await request(app)
      .get('/api/v1/users/')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.meta.page).toBe(1);
    expect(res.body.meta.limit).toBe(20);
  });

  it('GET /api/v1/users/ — validates invalid query params', async () => {
    const res = await request(app)
      .get('/api/v1/users/?page=abc&limit=999')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toHaveProperty('fields');
  });

  it('GET /api/v1/users/ — passes custom query params', async () => {
    mockModel.lean.mockResolvedValue([]);
    mockModel.countDocuments.mockResolvedValue(0);

    const res = await request(app)
      .get('/api/v1/users/?page=3&limit=10&sort=asc&search=john')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.meta.page).toBe(3);
    expect(res.body.meta.limit).toBe(10);
  });
});
