/**
 * Cue Deep Unveil - Main Process Injector
 * Unlocks native Computer Use on Windows and bridges Custom MCP Servers
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

function injectMainProcess(mainCjsPath) {
  if (!fs.existsSync(mainCjsPath)) {
    throw new Error(`Target main.cjs not found: ${mainCjsPath}`);
  }

  let code = fs.readFileSync(mainCjsPath, 'utf8');
  const isCRLF = code.includes('\r\n');
  code = code.replace(/\r\n/g, '\n');

  console.log('[Main 1/4] Unlocking environment injection platform check for Windows...');
  const target1 = 'if (process.platform !== "darwin") return env;';
  if (code.includes(target1)) {
    code = code.replace(target1, '/* platform check removed by cue-agent-mod */');
  } else {
    console.log('Notice: Target 1 already patched or not present.');
  }

  console.log('[Main 2/4] Injecting user toolchain PATH & VIRTUAL_ENV into env(options)...');
  const targetToolchain = 'if (helper) env.MANUS_OPERATOR_COMPUTER_USE_HELPER = helper;\n    return env;';
  const replToolchain = `if (helper) env.MANUS_OPERATOR_COMPUTER_USE_HELPER = helper;
    try {
      const uHome = (0, import_node_os6.homedir)();
      const toolchainDirs = [
        (0, import_node_path22.join)(uHome, ".cue", "toolchain", "venv", "Scripts"),
        (0, import_node_path22.join)(uHome, ".cue", "toolchain", "bin"),
        (0, import_node_path22.join)(uHome, ".local", "bin"),
        (0, import_node_path22.join)(uHome, ".cargo", "bin")
      ].filter(p => (0, import_node_fs12.existsSync)(p));
      if (toolchainDirs.length > 0) {
        const curPath = env.PATH || process.env.PATH || "";
        const sep = process.platform === "win32" ? ";" : ":";
        env.PATH = toolchainDirs.join(sep) + sep + curPath;
        const venvDir = (0, import_node_path22.join)(uHome, ".cue", "toolchain", "venv");
        if ((0, import_node_fs12.existsSync)(venvDir)) {
          env.VIRTUAL_ENV = venvDir;
        }
        console.log("[LocalDevice] Enhanced PATH with user toolchains:", toolchainDirs);
      }
    } catch (e) {
      console.warn("[LocalDevice] Failed to inject user toolchains into PATH:", e);
    }
    return env;`;

  if (code.includes(targetToolchain)) {
    code = code.replace(targetToolchain, replToolchain);
  } else if (code.includes('Enhanced PATH with user toolchains')) {
    console.log('Notice: Toolchain injection already applied.');
  } else {
    console.log('Notice: Toolchain injection anchor not matched.');
  }

  console.log('[Main 3/4] Unlocking prepareComputerUse caller for Windows...');
  const target2 = `this.issuedToken = token;
      this.issuedDeviceId = this.options.deviceId;
      if (process.platform === "darwin") {
        await this.prepareComputerUse(directories.config);
        if (generation !== this.generation) return;
      } else if (!this.sandboxSetup) {`;

  const repl2 = `this.issuedToken = token;
      this.issuedDeviceId = this.options.deviceId;
      await this.prepareComputerUse(directories.config);
      if (generation !== this.generation) return;
      if (process.platform !== "darwin" && !this.sandboxSetup) {`;

  if (code.includes(target2)) {
    code = code.replace(target2, repl2);
  } else {
    console.log('Notice: Target 2 caller already unlocked or using alternate anchor.');
  }

  console.log('[Main 4/4] Enhancing prepareComputerUse with Custom MCP Server Merger...');
  const start3 = code.indexOf('async prepareComputerUse(configDirectory) {');
  const end3 = code.indexOf('(0, import_node_fs12.renameSync)(temporary, manifest);\n  }', start3);

  if (start3 !== -1 && end3 !== -1) {
    const repl3 = `async prepareComputerUse(configDirectory) {
    const helper = computerUseHelperLocator.resolveHelper();
    const entries = [];
    let hosted = false;
    try {
      hosted = await skillRecordingClient.ensureHost().then(() => true, (err) => {
        console.warn("[LocalDevice] Skill Recorder did not start:", err);
        return false;
      });
    } catch (e) {
      hosted = false;
    }
    if (helper) {
      entries.push({
        name: helper.serverName,
        description: helper.description,
        transport: "socketPath" in helper ? {
          type: "socket",
          path: helper.socketPath,
          ...helper.platform === "darwin" ? {} : { launchCommand: helper.launchCommand }
        } : {
          type: "stdio",
          command: helper.helperPath,
          args: helper.stdioArgs
        }
      });
      console.log("[LocalDevice] Computer Use helper registered successfully:", helper.helperPath);
    } else {
      console.warn("[LocalDevice] Computer Use helper resolution failed");
    }

    // ====== Custom MCP Merger ======
    try {
      const userMcpPath = (0, import_node_path22.join)((0, import_node_os6.homedir)(), ".cue", "mcp_servers.json");
      if ((0, import_node_fs12.existsSync)(userMcpPath)) {
        const rawMcp = (0, import_node_fs12.readFileSync)(userMcpPath, "utf8");
        const customEntries = JSON.parse(rawMcp);
        if (Array.isArray(customEntries)) {
          for (const item of customEntries) {
            if (item && item.name && item.transport) {
              entries.push(item);
              console.log("[LocalDevice] Merged custom user MCP server:", item.name);
            }
          }
        }
      }
    } catch (err) {
      console.warn("[LocalDevice] Error merging custom user MCP servers:", err.message);
    }

    const manifest = (0, import_node_path22.join)(configDirectory, "mcp_servers.json");
    const temporary = \`\${manifest}.\${process.pid}.tmp\`;
    (0, import_node_fs12.mkdirSync)(configDirectory, { recursive: true });
    (0, import_node_fs12.writeFileSync)(temporary, \`\${JSON.stringify(entries, null, 2)}\\n\`, {
      mode: 384
    });
    (0, import_node_fs12.renameSync)(temporary, manifest);
    console.log("[LocalDevice] Successfully written mcp_servers.json with " + entries.length + " servers to: " + manifest);
  }`;

    code = code.slice(0, start3) + repl3 + code.slice(end3 + '(0, import_node_fs12.renameSync)(temporary, manifest);\n  }'.length);
  }

  console.log('Validating modified main.cjs syntax with vm.Script...');
  try {
    new vm.Script(code);
    console.log('✓ main.cjs AST syntax is 100% VALID!');
  } catch (err) {
    throw new Error(`Syntax verification failed for main.cjs: ${err.message}`);
  }

  if (isCRLF) {
    code = code.replace(/\n/g, '\r\n');
  }

  return code;
}

module.exports = { injectMainProcess };
