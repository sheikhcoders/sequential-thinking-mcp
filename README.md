# 🧠 Sequential Thinking MCP Server

[![MCP](https://img.shields.io/badge/MCP-1.0-blue.svg)](https://modelcontextprotocol.io)
[![Vercel](https://img.shields.io/badge/Vercel-Ready-black.svg)](https://vercel.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

A **Remote MCP Server** implementation for dynamic and reflective problem-solving through structured thinking. Built with the official `@vercel/mcp-adapter` for seamless Vercel deployment with **Streamable HTTP** transport.

## ✨ Features

- 🔄 **Streamable HTTP Transport** - Modern, efficient transport (recommended by MCP spec March 2025)
- 🌐 **SSE Support** - Backward compatibility with Server-Sent Events
- 📦 **Vercel Native** - One-click deployment with `@vercel/mcp-adapter`
- 🔀 **Branching Logic** - Explore alternative thinking paths
- 📝 **Revision Tracking** - Refine and improve previous thoughts
- 💾 **Session Management** - Persistent thinking across interactions
- 🏷️ **Auto-Classification** - Automatic thought type detection

## 🚀 Quick Deploy

### Deploy to Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/sheikhcoders/sequential-thinking-mcp)

After deployment, your MCP server will be available at:
- **Streamable HTTP**: `https://your-app.vercel.app/mcp`
- **SSE**: `https://your-app.vercel.app/sse`

### Local Development

```bash
# Clone the repository
git clone https://github.com/sheikhcoders/sequential-thinking-mcp.git
cd sequential-thinking-mcp

# Install dependencies
npm install

# Build
npm run build

# Run stdio mode (for MCP clients)
npm start

# Run HTTP mode (for development)
npm run start:http
```

## 📡 Transport Modes

### Streamable HTTP (Recommended)
The latest MCP transport specification. Eliminates persistent connections for better scalability.

```
POST https://your-app.vercel.app/mcp
```

### Server-Sent Events (SSE)
Legacy transport for backward compatibility.

```
GET https://your-app.vercel.app/sse
```

### Standard IO (stdio)
For local MCP clients like Claude Desktop.

```bash
node dist/index.js
```

## 🔧 Configuration

### Claude Desktop

Add to `~/.claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "sequential-thinking": {
      "url": "https://your-app.vercel.app/mcp"
    }
  }
}
```

### Cursor

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "sequential-thinking": {
      "url": "https://your-app.vercel.app/mcp"
    }
  }
}
```

### Cline (Streamable HTTP)

Add to `cline_mcp_settings.json`:

```json
{
  "mcpServers": {
    "sequential-thinking": {
      "command": "npx",
      "args": ["mcp-remote", "https://your-app.vercel.app/mcp"],
      "transportType": "Streamable HTTP"
    }
  }
}
```

### For stdio (Local)

```json
{
  "mcpServers": {
    "sequential-thinking": {
      "command": "npx",
      "args": ["sequential-thinking-mcp"]
    }
  }
}
```

## 🛠️ Available Tools

### `sequential_thinking`

The main tool for step-by-step problem solving with dynamic thought management.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `thought` | string | ✅ | Your current thinking step |
| `nextThoughtNeeded` | boolean | ✅ | Whether another thought is needed |
| `thoughtNumber` | number | ✅ | Current thought number (1-indexed) |
| `totalThoughts` | number | ✅ | Estimated total thoughts needed |
| `isRevision` | boolean | ❌ | Whether this revises previous thinking |
| `revisesThought` | number | ❌ | Which thought number is being revised |
| `branchFromThought` | number | ❌ | Create branch from this thought |
| `branchId` | string | ❌ | Branch identifier |
| `sessionId` | string | ❌ | Session ID for persistence |

### `get_thinking_summary`

Get a comprehensive summary of a thinking session.

### `list_thinking_sessions`

List all available thinking sessions.

### `switch_thinking_branch`

Switch between different thinking branches.

### `complete_thinking_session`

Mark a session as completed with optional final conclusion.

## 📊 Thought Types

Thoughts are automatically classified:

| Type | Detected When |
|------|---------------|
| `question` | Contains `?`, starts with what/how/why |
| `observation` | Contains "I notice", "I see", "observe" |
| `hypothesis` | Contains "perhaps", "maybe", "hypothesis" |
| `verification` | Contains "verify", "test", "check" |
| `insight` | Contains "insight", "realize", "aha" |
| `conclusion` | Contains "therefore", "in conclusion" |
| `refinement` | Contains "refine", "improve", "better" |
| `reflection` | Contains "reflect", "thinking about" |
| `analysis` | Default for analytical statements |

## 🏗️ Project Structure

```
sequential-thinking-mcp/
├── api/
│   └── [transport]/
│       └── route.ts       # Vercel serverless handler
├── src/
│   ├── index.ts           # CLI entry point (stdio mode)
│   ├── server.ts          # MCP stdio server
│   ├── http-transport.ts  # Express HTTP server
│   ├── thinking-session.ts # Session management
│   └── types.ts           # TypeScript definitions
├── package.json
├── tsconfig.json
├── vercel.json            # Vercel configuration
└── README.md
```

## 🔒 Production Considerations

### Session Persistence

For production with persistent sessions, integrate **Vercel KV** or **Upstash Redis**:

```typescript
import { kv } from '@vercel/kv';

// Store session
await kv.set(`session:${sessionId}`, session);

// Retrieve session
const session = await kv.get(`session:${sessionId}`);
```

### Authentication

Add OAuth or API key authentication for production:

```typescript
// In your handler
const authHeader = request.headers.get('Authorization');
if (!validateToken(authHeader)) {
  return new Response('Unauthorized', { status: 401 });
}
```

## 📄 API Reference

### Health Check

```bash
curl https://your-app.vercel.app/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "method": "initialize", "id": 1}'
```

### Call Tool

```bash
curl https://your-app.vercel.app/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "sequential_thinking",
      "arguments": {
        "thought": "Let me analyze this problem step by step",
        "nextThoughtNeeded": true,
        "thoughtNumber": 1,
        "totalThoughts": 5
      }
    },
    "id": 1
  }'
```

## 📚 Resources

- [MCP Specification](https://modelcontextprotocol.io/specification)
- [Vercel MCP Adapter](https://www.npmjs.com/package/@vercel/mcp-adapter)
- [Deploy MCP Servers to Vercel](https://vercel.com/docs/mcp/deploy-mcp-servers-to-vercel)
- [Building Efficient MCP Servers](https://vercel.com/blog/building-efficient-mcp-servers)

## 📝 License

MIT License - see [LICENSE](LICENSE) for details.

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines and submit PRs.

---

**Built with ❤️ using the Model Context Protocol**
