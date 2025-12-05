#!/usr/bin/env node
/**
 * Sequential Thinking MCP Server - Entry Point
 */

import { runStdioServer } from './server.js';
import { runHttpServer } from './http-transport.js';

const args = process.argv.slice(2);

function printUsage(): void {
  console.log(`
Sequential Thinking MCP Server

Usage:
  npx sequential-thinking-mcp [mode] [options]

Modes:
  stdio     Run as stdio server (default)
  http      Run as HTTP/SSE server

Options:
  --port, -p <port>    Port for HTTP server (default: 3000)
  --help, -h           Show this help
  `);
}

async function main(): Promise<void> {
  const mode = args[0] || 'stdio';
  if (mode === '--help' || mode === '-h') { printUsage(); process.exit(0); }
  
  switch (mode) {
    case 'stdio': await runStdioServer(); break;
    case 'http': {
      let port = 3000;
      const portIndex = args.findIndex(a => a === '--port' || a === '-p');
      if (portIndex !== -1 && args[portIndex + 1]) port = parseInt(args[portIndex + 1], 10);
      await runHttpServer(port);
      break;
    }
    default: console.error(`Unknown mode: ${mode}`); printUsage(); process.exit(1);
  }
}

main().catch((e) => { console.error('Failed:', e); process.exit(1); });
