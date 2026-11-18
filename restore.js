#!/usr/bin/env node

/**
 * Cue Deep Unveil Restore Tool
 * Restores Cue app.asar to its original pristine state from .bak backup.
 */

const fs = require('fs');
const path = require('path');

console.log('====================================================');
console.log('        Cue Deep Unveil Restore Utility             ');
console.log('====================================================\n');

function findCueResources() {
  const customArgIdx = process.argv.indexOf('--asar');
  if (customArgIdx !== -1 && process.argv[customArgIdx + 1]) {
    return path.resolve(process.argv[customArgIdx + 1]);
  }

  const customAppIdx = process.argv.indexOf('--app-path');
  if (customAppIdx !== -1 && process.argv[customAppIdx + 1]) {
    return path.resolve(process.argv[customAppIdx + 1], 'resources', 'app.asar');
  }

  const userProfile = process.env.USERPROFILE || process.env.HOME || '';
  const localAppData = process.env.LOCALAPPDATA || path.join(userProfile, 'AppData', 'Local');

  const candidates = [
    path.join(localAppData, 'Programs', 'Cue_Modded', 'resources', 'app.asar'),
    path.join(localAppData, 'Programs', 'Cue', 'resources', 'app.asar'),
    path.join(userProfile, 'AppData', 'Local', 'Programs', 'Cue_Modded', 'resources', 'app.asar'),
    path.join(userProfile, 'AppData', 'Local', 'Programs', 'Cue', 'resources', 'app.asar'),
    path.join('C:', 'Program Files', 'Cue', 'resources', 'app.asar'),
  ];

  for (const p of candidates) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  return null;
}

const asarPath = findCueResources();
if (!asarPath) {
  console.error('[ERROR] Could not find Cue app.asar.');
  process.exit(1);
}

const backupPath = asarPath + '.bak';
if (!fs.existsSync(backupPath)) {
  console.error(`[ERROR] Backup file not found at: ${backupPath}`);
  console.error('Cannot restore without a valid .bak file.');
  process.exit(1);
}

try {
  console.log(`[Restore] Restoring ${backupPath} -> ${asarPath}...`);
  fs.copyFileSync(backupPath, asarPath);
  console.log('\n====================================================');
  console.log('       ✓ Cue Restored to Original Factory State!    ');
  console.log('====================================================\n');
} catch (e) {
  console.error('[ERROR] Failed to restore backup:', e.message);
  process.exit(1);
}
