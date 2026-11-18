# Deep Dive: Cue Event Model & Lifecycle Mechanics

> **Author**: XEMPZ  
> **Audience**: AI Agents, Reverse Engineers, Frontend Developers  
> **Topic**: Empirical dissection of `toolUsed` vs `liveStatus` events

---

## 1. Executive Summary

In Cue Desktop, agent execution data is bifurcated into two fundamentally distinct channels:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        Backend Agent Engine                            │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
         [WebSocket / IPC Stream]           [Persistent Database Sync]
                    │                                │
                    ▼                                ▼
       ┌────────────────────────┐      ┌───────────────────────────┐
       │      liveStatus        │      │         toolUsed          │
       ├────────────────────────┤      ├───────────────────────────┤
       │ • Ephemeral string     │      │ • Permanent UUID event    │
       │ • Single-slot overwrite│      │ • Full SQLite persistence │
       │ • Zero DB persistence  │      │ • Complete parameters     │
       │ • Wiped on task stop   │      │ • Immutable history log   │
       └────────────────────────┘      └───────────────────────────┘
```

---

## 2. Event Specification Comparison

| Dimension | `toolUsed` (Tool Call Event) | `liveStatus` (Progress Status Broadcast) |
| :--- | :--- | :--- |
| **Event Type** | `type: "toolUsed"` | Field on Session: `e.liveStatus = "..."` |
| **Persistence** | **100% Persisted** in SQLite `session_view_event` | **0 Bytes Persisted** in SQLite database |
| **Data Structure** | Object with `id`, `brief`, `detail`, `status` | Single mutable string pointer |
| **Detail Payload** | Shell command, file path, queries, MCP payloads | Plain human-readable status text |
| **Concurrency** | Appended to global `allEvents` chronological array | Continuously overwritten in place |
| **End of Task** | Retained forever in state and disk | Set to `void 0` (undefined / deleted) |
| **Official UI** | **Completely invisible** (no UI component rendered) | **Single-line fading text** at bottom footer |

---

## 3. Dissecting `toolUsed` Detail Payloads

In `allEvents`, each `toolUsed` event provides structured metadata inside `ev.detail`:

### 1. Terminal Commands
```json
{
  "id": "evt_abc123",
  "type": "toolUsed",
  "brief": "检查本地输出目录",
  "description": "正在检查 C:\\...\\dist 目录结构",
  "detail": {
    "terminal": {
      "command": "dir /b \"C:\\Users\\evilbaby\\AppData\\Local\\Programs\\Cue_Modded\"",
      "exitCode": 0
    }
  }
}
```

### 2. File Operations (TextEditor)
```json
{
  "id": "evt_def456",
  "type": "toolUsed",
  "brief": "阅读微软商店条目",
  "detail": {
    "textEditor": {
      "action": "read",
      "path": "C:\\Program Files\\WindowsApps\\...\\AppxManifest.xml"
    }
  }
}
```

### 3. Academic & Web Searches
```json
{
  "id": "evt_ghi789",
  "type": "toolUsed",
  "brief": "检索技术文献",
  "detail": {
    "searchScholar": {
      "queries": ["administrative burden healthcare us comparative"]
    }
  }
}
```

---

## 4. Dissecting `liveStatus` Overwrite Behavior

In chunk `51013-4bcc4a92f10ef9ed.js`, the official streaming reducer handles incoming progress pings as follows:

```javascript
// Official Reducer Logic (Deobfuscated)
case "live_status_update":
  // Overwrite existing status in place without preserving history!
  (!session.liveStatus || force) && (session.liveStatus = payload.text);
  break;

case "task_stopped":
case "task_completed":
  // Immediately wipe the status to undefined!
  session.liveStatus = void 0;
  break;
```

### Why Did Users See "Cue is processing..." Flashing?
1. The backend model emits intermediate thinking statuses (e.g., `"Scanning font table index..."`).
2. Shortly after, the system emits boilerplate heartbeat pings (e.g., `"Cue is processing your request"` or `"Cue completed current task and is ready for next prompt"`).
3. Because official code uses a **single-variable slot**, the boilerplate immediately overwrote the valuable domain progress message.
4. When the task finished, the entire slot was set to `undefined`.

---

## 5. The Patch's Unified Interception Strategy

To solve this, our patch introduces a **dual-feed reconciliation engine**:

1. **`__isBoilerplateText(text)` Filter**: Automatically discards meaningless system heartbeats (`"Working"`, `"Thinking"`, `"Cue is processing your request"`, etc.).
2. **`localStorage` Turn Cache (`__recordTurnLiveStep`)**: Intercepts every non-boilerplate `liveStatus` before it gets overwritten, appending it to a local turn dictionary keyed by `sessionId_turnUserMsgId`.
3. **Turn Slice Merger**: For every turn, retrieves all `toolUsed` events between the current user prompt and the next user prompt, merges cached `liveStatus` steps, and formats detailed commands/paths into clean Markdown code blocks.
