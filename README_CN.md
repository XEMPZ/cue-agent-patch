# Cue 全能本地 Agent 增强与深度透出补丁 (Cue Deep Unveil & Agent Patch)

[![Target Version](https://img.shields.io/badge/Cue%20Version-1.1.14-blue.svg)](https://github.com/XEMPZ/cue-agent-patch)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-brightgreen.svg)](https://github.com/XEMPZ/cue-agent-patch)
[![License](https://img.shields.io/badge/License-MIT-orange.svg)](LICENSE)

> **为官方 Cue 桌面端（v1.1.14）打造的全功能非侵入式热补丁**  
> 彻底解决执行步骤“一闪而过”、历史对话轮次工具调用“凭空消失”、隐藏操作参数无法查看的痛点；  
> 同时**移植 ManusStudio 核心资产，唤醒 Windows 原生桌面控制 (Computer Use)、打通本地免提权 Python 工具链与用户自定义 MCP 扩展生态**，将 Cue 真正重塑为安全、透明、全能的本地 Agent 平台。

---

## 🌟 补丁核心特性

### 1. 深度透出与安全审计 (Execution Observability & Security)
1. **历史轮次步骤全量永驻**：彻底重构轮次容器生命周期，无论进行多少轮新对话、无论是否点击“记忆已更新”，历史各轮的工具调用记录永久保留在各自气泡下方，杜绝组件卸载清空。
2. **高危命令实时分析与醒目警示**：前端动态识别如 `rmdir /s`、`del /f /s /q`、`format` 等破坏性命令，渲染带脉冲动效的 `⚠️ 高危指令` 红色警示徽章。
3. **详细操作参数代码化透出**：不再只显示空洞的一句话，每个步骤均以代码块形式直接展示真实的终端执行命令（`terminal.command`）、读写文件绝对路径（`textEditor.path`）、检索关键词（`searchScholar.queries`）及 MCP 调用参数，支持一键点击复制。
4. **敏感凭据自动脱敏**：前端实时过滤并遮蔽 GitHub Token (`gho_***`)、OpenAI/Anthropic API Key (`sk-***`) 及 Bearer Authorization，防止会话截图外泄。
5. **一键导出 Markdown 审计报告**：每一轮次右上角新增“📥 导出日志”按钮，随时导出标准 Markdown 格式的完整步骤审计文件。
6. **五态状态机联动**：细分成功（✓）、进行中（●）、失败（✕）、已取消（⊘）、进度流（ℹ），操作状态一目了然。

### 2. 本地 Agent 全能改造 (Full Local Agent Capabilities)
1. **唤醒 Windows 原生桌面控制 (Computer Use)**：
   - 移植同源母体 `ManusStudio` 的 Windows 原生键鼠、截屏与 QuickJS 沙箱执行组件（`helper/win32-x64/ManusComputerUseHelper.exe` 与 `runtime/computer-use-js.mjs`）。
   - 解除主进程中硬编码的平台限制，使 Windows 客户端同样享有原生桌面 GUI 操控能力。
2. **免提权用户工具链隔离 (Zero-Elevation User Toolchain)**：
   - 在用户主目录自动挂载专属隔离 Python 环境（`%USERPROFILE%\.cue\toolchain\venv`）。
   - 主进程在派生底层执行器时，自动将虚拟环境与用户工具目录（`Scripts`、`.local\bin`、`.cargo\bin`）优先注入 `env.PATH` 并设置 `VIRTUAL_ENV`。
   - 彻底解决普通用户权限下无法通过管理员安装系统依赖、无法调用 Python 脚本的壁垒。
3. **本地自定义 MCP 扩展器 (Custom MCP Host)**：
   - 在主进程注入热合并机制，自动读取用户级配置文件 `%USERPROFILE%\.cue\mcp_servers.json` 并与系统工具链无缝融合，用户可自由扩充任意标准 stdio/socket 本地 MCP 服务。

---

## 🚀 快速开始 (Quick Start)

### 环境要求
* 已安装 [Node.js](https://nodejs.org/) (推荐 v18 或以上版本)；
* 已安装 Cue 桌面客户端 (v1.1.14)。

### 一键安装补丁
在 Windows 环境下，克隆或下载本仓库后，直接**双击运行 `patch.bat`**，或在终端执行：
```bash
node patch.js
```

#### 自定义安装路径（可选）：
如果你的 Cue 安装在非标准目录，可通过参数显式指定：
```bash
node patch.js --asar "D:\Path\To\Cue\resources\app.asar"
# 或指定应用根目录：
node patch.js --app-path "D:\Path\To\Cue"
```

### 一键恢复官方原版
如果需要还原至未修改的官方状态，直接**双击运行 `restore.bat`**，或执行：
```bash
node restore.js
```

---

## 🧠 第一部分：Cue 软件底层工作机制全景剖析

### 1. 系统拓扑与进程划分
Cue 是一款基于 **Electron 30+、Next.js（Standalone 静态打包）与本地 Sidecar 守护进程** 紧耦合运行的混合型 Agent 架构：
- **Electron 主进程 (`dist/main.cjs`)**：负责窗口生命周期、单实例互斥锁 (`SingleInstanceLock`)、自定义协议注册 (`cue://desktop/`) 以及与本地 SQLite 数据库的异步通信。
- **渲染进程 (`out/_next/static/chunks/`)**：基于 React 18 + Redux Toolkit 构建，采用 Webpack 分块打包。所有的对话界面、时间线流转与状态管理均运行于此。
- **持久化层 (`%APPDATA%/Cue/storage/`)**：通过本地 SQLite 存储会话索引与事件日志，核心表为 `session` 与 `session_view_event`。

### 2. `toolUsed` 与 `liveStatus` 的本质鸿沟
在 Cue 的数据生命周期中，存在两种截然不同的事件类型：

| 维度 | `toolUsed` (正式工具调用) | `liveStatus` (瞬时进度文本) |
| :--- | :--- | :--- |
| **数据本质** | 具有全局唯一 UUID 的独立事件对象 | Session 根对象上的单值字符串字段 (`session.liveStatus`) |
| **存储落地** | **100% 完整持久化** 进 SQLite `session_view_event` 表 | **0 字节落库**，纯内存与流式传输广播 |
| **参数 payload** | 包含完整终端命令、文件路径、API 请求参数 | 仅为一句纯文本描述 |
| **官方处理** | 官方前端将其视为后台隐式事件，**默认不挂载看板渲染** | 每收到新文本立即**就地覆盖**旧文本；任务结束时直接置为 `undefined` |

> [!NOTE]
> 这就是为什么许多用户误以为中间步骤“被系统删除了”：实际上工具调用一直在本地数据库中，只是官方前端未做持久化挂载；而流式进度文字则因单变量就地覆盖和任务结束置空而“一闪而过”。

---

## 🛠️ 第二部分：补丁作用机理与注入架构

本补丁通过对 Next.js 前端对话主 Chunk（`61090.13c9227a47bed052.js`）实施**精确的 AST 与组件级热重构**，实现无损增强：

```mermaid
flowchart TD
    Store["Redux allEvents Store"] --> Slice["Turn Slice Engine"]
    Slice --> LiveFilter["__isBoilerplateText (心跳清洗)"]
    LiveFilter --> Cache["localStorage Turn Cache"]
    
    subgraph UI Render Layers
        ActiveTurn["活跃轮次 (containsFooter = true)"] --> O6["增强版 O6 组件 (实时多步动态看板)"]
        HistoryTurn["历史轮次 (containsFooter = false)"] --> TH["永驻版 TurnHistorySteps 组件 (切片固化看板)"]
        MsgHeader["Assistant 消息气泡"] --> Nz["增强版 Nz 组件 (折叠展开与操作明细)"]
    end

    Cache --> O6
    Cache --> TH
    Store --> TH
    Store --> Nz
```

### 核心注入模块解析：
1. **`common_helpers` (公共清洗与缓存中间件)**：
   - `__isBoilerplateText(text)`：正则匹配过滤“工作中”、“Cue 正在处理您的请求”等占位套话。
   - `__loadTurnLiveSteps` / `__recordTurnLiveStep`：在本地 `localStorage` 维护轮次维度的状态字典，防止流式状态被覆盖或置空。
2. **`TurnHistorySteps` (历史轮次步骤永驻组件)**：
   - 官方原代码在历史轮次直接将底部状态容器卸载（`t ? <Tn /> : null`）。
   - 补丁将其替换为 `<TurnHistorySteps turnId={e.id} turnUserMsgId={...} />`，以当前轮次提问 ID 为界，动态切片本轮全部工具操作并永久驻留。
3. **`Nz` (思考过程与执行步骤折叠抽屉)**：
   - 在 Assistant 消息正上方挂载“🛠️ 执行步骤记录”卡片，包含成功/失败胶囊标签、工具名徽章、操作描述以及 Markdown 样式的参数代码块。
4. **`O6` (实时动态多步指示器)**：
   - 突破单行限制，将当前轮次正在执行的每一步动态渲染，并带流光光晕动效。

---

## 🤖 第三部分：给 AI 的新版本自适应适配指南 (AI Migration Guide)

当 Cue 官方更新版本（如 `1.1.15` 或 `1.2.x`）导致文件名或混淆变量名发生变动时，AI Agent 可按照以下**不变语义指纹**重新定位并自动生成新补丁：

### 1. 五大不变语义指纹
即使打包工具更换了变量名，底层业务常量是固定不变的：
1. **定位对话主 Chunk**：在 `out/_next/static/chunks/` 中检索包含字符串 `"Thinking process"` 且包含 `"ignoreBoundary"` 的文件。
2. **定位 Assistant 气泡组件 (原 `Nz`)**：检索包含 `.t("Thinking process")` 的函数签名 `function <CompName>({event:<param>})`。
3. **定位实时指示器组件 (原 `O6`)**：检索包含字符串 `"shimmer-text-primary"` 的函数定义。
4. **定位轮次历史分支 (原 `To`)**：检索模式 `ignoreBoundary:!0})]}):null]},e.id`。将其中的 `:null` 替换为挂载 `<TurnHistorySteps>`。
5. **提取 Redux 选择器别名**：在 Chunk 头部通过正则捕获 `selectAllEvents` 与 `currentSessionId` 绑定的模块对象名称。

### 2. 避免崩溃的关键纪律 (Preventing `ChunkLoadError`)
* **严格语法校验**：在将修改后的 Chunk 回写前，必须使用 Node.js 的 `new vm.Script(code)` 验证抽象语法树（AST）。若存在未闭合的括号或无效转义，Webpack 在动态 `import()` 时会抛出致命的 `ChunkLoadError`。
* **原生二进制解包声明**：打包 `app.asar` 时必须附带 `--unpack "{dist/windows-worker.cjs,dist/dbCache/worker.cjs,dist/native/**}"`，否则 SQLite 原生驱动无法加载。

详细的逆向工程说明与符号自动化提取脚本请参阅 [docs/MIGRATION_GUIDE_FOR_AI.md](docs/MIGRATION_GUIDE_FOR_AI.md)。

---

## 📁 仓库结构

```text
cue-agent-patch/
├── patch.js                       # Node.js 跨平台自动化安装脚本
├── restore.js                     # 官方原厂一键还原脚本
├── patch.bat                      # Windows 用户一键修补批处理
├── restore.bat                    # Windows 用户一键还原批处理
├── core/
│   ├── injector.js                # AST 语法校验与前端模块热注入引擎
│   ├── main_injector.js           # 主进程注入引擎 (Computer Use 解封/MCP合并/PATH穿透)
│   └── modules/                   # 独立解耦的前端增强组件源码
│       ├── common_helpers.js      # 工具函数、缓存、敏感脱敏与高危命令识别
│       ├── nz_component.js        # 消息气泡步骤抽屉组件 (五态机+高危徽章+日志导出)
│       ├── o6_component.js        # 实时多步指示器组件
│       └── turn_history_component.js # 历史轮次永驻看板组件
└── docs/
    ├── ARCHITECTURE.md            # Cue 完整系统架构剖析
    ├── EVENT_MODEL.md             # toolUsed 与 liveStatus 深度对比
    └── MIGRATION_GUIDE_FOR_AI.md  # 专为 AI 设计的新版本适配维护手册
```

---

## 📄 授权许可 (License)

本项目基于 [MIT License](LICENSE) 开源发布。仅供技术研究、逆向工程学习与本地效率改进使用。
