# API Key Authentication — Tutorial

Learn how to create, use, and protect routes with API keys in this framework.

---

## How it works

| Concept | Implementation |
|---|---|
| Key format | `{prefix}_` + 64 hex characters (256-bit random) — prefix defaults to `sass`, configurable via `API_KEY_PREFIX` env var |
| Storage | Only a **bcrypt hash** is persisted — raw key is never stored |
| Lookup | First 12 characters are extracted as a prefix for fast DB lookup |
| Validation | Bcrypt compare against the stored hash |
| Expiry | Optional `expiresAt` date checked on every request |
| Revocation | Keys are deactivated (soft-delete via `active: false`) |

---

## 1. Create an API key

API key management endpoints require **JWT authentication**. First get a token:

```bash
# Login (or register) to get a JWT
curl -s http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"secret123"}' | jq '.data.token'
```

Save the returned token, then create a key:

```bash
TOKEN="eyJhbGciOiJIUzI1NiIs..."

curl -X POST http://localhost:5000/api/v1/api-keys \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"dev-cli","permissions":["read:users","read:orders"]}'
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "apiKey": {
      "_id": "6655a1b2c3d4e5f6a7b8c9d0",
      "prefix": "sass_a1b2c3d4e5",
      "name": "dev-cli",
      "active": true,
      "permissions": ["read:users", "read:orders"]
    },
    "rawKey": "sass_a1b2c3d4e5f678901234567890123456789012345678901234567890abcdef"
  }
}
```

> **Save `rawKey` now** — it is returned only once. If you lose it, revoke and create a new one.

---

## 2. Use an API key on any protected route

Pass it via the `X-API-Key` header:

```bash
curl http://localhost:5000/api/v1/users \
  -H "X-API-Key: sass_a1b2c3d4e5f678901234567890123456789012345678901234567890abcdef"
```

### What the middleware does

On success, `apiKeyAuth` sets two properties on the request:

| Property | Contains |
|---|---|
| `req.apiKey` | `{ id, name, permissions }` |
| `req.user` | `{ id }` — the owning user's ID |

This means you can use `req.user.id` in your handler just like after JWT auth.

---

## 3. Protect your own route with API keys

Import the middleware and add it to the route's `middleware` array:

```js
// src/routes/api/v1/my-resource/list.js
const apiKeyAuth = require('../../../../middlewares/apiKeyAuth');

module.exports = {
  method: 'get',
  path: '/',
  middleware: [apiKeyAuth],
  handler: async (req, res) => {
    const userId = req.user.id;  // set by apiKeyAuth
    const keyName = req.apiKey.name;
    res.respond({ message: `Hello, key owner ${userId}` });
  },
  docs: {
    tags: ['My Resource'],
    summary: 'List resources (API key auth)',
  }
};
```

### Combine with JWT and permissions

You can layer middlewares — JWT first, then API key, then role check:

```js
middleware: [authenticate, apiKeyAuth, authorize('admin')],
```

Or use API keys *instead of* JWT on machine-to-machine routes:

```js
middleware: [apiKeyAuth],
```

---

## 4. Check permissions in your handler

If the key was created with permission scopes, check them in your handler:

```js
handler: async (req, res) => {
  const perms = req.apiKey.permissions || [];

  if (!perms.includes('read:users')) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  // proceed...
}
```

---

## 5. List your keys

```bash
curl http://localhost:5000/api/v1/api-keys \
  -H "Authorization: Bearer $TOKEN"
```

Returns an array of your keys (without the hashed key, of course).

---

## 6. Revoke a key

```bash
curl -X DELETE http://localhost:5000/api/v1/api-keys/<key-id> \
  -H "Authorization: Bearer $TOKEN"
```

The key is deactivated immediately. Any subsequent request using it receives a **401**.

---

## 7. Full example: from scratch

```bash
# 1. Login
TOKEN=$(curl -s http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"secret123"}' | jq -r '.data.token')

# 2. Create an API key
RESPONSE=$(curl -s -X POST http://localhost:5000/api/v1/api-keys \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"ci-cd-pipeline"}')

RAW_KEY=$(echo "$RESPONSE" | jq -r '.data.rawKey')
echo "Key: $RAW_KEY"

# 3. Use it
curl -s http://localhost:5000/api/v1/users \
  -H "X-API-Key: $RAW_KEY" | jq

# 4. Revoke it (extract the id from the create response)
KEY_ID=$(echo "$RESPONSE" | jq -r '.data.apiKey._id')
curl -s -X DELETE "http://localhost:5000/api/v1/api-keys/$KEY_ID" \
  -H "Authorization: Bearer $TOKEN" | jq
```

---

## Configuration

Set a custom prefix via `API_KEY_PREFIX` in your `.env`:

```bash
# .env.development
API_KEY_PREFIX=myapp
```

Keys will be generated as `myapp_a1b2c3d4...` instead of the default `sass_a1b2c3d4...`.

## API key format reference

```
sass_a1b2c3d4e5f678901234567890123456789012345678901234567890abcdef
^^^^ ^^^^^^^^^^^^ ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
 |        |                            |
api key                              256-bit random (64 hex chars)
prefix   lookup prefix (12 chars)
(env var)

API_KEY_PREFIX defaults to "sass".
The lookup prefix is always the first 12 characters of the full key.
```
