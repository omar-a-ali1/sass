# Proposal: Simplify the Core for Beginners

## Problem

The current framework has 7 layers per feature (model → route → controller → service → repository → validation → strategy) spread across 7 top-level directories. A beginner needs to understand auto-discovery, IoC containers with string-based DI, strategy pattern, and dual-database support before writing their first endpoint.

## Proposed: Feature Modules

Replace the layer-based directory structure with self-contained feature modules. Each feature lives in one folder and exports everything it needs.

### New directory structure

```
src/
├── server.js                    # Entry point (tiny)
├── config/
│   └── env.js                   # Environment loader only
├── lib/
│   ├── router.js                # Auto-route loader (single file)
│   └── swagger.js               # Auto-Swagger (single file)
├── features/
│   ├── health/
│   │   └── route.js             # GET /health
│   ├── auth/
│   │   ├── model.js             # User mongoose model
│   │   ├── route.login.js       # POST /auth/login
│   │   ├── route.register.js    # POST /auth/register
│   │   └── middleware.js        # authenticate + authorize
│   ├── users/
│   │   ├── model.js
│   │   ├── route.list.js        # GET /users
│   │   └── route.profile.js     # GET /users/profile
│   └── products/                # New feature — one command
│       ├── model.js
│       ├── route.list.js
│       ├── route.create.js
│       └── route.get.js
├── seeders/
└── tests/
```

**Key change**: `features/` replaces `controllers/`, `services/`, `repositories/`, `models/`, `routes/`. Everything for "products" is in `features/products/`.

### What a feature looks like

A complete "Products" feature — two files, no DI container, no repositories, no services layer:

**`src/features/products/model.js`**:
```js
const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Product', schema);
```

**`src/features/products/route.list.js`**:
```js
const Product = require('./model');

module.exports = {
  method: 'get',
  path: '/',
  handler: async (req, res) => {
    const products = await Product.find();
    res.json({ data: products });
  }
};
```

That's it. Model + route. No controller, no service, no repository, no validation file, no container registration.

### When to add layers (progressive)

| If you need | Add |
|---|---|
| Just a simple endpoint | One route file, inline handler |
| Reusable queries | A `ProductService.js` file in the feature folder — routes import it directly |
| Complex validation | A `validate.js` file in the feature folder — import in route |
| Shared auth logic | `features/auth/middleware.js` — import in any route's `middleware` array |

No layer is mandatory. A beginner starts with 1 file per endpoint and adds structure only when they feel the pain it solves.

### What changes for the beginner

| Before (current) | After (proposed) |
|---|---|
| 7 top-level dirs for code | 3: `features/`, `config/`, `lib/` |
| 10 files per feature (scaffolded) | 1-3 files per feature |
| IoC container with magic string DI | Direct `require()` — works like every other Node project |
| Strategy pattern (Mongo/PG/Local/S3/Console/SMTP) | Single database, single storage — swap files if needed |
| Auto-discovery of models, routes, services, repos | Feature folder is just a directory — no magic |
| Controller → Service → Repository → Strategy chain | Handler calls Model directly |
| `npm run make:all -- Product` needs filling 10 files | `npm run make:feature -- Product` creates 2 files, both ready to run |

### Scaffolding for the new structure

```bash
npm run make:feature -- Product
```

Creates:

```
src/features/products/
├── model.js              # Basic mongoose schema (ready to edit)
├── route.list.js         # GET /products (works immediately)
├── route.create.js       # POST /products (works immediately)
├── route.get.js          # GET /products/:id (works immediately)
└── route.delete.js       # DELETE /products/:id (works immediately)
```

Each route file is ~10 lines. No additional wiring needed.

### Migration path

This is opt-in. The existing layer-based structure (`controllers/`, `services/`, `repositories/`, `routes/`) continues to work. New features can use the new `features/` folder. The auto-route loader scans both.

```js
// lib/router.js — scans both locations
scanDirectory('src/routes');
scanDirectory('src/features');
```

---

## Alternative: "Single-File Route" Pattern (less invasive)

If restructuring the whole project is too much, add a simpler pattern to the existing system:

Define everything in one file — the route file itself:

```js
// src/routes/api/v1/products/list.js
const mongoose = require('mongoose');

const Product = mongoose.model('Product', new mongoose.Schema({
  name: String,
  price: Number,
}, { timestamps: true }));

module.exports = {
  method: 'get',
  path: '/',
  handler: async (req, res) => {
    const products = await Product.find();
    res.respond(products);
  },
};
```

This works right now — the model is registered globally by Mongoose when the route file is loaded, and the auto-route loader picks it up. No scaffold, no seperate model file, no controller, no service.

**When the model gets too big**, extract it to `src/models/Product.js`. **When the handler gets too complex**, extract to a controller. The route file stays as the single entry point.

---

## Summary

| Complexity | Current | Proposed |
|---|---|---|
| Files for a new feature | 10 | 1-3 |
| Directories to know | 7 | 3 |
| Magic (auto-discovery, DI) | Heavy | Minimal |
| Beginner can read 1 file and understand | No | Yes |
| Scales to production | Yes | Yes (add layers as needed) |
