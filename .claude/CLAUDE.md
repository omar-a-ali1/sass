# SASS Framework — Claude Code Guide

Refer to `AI_CONTEXT.md` for full architecture, conventions, and commands.

Key points when working with this codebase:

1. Always follow Route → Controller → Service → Repository → Strategy chain
2. Use `npm run make:all -- Name` then `npm run make:route -- Name` for new features
3. Sanitize responses with `sanitizeData()` — strip password and __v
4. Run `npm test` before finishing — all 85+ tests must pass
5. Never hardcode dependencies — use constructor DI (auto-discovered by container)
6. Add Swagger `docs` to every route definition
