const http = require('http');
const express = require('express');

describe('ActivityLog Middleware', () => {
  let app;
  let server;
  let port;

  const makeRequest = (method = 'GET', path = '/') => {
    return new Promise((resolve, reject) => {
      const options = { hostname: '127.0.0.1', port, path, method };
      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try { resolve({ status: res.statusCode, body: JSON.parse(body) }); }
          catch { resolve({ status: res.statusCode, body }); }
        });
      });
      req.on('error', reject);
      req.end();
    });
  };

  afterEach((done) => {
    if (server) { server.close(done); server = null; }
    else done();
  });

  it('should attach activityLog middleware without crashing', async () => {
    app = express();
    app.use(require('../../middlewares/activityLog'));
    app.get('/test', (req, res) => res.json({ ok: true }));

    await new Promise((resolve) => { server = app.listen(0, () => { port = server.address().port; resolve(); }); });

    const r = await makeRequest('GET', '/test');
    expect(r.status).toBe(200);
    expect(r.body.ok).toBe(true);
  });
});

describe('ActivityLogService', () => {
  let ActivityLogService;

  beforeAll(() => {
    ActivityLogService = require('../../services/activityLogService');
  });

  it('should be a class', () => {
    expect(typeof ActivityLogService).toBe('function');
  });

  it('should create an instance with repo injection', () => {
    const mockRepo = {
      create: jest.fn().mockResolvedValue({ _id: 'log-1', action: 'create' }),
      paginate: jest.fn().mockResolvedValue({ data: [], total: 0 }),
      findByActor: jest.fn(),
    };
    const service = new ActivityLogService({ activityLogRepository: mockRepo });

    expect(service).toBeInstanceOf(ActivityLogService);
    expect(service.repo).toBe(mockRepo);
  });

  it('should call repo.create on log()', async () => {
    const mockRepo = { create: jest.fn().mockResolvedValue({ _id: 'log-1' }) };
    const service = new ActivityLogService({ activityLogRepository: mockRepo });

    const entry = { action: 'create', resource: 'user', resourceId: '123' };
    const result = await service.log(entry);

    expect(mockRepo.create).toHaveBeenCalledWith(entry);
    expect(result._id).toBe('log-1');
  });

  it('should delegate list to repo.paginate', async () => {
    const mockRepo = { paginate: jest.fn().mockResolvedValue({ data: [], total: 0 }) };
    const service = new ActivityLogService({ activityLogRepository: mockRepo });

    const result = await service.list({ action: 'create' }, { page: 1, limit: 10 });

    expect(mockRepo.paginate).toHaveBeenCalledWith({ action: 'create' }, { page: 1, limit: 10 });
    expect(result.total).toBe(0);
  });
});

describe('ActivityLogRepository', () => {
  let ActivityLogRepository;

  beforeAll(() => {
    ActivityLogRepository = require('../../repositories/activityLog.repository');
  });

  it('should be a class', () => {
    expect(typeof ActivityLogRepository).toBe('function');
  });

  it('should delegate create to dbStrategy', async () => {
    const mockDb = { create: jest.fn().mockResolvedValue({ _id: '1' }) };
    const repo = new ActivityLogRepository({ dbStrategy: mockDb });

    const result = await repo.create({ action: 'read' });

    expect(mockDb.create).toHaveBeenCalledWith('ActivityLog', { action: 'read' });
    expect(result._id).toBe('1');
  });

  it('should delegate paginate to dbStrategy', async () => {
    const mockDb = { paginate: jest.fn().mockResolvedValue({ data: [], total: 0 }) };
    const repo = new ActivityLogRepository({ dbStrategy: mockDb });

    const result = await repo.paginate({ action: 'create' }, { page: 1 });

    expect(mockDb.paginate).toHaveBeenCalledWith('ActivityLog', { action: 'create' }, { page: 1 });
    expect(result.total).toBe(0);
  });

  it('should delegate findByActor to paginate', async () => {
    const mockDb = { paginate: jest.fn().mockResolvedValue({ data: [], total: 0 }) };
    const repo = new ActivityLogRepository({ dbStrategy: mockDb });

    await repo.findByActor('user-1', { page: 1, limit: 5 });

    expect(mockDb.paginate).toHaveBeenCalledWith('ActivityLog', { actor: 'user-1' }, { page: 1, limit: 5 });
  });

  it('should delegate findByResource to paginate', async () => {
    const mockDb = { paginate: jest.fn().mockResolvedValue({ data: [], total: 0 }) };
    const repo = new ActivityLogRepository({ dbStrategy: mockDb });

    await repo.findByResource('user', 'user-123', { page: 1 });

    expect(mockDb.paginate).toHaveBeenCalledWith('ActivityLog', { resource: 'user', resourceId: 'user-123' }, { page: 1 });
  });

  it('should delegate findByAction to paginate', async () => {
    const mockDb = { paginate: jest.fn().mockResolvedValue({ data: [], total: 0 }) };
    const repo = new ActivityLogRepository({ dbStrategy: mockDb });

    await repo.findByAction('create', { page: 1 });

    expect(mockDb.paginate).toHaveBeenCalledWith('ActivityLog', { action: 'create' }, { page: 1 });
  });
});
