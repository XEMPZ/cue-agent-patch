#!/usr/bin/env node

/**
 * Cue Deep Unveil Patch Tool (v1.1.14+)
 * Automatically detects Cue installation, extracts app.asar, injects
 * non-destructive real-time step visualization patches, verifies AST syntax,
 * and safely repacks the application.
 *
 * Repository: https://github.com/XEMPZ/cue-agent-patch
 * Author: XEMPZ
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
const { injectPatch } = require('./core/injector');
const { injectMainProcess } = require('./core/main_injector');

console.log('====================================================');
console.log('       Cue Deep Unveil Hotfix Installer (v1.1.14)   ');
console.log('   Permanently Unveil Agent Inner Steps & Timeline   ');
console.log('====================================================\n');

// 1. Detect target directory
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
  console.error('[ERROR] Could not automatically find Cue app.asar installation.');
  console.error('Please specify the path using: node patch.js --asar "<path-to-app.asar>"');
  console.error('Or: node patch.js --app-path "<path-to-Cue-folder>"');
  process.exit(1);
}

console.log(`[Target Found] ${asarPath}`);

// 2. Backup app.asar if not already backed up
const backupPath = asarPath + '.bak';
if (!fs.existsSync(backupPath)) {
  console.log(`[Backup] Creating clean backup at: ${backupPath}`);
  fs.copyFileSync(asarPath, backupPath);
} else {
  console.log(`[Backup] Existing backup verified at: ${backupPath}`);
}

// 3. Create temp extraction workspace
const tmpDir = path.join(os.tmpdir(), `cue_patch_${Date.now()}`);
fs.mkdirSync(tmpDir, { recursive: true });
console.log(`[Workspace] Extracting app.asar into temporary sandbox: ${tmpDir}`);

try {
  execSync(`npx --yes @electron/asar extract "${asarPath}" "${tmpDir}"`, {
    stdio: 'inherit',
    windowsHide: true
  });
} catch (e) {
  console.error('[ERROR] Failed to extract app.asar via @electron/asar:', e.message);
  process.exit(1);
}

// 4. Locate target chunk file in out/_next/static/chunks/
const chunksDir = path.join(tmpDir, 'out', '_next', 'static', 'chunks');
if (!fs.existsSync(chunksDir)) {
  console.error(`[ERROR] Next.js chunks directory not found: ${chunksDir}`);
  process.exit(1);
}

console.log('[Search] Scanning Next.js chunks for target components...');
let targetChunk = null;
const chunkFiles = fs.readdirSync(chunksDir);

for (const file of chunkFiles) {
  if (file.endsWith('.js')) {
    const full = path.join(chunksDir, file);
    const content = fs.readFileSync(full, 'utf8');
    if (content.includes('Thinking process') && content.includes('ignoreBoundary') && content.includes('function To(')) {
      targetChunk = full;
      console.log(`[Match] Located target conversation chunk: ${file}`);
      break;
    }
  }
}

if (!targetChunk) {
  console.error('[ERROR] Could not find the conversation chunk containing target signatures.');
  console.error('Please refer to docs/MIGRATION_GUIDE_FOR_AI.md for signature adaptation.');
  process.exit(1);
}

// 4.5. Patch Main Process (dist/main.cjs)
const mainCjsPath = path.join(tmpDir, 'dist', 'main.cjs');
if (fs.existsSync(mainCjsPath)) {
  console.log('[Inject] Applying main process Computer Use & MCP merger hotfix...');
  try {
    const patchedMain = injectMainProcess(mainCjsPath);
    fs.writeFileSync(mainCjsPath, patchedMain, 'utf8');
    console.log('[Inject] dist/main.cjs successfully patched and verified!');
  } catch (err) {
    console.error('[WARN] Failed to patch dist/main.cjs:', err.message);
  }
}

// 5. Inject patch
try {
  console.log('[Inject] Applying modular AST hotfix...');
  const patchedCode = injectPatch(targetChunk);
  fs.writeFileSync(targetChunk, patchedCode, 'utf8');
  console.log('[Inject] Chunk successfully patched and saved!');
} catch (e) {
  console.error('[ERROR] Patch injection failed:', e.message);
  process.exit(1);
}

// 6. Repack app.asar
console.log('[Pack] Repacking modified app into app.asar...');
const tempAsar = path.join(os.tmpdir(), `app_repacked_${Date.now()}.asar`);

try {
  execSync(`npx --yes @electron/asar pack "${tmpDir}" "${tempAsar}" --unpack "{dist/windows-worker.cjs,dist/dbCache/worker.cjs,dist/native/**}"`, {
    stdio: 'inherit',
    windowsHide: true
  });

  console.log(`[Deploy] Overwriting ${asarPath}...`);
  fs.copyFileSync(tempAsar, asarPath);
  fs.unlinkSync(tempAsar);

  // Cleanup temp dir
  fs.rmSync(tmpDir, { recursive: true, force: true });

  // 6.5. Optional Go operator MCP whitelist unlock
  const operatorExe = path.join(path.dirname(asarPath), 'bin', 'manus-computer-operator.exe');
  if (fs.existsSync(operatorExe)) {
    try {
      const fd = fs.openSync(operatorExe, 'r+');
      const buf = Buffer.alloc(6);
      fs.readSync(fd, buf, 0, 6, 0x7cc902);
      if (buf.toString('hex') === '0f840f030000') {
        fs.writeSync(fd, Buffer.from('909090909090', 'hex'), 0, 6, 0x7cc902);
        console.log('[Binary Patch] Unlocked custom MCP whitelist in manus-computer-operator.exe!');
      } else if (buf.toString('hex') === '909090909090') {
        console.log('[Binary Patch] manus-computer-operator.exe custom MCP whitelist is already unlocked.');
      }
      fs.closeSync(fd);
    } catch (binErr) {
      console.log('[Binary Patch] Notice: operator binary patch skipped:', binErr.message);
    }
  }

  console.log('\n====================================================');
  console.log('       🎉 PATCH APPLIED SUCCESSFULLY!               ');
  console.log('   All execution steps, commands, and timelines     ');
  console.log('   are now permanently visible across all turns!    ');
  console.log('====================================================\n');
  console.log('Restart Cue to experience the enhanced interface.');
} catch (e) {
  console.error('[ERROR] Repacking/deployment failed:', e.message);
  process.exit(1);
}
