const jwt = require('jsonwebtoken');

describe('Auth Middleware', () => {
  let authenticate;
  let req;
  let res;
  let next;

  beforeAll(() => {
    authenticate = require('../middlewares/auth');
  });

  beforeEach(() => {
    req = {
      headers: {},
      id: 'test-trace-id',
    };
    res = {
      statusCode: null,
      body: null,
      status: function (code) { this.statusCode = code; return this; },
      json: function (data) { this.body = data; return this; },
    };
    next = jest.fn();
  });

  it('should return 401 when no Authorization header is present', () => {
    authenticate(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body.error.message).toMatch(/no token provided/i);
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 when Authorization header is not Bearer', () => {
    req.headers.authorization = 'Basic dGVzdDpwYXNz';

    authenticate(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.body.error.message).toMatch(/no token provided/i);
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 when token is invalid', () => {
    req.headers.authorization = 'Bearer this.is.not.a.valid.token';

    authenticate(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.body.error.message).toMatch(/invalid or expired token/i);
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 when token is expired', () => {
    const expiredToken = jwt.sign(
      { id: '123', email: 'test@test.com' },
      process.env.JWT_SECRET || 'super_secret_test_key_only',
      { expiresIn: '0s' }
    );

    req.headers.authorization = `Bearer ${expiredToken}`;

    authenticate(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.body.error.message).toMatch(/invalid or expired token/i);
    expect(next).not.toHaveBeenCalled();
  });

  it('should set req.user and call next when token is valid', () => {
    const validToken = jwt.sign(
      { id: '507f1f77bcf86cd799439011', email: 'test@test.com' },
      process.env.JWT_SECRET || 'super_secret_test_key_only',
      { expiresIn: '1h' }
    );

    req.headers.authorization = `Bearer ${validToken}`;

    authenticate(req, res, next);

    expect(res.statusCode).toBeNull();
    expect(req.user).toBeDefined();
    expect(req.user.id).toBe('507f1f77bcf86cd799439011');
    expect(req.user.email).toBe('test@test.com');
    expect(next).toHaveBeenCalled();
  });
});
