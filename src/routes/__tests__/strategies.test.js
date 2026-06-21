const fs = require('fs');
const path = require('path');
const os = require('os');

describe('MongoStrategy', () => {
  let MongoStrategy;
  let strategy;
  let mockModel;

  beforeAll(() => {
    MongoStrategy = require('../../lib/strategies/database/mongo.strategy');
  });

  beforeEach(() => {
    mockModel = {
      findOne: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: '1', name: 'test' }) }),
      findById: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: '1', name: 'test' }) }),
      find: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([{ _id: '1' }, { _id: '2' }]) }),
      create: jest.fn().mockResolvedValue({ _id: 'new-id', name: 'created' }),
      findByIdAndUpdate: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: '1', name: 'updated' }) }),
      deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
      countDocuments: jest.fn().mockResolvedValue(5),
    };

    const mongoose = require('mongoose');
    mongoose.model = jest.fn().mockReturnValue(mockModel);

    strategy = new MongoStrategy();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should find one document by query', async () => {
    const result = await strategy.findOne('User', { email: 'test@test.com' });
    expect(mockModel.findOne).toHaveBeenCalledWith({ email: 'test@test.com' });
    expect(result).toEqual({ _id: '1', name: 'test' });
  });

  it('should find document by ID', async () => {
    const result = await strategy.findById('User', 'some-id');
    expect(mockModel.findById).toHaveBeenCalledWith('some-id');
    expect(result).toEqual({ _id: '1', name: 'test' });
  });

  it('should find documents with optional query', async () => {
    const result = await strategy.find('User', { active: true });
    expect(mockModel.find).toHaveBeenCalledWith({ active: true });
    expect(result).toHaveLength(2);

    const allResult = await strategy.find('User');
    expect(mockModel.find).toHaveBeenCalledWith({});
    expect(allResult).toHaveLength(2);
  });

  it('should create a document', async () => {
    const data = { name: 'New User', email: 'new@test.com' };
    const result = await strategy.create('User', data);
    expect(mockModel.create).toHaveBeenCalledWith(data);
    expect(result).toEqual({ _id: 'new-id', name: 'created' });
  });

  it('should update a document by ID', async () => {
    const data = { name: 'Updated' };
    const result = await strategy.findByIdAndUpdate('User', 'some-id', data);
    expect(mockModel.findByIdAndUpdate).toHaveBeenCalledWith('some-id', data, { new: true });
    expect(result).toEqual({ _id: '1', name: 'updated' });
  });

  it('should delete documents by query', async () => {
    const result = await strategy.deleteOne('User', { _id: 'some-id' });
    expect(mockModel.deleteOne).toHaveBeenCalledWith({ _id: 'some-id' });
    expect(result.deletedCount).toBe(1);
  });

  it('should count documents', async () => {
    const result = await strategy.count('User', { active: true });
    expect(mockModel.countDocuments).toHaveBeenCalledWith({ active: true });
    expect(result).toBe(5);

    const allResult = await strategy.count('User');
    expect(mockModel.countDocuments).toHaveBeenCalledWith({});
    expect(allResult).toBe(5);
  });
});

describe('LocalStorageStrategy', () => {
  let LocalStorageStrategy;
  let strategy;
  let tmpDir;

  beforeAll(() => {
    LocalStorageStrategy = require('../../lib/strategies/storage/localStorage.strategy');
  });

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sass-test-'));
    strategy = new LocalStorageStrategy({
      uploadDir: tmpDir,
      baseUrl: '/uploads',
    });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should create the upload directory on instantiation', () => {
    expect(fs.existsSync(tmpDir)).toBe(true);
  });

  it('should upload a file and return the key', async () => {
    const key = await strategy.upload('test/hello.txt', Buffer.from('Hello World'));
    expect(key).toBe('test/hello.txt');

    const filePath = path.join(tmpDir, 'test/hello.txt');
    expect(fs.existsSync(filePath)).toBe(true);
    expect(fs.readFileSync(filePath, 'utf-8')).toBe('Hello World');
  });

  it('should create nested directories during upload', async () => {
    await strategy.upload('a/b/c/deep.txt', 'deep content');
    expect(fs.existsSync(path.join(tmpDir, 'a/b/c/deep.txt'))).toBe(true);
  });

  it('should download a file', async () => {
    await strategy.upload('readme.md', Buffer.from('README content'));
    const content = await strategy.download('readme.md');
    expect(content.toString()).toBe('README content');
  });

  it('should delete a file', async () => {
    await strategy.upload('todelete.txt', 'will be deleted');
    const filePath = path.join(tmpDir, 'todelete.txt');
    expect(fs.existsSync(filePath)).toBe(true);

    await strategy.delete('todelete.txt');
    expect(fs.existsSync(filePath)).toBe(false);
  });

  it('should generate a public URL', () => {
    const url = strategy.getUrl('avatars/user1.jpg');
    expect(url).toBe('/uploads/avatars/user1.jpg');
  });

  it('should handle binary content', async () => {
    const binary = Buffer.from([0x00, 0x01, 0x02, 0xff]);
    await strategy.upload('binary.dat', binary);

    const downloaded = await strategy.download('binary.dat');
    expect(Buffer.from(downloaded)).toEqual(binary);
  });
});

describe('PostgresStrategy', () => {
  let PostgresStrategy;
  let mockQuery;
  let mockPool;

  beforeAll(() => {
    mockQuery = jest.fn();
    mockPool = { connect: jest.fn().mockResolvedValue(), query: mockQuery };
    jest.mock('pg', () => ({ Pool: jest.fn(() => mockPool) }), { virtual: true });
    PostgresStrategy = require('../../lib/strategies/database/postgres.strategy');
  });

  beforeEach(() => {
    mockQuery.mockReset();
    mockPool.connect.mockClear();
  });

  it('should find one document by query', async () => {
    const strategy = new PostgresStrategy({ connectionString: 'postgres://localhost/test' });

    mockQuery.mockResolvedValue({ rows: [{ id: 1, name: 'Test', email: 'test@test.com' }] });

    const result = await strategy.findOne('User', { email: 'test@test.com' });

    expect(result).toEqual({ id: 1, name: 'Test', email: 'test@test.com' });
    expect(mockQuery).toHaveBeenCalledWith(
      'SELECT * FROM "users" WHERE "email" = $1 LIMIT 1',
      ['test@test.com']
    );
  });

  it('should find document by ID', async () => {
    const strategy = new PostgresStrategy({ connectionString: 'postgres://localhost/test' });

    mockQuery.mockResolvedValue({ rows: [{ id: 'abc-123', name: 'Test', email: 'test@test.com' }] });

    const result = await strategy.findById('User', 'abc-123');

    expect(result.id).toBe('abc-123');
    expect(mockQuery).toHaveBeenCalledWith(
      'SELECT * FROM "users" WHERE "id" = $1 LIMIT 1',
      ['abc-123']
    );
  });

  it('should create a document and return it', async () => {
    const strategy = new PostgresStrategy({ connectionString: 'postgres://localhost/test' });

    mockQuery.mockResolvedValue({ rows: [{ id: 'new-id', name: 'Jane', email: 'jane@test.com' }] });

    const result = await strategy.create('User', { name: 'Jane', email: 'jane@test.com' });

    expect(result.email).toBe('jane@test.com');
    expect(mockQuery).toHaveBeenCalledWith(
      'INSERT INTO "users" ("name", "email") VALUES ($1, $2) RETURNING *',
      ['Jane', 'jane@test.com']
    );
  });

  it('should update a document by ID', async () => {
    const strategy = new PostgresStrategy({ connectionString: 'postgres://localhost/test' });

    mockQuery.mockResolvedValue({ rows: [{ id: 'abc-123', name: 'Updated', email: 'test@test.com' }] });

    const result = await strategy.findByIdAndUpdate('User', 'abc-123', { name: 'Updated' });

    expect(result.name).toBe('Updated');
    expect(mockQuery).toHaveBeenCalledWith(
      'UPDATE "users" SET "name" = $1 WHERE "id" = $2 RETURNING *',
      ['Updated', 'abc-123']
    );
  });

  it('should delete documents by query', async () => {
    const strategy = new PostgresStrategy({ connectionString: 'postgres://localhost/test' });

    mockQuery.mockResolvedValue({ rowCount: 1 });

    const result = await strategy.deleteOne('User', { id: 'abc-123' });

    expect(result.deletedCount).toBe(1);
    expect(mockQuery).toHaveBeenCalledWith(
      'DELETE FROM "users" WHERE "id" = $1',
      ['abc-123']
    );
  });

  it('should count documents', async () => {
    const strategy = new PostgresStrategy({ connectionString: 'postgres://localhost/test' });

    mockQuery.mockResolvedValue({ rows: [{ count: 3 }] });

    const result = await strategy.count('User', { active: true });

    expect(result).toBe(3);
    expect(mockQuery).toHaveBeenCalledWith(
      'SELECT COUNT(*)::int AS count FROM "users" WHERE "active" = $1',
      [true]
    );
  });
});

describe('S3StorageStrategy', () => {
  let S3StorageStrategy;
  let mockSend;
  let mockCommands;

  beforeAll(() => {
    mockSend = jest.fn();
    mockCommands = { PutObjectCommand: jest.fn(), GetObjectCommand: jest.fn(), DeleteObjectCommand: jest.fn() };
    jest.mock('@aws-sdk/client-s3', () => ({
      S3Client: jest.fn(() => ({ send: mockSend })),
      PutObjectCommand: mockCommands.PutObjectCommand,
      GetObjectCommand: mockCommands.GetObjectCommand,
      DeleteObjectCommand: mockCommands.DeleteObjectCommand,
    }), { virtual: true });
    S3StorageStrategy = require('../../lib/strategies/storage/s3Storage.strategy');
  });

  beforeEach(() => {
    mockSend.mockReset();
  });

  it('should upload a file', async () => {
    const strategy = new S3StorageStrategy({ bucket: 'my-bucket', region: 'us-east-1' });

    mockSend.mockResolvedValue({});

    const key = await strategy.upload('avatars/user1.jpg', Buffer.from('content'), 'image/jpeg');

    expect(key).toBe('avatars/user1.jpg');
    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  it('should download a file', async () => {
    const strategy = new S3StorageStrategy({ bucket: 'my-bucket', region: 'us-east-1' });

    mockSend.mockResolvedValue({
      Body: { transformToByteArray: jest.fn().mockResolvedValue(Buffer.from('file content')) },
    });

    const content = await strategy.download('avatars/user1.jpg');
    expect(content.toString()).toBe('file content');
  });

  it('should delete a file', async () => {
    const strategy = new S3StorageStrategy({ bucket: 'my-bucket', region: 'us-east-1' });

    mockSend.mockResolvedValue({});

    const result = await strategy.delete('avatars/user1.jpg');
    expect(result).toBe(true);
    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  it('should generate a public URL', () => {
    const strategy = new S3StorageStrategy({ bucket: 'my-bucket', region: 'eu-west-1' });

    const url = strategy.getUrl('avatars/user1.jpg');
    expect(url).toBe('https://my-bucket.s3.eu-west-1.amazonaws.com/avatars/user1.jpg');
  });
});
