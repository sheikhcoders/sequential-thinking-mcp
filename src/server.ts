/**
 * Sequential Thinking MCP Server
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { sessionManager } from './thinking-session.js';
import { ThoughtType } from './types.js';

const SequentialThinkingInputSchema = z.object({
  sessionId: z.string().optional(),
  thought: z.string(),
  thoughtType: z.enum(['observation', 'analysis', 'hypothesis', 'verification', 'refinement', 'conclusion', 'question', 'insight', 'reflection']).optional(),
  isRevision: z.boolean().optional().default(false),
  revisesStep: z.number().optional(),
  branchFromStep: z.number().optional(),
  newBranchName: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  tags: z.array(z.string()).optional(),
  nextThoughtNeeded: z.boolean(),
});

const TOOLS: Tool[] = [
  {
    name: 'sequential_thinking',
    description: 'A powerful tool for dynamic, reflective problem-solving through structured sequential thinking.',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: 'Session ID to continue' },
        thought: { type: 'string', description: 'The thinking step content' },
        thoughtType: { type: 'string', enum: ['observation', 'analysis', 'hypothesis', 'verification', 'refinement', 'conclusion', 'question', 'insight', 'reflection'] },
        isRevision: { type: 'boolean', default: false },
        revisesStep: { type: 'number' },
        branchFromStep: { type: 'number' },
        newBranchName: { type: 'string' },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
        tags: { type: 'array', items: { type: 'string' } },
        nextThoughtNeeded: { type: 'boolean' },
      },
      required: ['thought', 'nextThoughtNeeded'],
    },
  },
  { name: 'get_thinking_summary', description: 'Get session summary', inputSchema: { type: 'object', properties: { sessionId: { type: 'string' } }, required: ['sessionId'] } },
  { name: 'list_thinking_sessions', description: 'List all sessions', inputSchema: { type: 'object', properties: {}, required: [] } },
  { name: 'switch_thinking_branch', description: 'Switch branch', inputSchema: { type: 'object', properties: { sessionId: { type: 'string' }, branchName: { type: 'string' } }, required: ['sessionId', 'branchName'] } },
  { name: 'complete_thinking_session', description: 'Complete session', inputSchema: { type: 'object', properties: { sessionId: { type: 'string' } }, required: ['sessionId'] } },
];

export function createServer(): Server {
  const server = new Server({ name: 'sequential-thinking-mcp', version: '1.0.0' }, { capabilities: { tools: {} } });
  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
      switch (name) {
        case 'sequential_thinking': {
          const input = SequentialThinkingInputSchema.parse(args);
          const result = sessionManager.addThought({ ...input, thoughtType: input.thoughtType as ThoughtType | undefined });
          return { content: [{ type: 'text', text: `## Thought Recorded\n\n**Session ID:** \`${result.sessionId}\`\n**Step:** ${result.stepNumber}\n**Type:** ${result.thoughtType}\n\n${result.thoughtRecorded}` }] };
        }
        case 'get_thinking_summary': {
          const summary = sessionManager.getSummary((args as { sessionId: string }).sessionId);
          return { content: [{ type: 'text', text: summary ? `# Summary\n\n**${summary.title}**\nSteps: ${summary.totalSteps}` : 'Session not found' }], isError: !summary };
        }
        case 'list_thinking_sessions': {
          const sessions = sessionManager.listSessions();
          return { content: [{ type: 'text', text: sessions.length ? sessions.map(s => `- ${s.title} (${s.stepCount} steps)`).join('\n') : 'No sessions' }] };
        }
        case 'switch_thinking_branch': {
          const { sessionId, branchName } = args as { sessionId: string; branchName: string };
          return { content: [{ type: 'text', text: sessionManager.switchBranch(sessionId, branchName) ? `Switched to ${branchName}` : 'Failed' }] };
        }
        case 'complete_thinking_session': {
          return { content: [{ type: 'text', text: sessionManager.updateSessionStatus((args as { sessionId: string }).sessionId, 'completed') ? 'Completed' : 'Failed' }] };
        }
        default: return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
      }
    } catch (error) {
      return { content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }], isError: true };
    }
  });
  return server;
}

export async function runStdioServer(): Promise<void> {
  const server = createServer();
  await server.connect(new StdioServerTransport());
  console.error('Sequential Thinking MCP Server running on stdio');
}
