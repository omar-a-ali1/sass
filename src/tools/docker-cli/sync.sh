#!/usr/bin/env bash
#
# Sync PostgreSQL schema from Mongoose model definitions.
# Connects to the running dev container and runs the schema sync tool.
#
# Usage:
#   bash src/tools/docker-cli/sync.sh              # Sync all models
#   bash src/tools/docker-cli/sync.sh User Store    # Sync specific models
#
set -euo pipefail

echo "⏳ Waiting for PostgreSQL to be healthy..."
docker compose up -d postgres_dev 2>/dev/null

# Wait for postgres to be healthy
for i in $(seq 1 30); do
  if docker compose exec postgres_dev pg_isready -U sass -d sass_dev &>/dev/null; then
    echo "✅ PostgreSQL is ready"
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "❌ PostgreSQL did not become healthy in time"
    exit 1
  fi
  sleep 1
done

echo "🔧 Running schema sync..."
docker compose exec -T app_dev node src/tools/cli/sync-db.js "$@"
