# Sequential Thinking MCP Server

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)
![MCP](https://img.shields.io/badge/MCP-Compatible-purple.svg)

**A Remote MCP Server for Dynamic and Reflective Problem-Solving**

[Features](#features) • [Installation](#installation) • [Usage](#usage) • [API Reference](#api-reference) • [Deployment](#deployment)

</div>

---

## Overview

Sequential Thinking MCP Server is an implementation of the [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) that provides a powerful tool for structured, step-by-step problem-solving. It enables AI models to break down complex problems into manageable steps, revise their thinking, and explore alternative solution paths through branching.

### Why Sequential Thinking?

Complex problem-solving often requires:
- **Iterative refinement** - Initial thoughts may need revision as understanding deepens
- **Multiple approaches** - Different solution paths should be explored
- **Structured reasoning** - Step-by-step analysis yields better results
- **Reflection** - Meta-cognition improves problem-solving quality

This server provides the infrastructure to support all of these capabilities.

---

## Features

| Feature | Description |
|---------|-------------|
| **Step-by-Step Thinking** | Record thoughts sequentially with automatic numbering and tracking |
| **Thought Categorization** | Classify thoughts into 9 types for better organization |
| **Revision Support** | Revise earlier thoughts when new insights emerge |
| **Branching** | Explore alternative solution paths from any step |
| **Confidence Tracking** | Rate confidence levels (0-1) for each thought |
| **Session Management** | Create, continue, and complete thinking sessions |
| **Dual Transport** | Run as stdio server or HTTP/SSE for remote access |
| **Stateless API** | Simple REST endpoints for easy integration |

### Thought Types

| Type | Use Case |
|------|----------|
| `observation` | Initial observations about the problem |
| `analysis` | Breaking down the problem into components |
| `hypothesis` | Proposed solutions or theories |
| `verification` | Testing or validating ideas |
| `refinement` | Improving upon previous thoughts |
| `conclusion` | Final conclusions or decisions |
| `question` | Questions that arise during thinking |
| `insight` | Key realizations or breakthroughs |
| `reflection` | Meta-thinking about the process |

---

## Installation

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn

### Quick Start

```bash
# Clone the repository
git clone https://github.com/sheikhcoders/sequential-thinking-mcp.git
cd sequential-thinking-mcp

# Install dependencies
npm install

# Build the project
npm run build

# Start the server
npm start
```

---

## Usage

### Mode 1: Stdio Server (MCP Clients)

For integration with MCP clients like Claude Desktop:

```bash
node dist/index.js stdio
```

#### Claude Desktop Configuration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "sequential-thinking": {
      "command": "node",
      "args": ["/path/to/sequential-thinking-mcp/dist/index.js", "stdio"]
    }
  }
}
```

### Mode 2: HTTP/SSE Server (Remote Access)

For remote access via HTTP with Server-Sent Events:

```bash
# Default port (3000)
node dist/index.js http

# Custom port
node dist/index.js http --port 8080
```

---

## API Reference

### HTTP Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check and server status |
| `/info` | GET | Server information and capabilities |
| `/sse` | GET | Establish SSE connection |
| `/message/:clientId` | POST | Send JSON-RPC request (with SSE session) |
| `/message` | POST | Send JSON-RPC request (stateless) |
| `/tools` | GET | List available tools |
| `/tools/:toolName` | POST | Direct tool invocation |

---

## Deployment

### Vercel

This project includes a `vercel.json` configuration for easy deployment:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ by Matrix Agent**

</div>
