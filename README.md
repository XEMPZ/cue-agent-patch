# Cue Deep Unveil Patch

[**中文文档 (Chinese Documentation)**](README_CN.md) | [**AI Migration Guide**](docs/MIGRATION_GUIDE_FOR_AI.md) | [**Architecture Analysis**](docs/ARCHITECTURE.md)

[![Target Version](https://img.shields.io/badge/Cue%20Version-1.1.14-blue.svg)](https://github.com/XEMPZ/cue-agent-patch)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-brightgreen.svg)](https://github.com/XEMPZ/cue-agent-patch)
[![License](https://img.shields.io/badge/License-MIT-orange.svg)](LICENSE)

> A production-grade, non-destructive hotfix for **Cue Desktop (v1.1.14)** that permanently unveils hidden inner agent steps, full terminal execution commands, file operations, web research, and complete historical timelines across all conversation turns.  
> Also unlocks **native Windows Computer Use**, provides a **zero-elevation isolated Python toolchain**, and enables **custom local MCP server registration**.

---

## ⚡ Highlights

* **Permanent Turn-History Retention**: Prevents React unmounting when new turns start or when "Memory updated" is clicked. Every single tool invocation remains anchored under its respective message bubble forever.
* **Risk Command Detection**: Real-time identification of destructive commands (`rmdir /s`, `del /f /s /q`, `format`, etc.) with animated warning badges (`⚠️ 高危指令`).
* **Sensitive Token Masking**: Real-time redaction of GitHub Tokens, OpenAI API keys, and Bearer authorizations to prevent credential leaks.
* **One-Click Audit Log Export**: Easily export full turn execution histories into standard Markdown (`📥 导出日志`).
* **Native Windows Computer Use Unlocked**: Ported from parent software ManusStudio, enabling local keyboard/mouse control and QuickJS execution on Windows.
* **Zero-Elevation Python Toolchain**: Isolated Python 3.13 environment automatically injected into `PATH` and `VIRTUAL_ENV`, eliminating admin elevation barriers.
* **Custom MCP Host Integration**: Automatically merges `%USERPROFILE%\.cue\mcp_servers.json` into runtime configurations.
* **100% AST Syntax Verified**: Injected code is strictly validated using Node.js Abstract Syntax Tree (`vm.Script`) prior to packing, completely eliminating Webpack `ChunkLoadError` risks.
* **Zero-Touch Backup & Restore**: Automatic `.bak` snapshot generation before patching, with instant one-click rollback.

---

## 🚀 Quick Start

### Prerequisites
* [Node.js](https://nodejs.org/) installed (v18 or higher recommended).
* Cue Desktop (v1.1.14) installed on your system.

### Installation
On Windows, simply double-click `patch.bat` or run:
```bash
node patch.js
```

#### Custom Path (Optional)
If Cue is installed in a non-standard location:
```bash
node patch.js --asar "C:\path\to\Cue\resources\app.asar"
# or
node patch.js --app-path "C:\path\to\Cue"
```

### Uninstallation / Restore
To revert Cue back to its pristine factory state, double-click `restore.bat` or run:
```bash
node restore.js
```

---

## 📚 Technical Documentation

For developers, reverse engineers, and AI agents:

1. [**Cue Internal System Architecture (`docs/ARCHITECTURE.md`)**](docs/ARCHITECTURE.md):
   Detailed breakdown of the Electron main process, Next.js static renderer, SQLite persistent cache, and native worker processes.
2. [**Event Model & Lifecycle Analysis (`docs/EVENT_MODEL.md`)**](docs/EVENT_MODEL.md):
   Empirical comparison between persisted `toolUsed` events and ephemeral, single-slot `liveStatus` broadcasts.
3. [**AI Migration & Adaptation Guide (`docs/MIGRATION_GUIDE_FOR_AI.md`)**](docs/MIGRATION_GUIDE_FOR_AI.md):
   Comprehensive instructions for AI agents on how to locate invariable semantic fingerprints, extract symbol maps, and adapt this patch to future Cue versions (v1.1.15+).

---

## 📂 Repository Layout

```text
cue-agent-patch/
├── patch.js                       # Automated cross-platform installer
├── restore.js                     # One-click factory reset utility
├── patch.bat                      # Windows installer batch wrapper
├── restore.bat                    # Windows restore batch wrapper
├── core/
│   ├── injector.js                # AST-verified hotfix injection engine
│   └── modules/                   # Decoupled component sources
│       ├── common_helpers.js      # Filter, key generation, and localStorage cache
│       ├── nz_component.js        # Collapsible step timeline card
│       ├── o6_component.js        # Real-time multi-step progress indicator
│       └── turn_history_component.js # Persistent turn slice step container
└── docs/
    ├── ARCHITECTURE.md            # Cue system architecture deep dive
    ├── EVENT_MODEL.md             # toolUsed vs liveStatus mechanics
    └── MIGRATION_GUIDE_FOR_AI.md  # Guide for AI on adapting new versions
```

---

## 📜 License

Distributed under the [MIT License](LICENSE). Created for educational, reverse engineering research, and local agent productivity enhancement purposes.
