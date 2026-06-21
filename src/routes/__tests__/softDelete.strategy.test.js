describe("MongoStrategy — soft delete", () => {
  let MongoStrategy;
  let strategy;
  let mockModel;

  beforeAll(() => {
    MongoStrategy = require("../../lib/strategies/database/mongo.strategy");
  });

  beforeEach(() => {
    mockModel = {
      findByIdAndUpdate: jest.fn().mockReturnValue({ lean: jest.fn() }),
    };

    const mongoose = require("mongoose");
    mongoose.model = jest.fn().mockReturnValue(mockModel);

    strategy = new MongoStrategy();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should soft-delete a document by ID", async () => {
    const now = new Date();
    mockModel.findByIdAndUpdate.mockReturnValue({
      lean: jest
        .fn()
        .mockResolvedValue({ _id: "1", name: "test", deletedAt: now }),
    });

    const result = await strategy.softDelete("User", "1");

    expect(mockModel.findByIdAndUpdate).toHaveBeenCalledWith(
      "1",
      { deletedAt: expect.any(Date) },
      { new: true },
    );
    expect(result.deletedAt).toEqual(now);
  });

  it("should restore a soft-deleted document", async () => {
    mockModel.findByIdAndUpdate.mockReturnValue({
      lean: jest
        .fn()
        .mockResolvedValue({ _id: "1", name: "test", deletedAt: null }),
    });

    const result = await strategy.restore("User", "1");

    expect(mockModel.findByIdAndUpdate).toHaveBeenCalledWith(
      "1",
      { deletedAt: null },
      { new: true },
    );
    expect(result.deletedAt).toBeNull();
  });
});

describe("PostgresStrategy — soft delete", () => {
  let PostgresStrategy;
  let mockQuery;
  let mockPool;

  beforeAll(() => {
    mockQuery = jest.fn();
    mockPool = { connect: jest.fn().mockResolvedValue(), query: mockQuery };
    jest.mock("pg", () => ({ Pool: jest.fn(() => mockPool) }), {
      virtual: true,
    });
    PostgresStrategy = require("../../lib/strategies/database/postgres.strategy");
  });

  beforeEach(() => {
    mockQuery.mockReset();
    mockPool.connect.mockClear();
  });

  it("should soft-delete a document by ID", async () => {
    const strategy = new PostgresStrategy({
      connectionString: "postgres://localhost/test",
    });

    mockQuery.mockResolvedValue({
      rows: [{ id: 1, name: "Test", deletedAt: "2026-06-18T12:00:00Z" }],
    });

    const result = await strategy.softDelete("User", 1);

    expect(result.deletedAt).toBeDefined();
    expect(mockQuery).toHaveBeenCalledWith(
      'UPDATE "users" SET "deletedAt" = NOW() WHERE "id" = $1 RETURNING *',
      [1],
    );
  });

  it("should restore a soft-deleted document", async () => {
    const strategy = new PostgresStrategy({
      connectionString: "postgres://localhost/test",
    });

    mockQuery.mockResolvedValue({
      rows: [{ id: 1, name: "Test", deletedAt: null }],
    });

    const result = await strategy.restore("User", 1);

    expect(result.deletedAt).toBeNull();
    expect(mockQuery).toHaveBeenCalledWith(
      'UPDATE "users" SET "deletedAt" = NULL WHERE "id" = $1 RETURNING *',
      [1],
    );
  });
});
