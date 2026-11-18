/**
 * Cue Deep Unveil - Core Injector
 * Non-destructive AST/Regex-based patch injector for Cue Desktop
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

function injectPatch(chunkFilePath) {
  if (!fs.existsSync(chunkFilePath)) {
    throw new Error(`Target chunk file not found: ${chunkFilePath}`);
  }

  let code = fs.readFileSync(chunkFilePath, 'utf8');

  // Load modules
  const modulesDir = path.join(__dirname, 'modules');
  const helpers = fs.readFileSync(path.join(modulesDir, 'common_helpers.js'), 'utf8');
  const o6 = fs.readFileSync(path.join(modulesDir, 'o6_component.js'), 'utf8');
  const nz = fs.readFileSync(path.join(modulesDir, 'nz_component.js'), 'utf8');
  const th = fs.readFileSync(path.join(modulesDir, 'turn_history_component.js'), 'utf8');

  console.log('[1/5] Injecting common_helpers and enhanced O6 component...');
  const bpStart = code.indexOf('function __isBoilerplateText');
  const o6Start = code.indexOf('function O6({');
  const o6End = code.indexOf('O0._id=', o6Start);
  if (o6Start === -1 || o6End === -1) {
    throw new Error('Could not locate O6 component bounds');
  }
  const helperInsertPos = (bpStart !== -1 && bpStart < o6Start) ? bpStart : o6Start;
  code = code.slice(0, helperInsertPos) + helpers + '\n' + o6 + '\n' + code.slice(o6End);

  console.log('[2/5] Injecting enhanced Nz component (step drawer card)...');
  const nzStart = code.indexOf('function Nz({');
  const nzEnd = code.indexOf('function NV({', nzStart);
  if (nzStart === -1 || nzEnd === -1) {
    throw new Error('Could not locate Nz component bounds');
  }
  code = code.slice(0, nzStart) + nz + ' ' + code.slice(nzEnd);

  console.log('[3/5] Injecting TurnHistorySteps component...');
  const thStart = code.indexOf('function TurnHistorySteps({');
  const toStart = code.indexOf('function To(');
  if (toStart === -1) {
    throw new Error('Could not locate To component bounds');
  }
  const thInsertPos = (thStart !== -1 && thStart < toStart) ? thStart : toStart;
  code = code.slice(0, thInsertPos) + th + '\n' + code.slice(toStart);

  console.log('[4/5] Wiring history branch inside To component...');
  const oldBranch = 'ignoreBoundary:!0})]}):null]},e.id';
  const newBranch = 'ignoreBoundary:!0})]}):(0,P.jsx)(TurnHistorySteps,{turnId:e.id,turnUserMsgId:(function(){for(let it of(e.events||[])){if(it.node?.kind==="userMessage"&&it.node.event?.id)return it.node.event.id;if(it.node?.turn?.turnUserMessage?.id)return it.node.turn.turnUserMessage.id}return null;})()})]},e.id';

  if (!code.includes(oldBranch)) {
    if (code.includes('TurnHistorySteps')) {
      console.log('Notice: History branch appears to already be wired.');
    } else {
      throw new Error('Could not locate target history branch anchor in To component');
    }
  } else {
    code = code.replace(oldBranch, newBranch);
  }

  console.log('[5/5] Performing full AST syntax verification on modified chunk...');
  try {
    new vm.Script(code);
    console.log('✓ Syntax verification passed: 100% Valid JavaScript AST!');
  } catch (err) {
    throw new Error(`Syntax verification failed: ${err.message}`);
  }

  return code;
}

module.exports = { injectPatch };
