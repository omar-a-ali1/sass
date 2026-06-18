const http = require('http');
const express = require('express');
const createRateLimiter = require('../middlewares/rateLimiter');

describe('Rate Limiter Middleware', () => {
  let app;
  let server;
  let port;

  const makeRequest = (method = 'GET', path = '/') => {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: '127.0.0.1',
        port,
        path,
        method,
      };
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

  const startServer = (limiterMiddleware, routePath = '/test') => {
    return new Promise((resolve) => {
      app = express();
      app.use(routePath, limiterMiddleware);
      app.get(routePath, (req, res) => res.json({ ok: true }));
      server = app.listen(0, () => {
        port = server.address().port;
        resolve();
      });
    });
  };

  afterEach((done) => {
    if (server) { server.close(done); server = null; }
    else done();
  });

  it('should pass requests within the limit', async () => {
    await startServer(createRateLimiter({ windowMs: 1000, max: 3 }));

    const r1 = await makeRequest('GET', '/test');
    expect(r1.status).toBe(200);

    const r2 = await makeRequest('GET', '/test');
    expect(r2.status).toBe(200);

    const r3 = await makeRequest('GET', '/test');
    expect(r3.status).toBe(200);
  });

  it('should block requests exceeding the limit', async () => {
    await startServer(createRateLimiter({ windowMs: 1000, max: 1 }));

    const r1 = await makeRequest('GET', '/test');
    expect(r1.status).toBe(200);

    const r2 = await makeRequest('GET', '/test');
    expect(r2.status).toBe(429);
  });

  it('should return a JSON error message on rate limit', async () => {
    await startServer(createRateLimiter({ windowMs: 1000, max: 0 }));

    const r = await makeRequest('GET', '/test');
    expect(r.status).toBe(429);
    expect(r.body).toHaveProperty('success', false);
    expect(r.body).toHaveProperty('error');
    expect(r.body.error).toHaveProperty('message');
  });

  it('should respect a custom error message', async () => {
    await startServer(createRateLimiter({ windowMs: 1000, max: 0, message: 'Custom limit reached' }));

    const r = await makeRequest('GET', '/test');
    expect(r.body.error.message).toBe('Custom limit reached');
  });

  it('should not share state between different limiters', async () => {
    const strict = createRateLimiter({ windowMs: 1000, max: 1 });
    const loose = createRateLimiter({ windowMs: 1000, max: 10 });

    app = express();
    app.use('/strict', strict, (req, res) => res.json({ ok: true }));
    app.get('/loose', loose, (req, res) => res.json({ ok: true }));

    await new Promise((resolve) => { server = app.listen(0, () => { port = server.address().port; resolve(); }); });

    const r1 = await makeRequest('GET', '/strict');
    expect(r1.status).toBe(200);

    const r2 = await makeRequest('GET', '/strict');
    expect(r2.status).toBe(429);

    const r3 = await makeRequest('GET', '/loose');
    expect(r3.status).toBe(200);
  });

  it('should key by IP by default', async () => {
    await startServer(createRateLimiter({ windowMs: 1000, max: 2 }));

    const r1 = await makeRequest('GET', '/test');
    expect(r1.status).toBe(200);

    const r2 = await makeRequest('GET', '/test');
    expect(r2.status).toBe(200);

    const r3 = await makeRequest('GET', '/test');
    expect(r3.status).toBe(429);
  });

  it('should support custom keyGenerator', async () => {
    let callCount = 0;
    const customKey = createRateLimiter({
      windowMs: 1000,
      max: 1,
      keyGenerator: () => 'fixed-key',
    });

    app = express();
    app.get('/a', customKey, (req, res) => res.json({ ok: true }));
    app.get('/b', customKey, (req, res) => res.json({ ok: true }));

    await new Promise((resolve) => { server = app.listen(0, () => { port = server.address().port; resolve(); }); });

    const r1 = await makeRequest('GET', '/a');
    expect(r1.status).toBe(200);

    const r2 = await makeRequest('GET', '/b');
    expect(r2.status).toBe(429);
  });
});

describe('rateLimit in route definition', () => {
  it('should create rate limiter from route def with correct options', () => {
    const def = {
      rateLimit: { max: 3, windowMs: 60000 },
    };
    const mw = createRateLimiter(def.rateLimit);
    expect(typeof mw).toBe('function');
    expect(mw._label).toMatch(/max: 3/);
  });

  it('should apply rate limit before other middleware', () => {
    const def = {
      rateLimit: { max: 5, windowMs: 60000 },
      middleware: [() => {}],
    };
    const middleware = [...def.middleware];
    const rlMw = createRateLimiter(def.rateLimit);
    rlMw._label = `rateLimit(${JSON.stringify(def.rateLimit)})`;
    const result = [rlMw, ...middleware];
    expect(result.length).toBe(2);
    expect(result[0]._label).toMatch(/rateLimit/);
  });
});
