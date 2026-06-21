const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const modelsDir = path.join(__dirname, '..', '..', 'models');
const syncScript = path.join(__dirname, 'sync-db.js');

const debounceMap = new Map();

function runSync(filePath) {
  const now = Date.now();
  const last = debounceMap.get(filePath) || 0;
  if (now - last < 1000) return;
  debounceMap.set(filePath, now);

  console.log(`\n  [cb-sync] Change detected: ${path.basename(filePath)}`);
  try {
    execSync(`node "${syncScript}"`, { stdio: 'inherit', cwd: path.join(__dirname, '..', '..', '..') });
  } catch (err) {
    console.error(`  [cb-sync] Sync failed: ${err.message}`);
  }
}

function watchModels() {
  console.log(`\n  [cb-sync] Watching ${modelsDir} for changes...\n`);

  if (!fs.existsSync(modelsDir)) {
    console.error(`  [cb-sync] Models directory not found: ${modelsDir}`);
    process.exit(1);
  }

  fs.watch(modelsDir, { recursive: false }, (eventType, filename) => {
    if (!filename || !filename.endsWith('.js')) return;
    const filePath = path.join(modelsDir, filename);
    if (eventType === 'change' || eventType === 'rename') {
      runSync(filePath);
    }
  });

  process.on('SIGINT', () => {
    console.log('\n  [cb-sync] Stopped.\n');
    process.exit(0);
  });
}

watchModels();