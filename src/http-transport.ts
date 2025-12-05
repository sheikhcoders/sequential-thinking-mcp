/**
 * HTTP/SSE Transport for Remote MCP Server
 */

import express, { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { sessionManager } from './thinking-session.js';
import { ThoughtType } from './types.js';

interface SSEClient { id: string; response: Response; createdAt: Date; }

const SequentialThinkingInputSchema = z.object({
  sessionId: z.string().optional(), thought: z.string(),
  thoughtType: z.enum(['observation', 'analysis', 'hypothesis', 'verification', 'refinement', 'conclusion', 'question', 'insight', 'reflection']).optional(),
  isRevision: z.boolean().optional().default(false), revisesStep: z.number().optional(),
  branchFromStep: z.number().optional(), newBranchName: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(), tags: z.array(z.string()).optional(),
  nextThoughtNeeded: z.boolean(),
});

const TOOLS = [
  { name: 'sequential_thinking', description: 'Structured sequential thinking tool', inputSchema: { type: 'object', properties: { thought: { type: 'string' }, nextThoughtNeeded: { type: 'boolean' } }, required: ['thought', 'nextThoughtNeeded'] } },
  { name: 'get_thinking_summary', description: 'Get session summary', inputSchema: { type: 'object', properties: { sessionId: { type: 'string' } }, required: ['sessionId'] } },
  { name: 'list_thinking_sessions', description: 'List sessions', inputSchema: { type: 'object', properties: {}, required: [] } },
  { name: 'switch_thinking_branch', description: 'Switch branch', inputSchema: { type: 'object', properties: { sessionId: { type: 'string' }, branchName: { type: 'string' } }, required: ['sessionId', 'branchName'] } },
  { name: 'complete_thinking_session', description: 'Complete session', inputSchema: { type: 'object', properties: { sessionId: { type: 'string' } }, required: ['sessionId'] } },
];

export class HttpSseTransport {
  private app: express.Application;
  private clients: Map<string, SSEClient> = new Map();

  constructor(private port: number = 3000) {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(express.json());
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type');
      if (req.method === 'OPTIONS') { res.sendStatus(200); return; }
      next();
    });
  }

  private setupRoutes(): void {
    this.app.get('/health', (_, res) => res.json({ status: 'healthy', server: 'sequential-thinking-mcp', version: '1.0.0' }));
    this.app.get('/info', (_, res) => res.json({ name: 'sequential-thinking-mcp', version: '1.0.0', transport: 'http-sse' }));
    this.app.get('/sse', (req, res) => {
      const clientId = randomUUID();
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.write(`event: connected\ndata: ${JSON.stringify({ clientId })}\n\n`);
      this.clients.set(clientId, { id: clientId, response: res, createdAt: new Date() });
      req.on('close', () => this.clients.delete(clientId));
    });
    this.app.post('/message', async (req, res) => {
      try { res.json(await this.handleJsonRpcRequest(req.body)); }
      catch (e) { res.status(500).json({ jsonrpc: '2.0', error: { code: -32603, message: String(e) } }); }
    });
    this.app.get('/tools', (_, res) => res.json({ jsonrpc: '2.0', result: { tools: TOOLS } }));
    this.app.post('/tools/:toolName', async (req, res) => {
      try { res.json({ jsonrpc: '2.0', result: await this.handleToolCall(req.params.toolName, req.body) }); }
      catch (e) { res.status(500).json({ jsonrpc: '2.0', error: { code: -32603, message: String(e) } }); }
    });
  }

  private async handleJsonRpcRequest(request: any): Promise<any> {
    if (request.jsonrpc !== '2.0') return { jsonrpc: '2.0', error: { code: -32600, message: 'Invalid JSON-RPC' } };
    switch (request.method) {
      case 'initialize': return { jsonrpc: '2.0', result: { protocolVersion: '2024-11-05', serverInfo: { name: 'sequential-thinking-mcp', version: '1.0.0' } }, id: request.id };
      case 'tools/list': return { jsonrpc: '2.0', result: { tools: TOOLS }, id: request.id };
      case 'tools/call': return { jsonrpc: '2.0', result: await this.handleToolCall(request.params.name, request.params.arguments || {}), id: request.id };
      default: return { jsonrpc: '2.0', error: { code: -32601, message: 'Method not found' }, id: request.id };
    }
  }

  private async handleToolCall(name: string, args: any): Promise<any> {
    switch (name) {
      case 'sequential_thinking': {
        const input = SequentialThinkingInputSchema.parse(args);
        const result = sessionManager.addThought({ ...input, thoughtType: input.thoughtType as ThoughtType | undefined });
        return { content: [{ type: 'text', text: `## Thought Recorded\n**Session:** ${result.sessionId}\n**Step:** ${result.stepNumber}\n\n${result.thoughtRecorded}` }] };
      }
      case 'get_thinking_summary': {
        const summary = sessionManager.getSummary(args.sessionId);
        return { content: [{ type: 'text', text: summary ? `# ${summary.title}\nSteps: ${summary.totalSteps}` : 'Not found' }] };
      }
      case 'list_thinking_sessions': {
        const sessions = sessionManager.listSessions();
        return { content: [{ type: 'text', text: sessions.length ? sessions.map(s => `- ${s.title}`).join('\n') : 'No sessions' }] };
      }
      case 'switch_thinking_branch': return { content: [{ type: 'text', text: sessionManager.switchBranch(args.sessionId, args.branchName) ? 'Switched' : 'Failed' }] };
      case 'complete_thinking_session': return { content: [{ type: 'text', text: sessionManager.updateSessionStatus(args.sessionId, 'completed') ? 'Completed' : 'Failed' }] };
      default: return { content: [{ type: 'text', text: `Unknown: ${name}` }], isError: true };
    }
  }

  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.app.listen(this.port, () => {
        console.log(`Sequential Thinking MCP Server running at http://localhost:${this.port}`);
        resolve();
      });
    });
  }
}

export async function runHttpServer(port: number = 3000): Promise<void> {
  await new HttpSseTransport(port).start();
}
