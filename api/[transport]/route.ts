/**
 * Sequential Thinking MCP Server - Vercel Serverless Handler
 * Supports both Streamable HTTP (/mcp) and SSE (/sse) transports
 */

import { createMcpHandler } from '@vercel/mcp-adapter';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

// Types
type ThoughtType = 'observation' | 'analysis' | 'hypothesis' | 'verification' | 'refinement' | 'conclusion' | 'question' | 'insight' | 'reflection';
type SessionStatus = 'active' | 'paused' | 'completed' | 'abandoned';

interface ThoughtStep {
  id: string;
  stepNumber: number;
  thought: string;
  thoughtType: ThoughtType;
  isRevision: boolean;
  revisesStep?: number;
  branchId: string;
  branchFromStep?: number;
  confidence?: number;
  tags?: string[];
  timestamp: Date;
}

interface ThinkingBranch {
  id: string;
  name: string;
  parentBranchId?: string;
  branchFromStepId?: string;
  description?: string;
  createdAt: Date;
}

interface ThinkingSession {
  id: string;
  title: string;
  problem: string;
  thoughts: ThoughtStep[];
  branches: ThinkingBranch[];
  activeBranchId: string;
  createdAt: Date;
  updatedAt: Date;
  status: SessionStatus;
}

// In-memory session storage (for serverless, consider Redis for persistence)
const sessions = new Map<string, ThinkingSession>();

const DEFAULT_BRANCH_NAME = 'main';

// Helper functions
function inferThoughtType(thought: string): ThoughtType {
  const lower = thought.toLowerCase();
  if (lower.includes('?') || lower.startsWith('what') || lower.startsWith('how') || lower.startsWith('why')) return 'question';
  if (lower.includes('i notice') || lower.includes('i see') || lower.includes('observe')) return 'observation';
  if (lower.includes('therefore') || lower.includes('in conclusion') || lower.includes('finally')) return 'conclusion';
  if (lower.includes('perhaps') || lower.includes('maybe') || lower.includes('hypothesis')) return 'hypothesis';
  if (lower.includes('verify') || lower.includes('test') || lower.includes('check')) return 'verification';
  if (lower.includes('insight') || lower.includes('realize') || lower.includes('aha')) return 'insight';
  if (lower.includes('refine') || lower.includes('improve') || lower.includes('better')) return 'refinement';
  if (lower.includes('reflect') || lower.includes('thinking about')) return 'reflection';
  return 'analysis';
}

function getOrCreateSession(sessionId?: string, problem?: string): ThinkingSession {
  if (sessionId && sessions.has(sessionId)) {
    return sessions.get(sessionId)!;
  }
  const id = sessionId || uuidv4();
  const mainBranch: ThinkingBranch = {
    id: uuidv4(),
    name: DEFAULT_BRANCH_NAME,
    createdAt: new Date(),
    description: 'Main thinking branch',
  };
  const session: ThinkingSession = {
    id,
    title: problem ? problem.split(' ').slice(0, 6).join(' ') + '...' : 'New Thinking Session',
    problem: problem || '',
    thoughts: [],
    branches: [mainBranch],
    activeBranchId: mainBranch.id,
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 'active',
  };
  sessions.set(id, session);
  return session;
}

// Create the MCP handler
const handler = createMcpHandler(
  (server) => {
    // Tool 1: Sequential Thinking - Main tool for step-by-step problem solving
    server.tool(
      'sequential_thinking',
      'A detailed tool for dynamic and reflective problem-solving through thoughts. Each thought can build on, question, or revise previous insights.',
      {
        thought: z.string().describe('Your current thinking step'),
        nextThoughtNeeded: z.boolean().describe('Whether another thought step is needed'),
        thoughtNumber: z.number().int().min(1).describe('Current thought number'),
        totalThoughts: z.number().int().min(1).describe('Estimated total thoughts needed'),
        isRevision: z.boolean().optional().describe('Whether this revises previous thinking'),
        revisesThought: z.number().int().min(1).optional().describe('Which thought is being reconsidered'),
        branchFromThought: z.number().int().min(1).optional().describe('Branching point thought number'),
        branchId: z.string().optional().describe('Branch identifier'),
        needsMoreThoughts: z.boolean().optional().describe('If more thoughts are needed'),
        sessionId: z.string().optional().describe('Session ID for persistent thinking'),
      },
      async (args) => {
        const session = getOrCreateSession(args.sessionId, args.thought);
        const branchThoughts = session.thoughts.filter(t => t.branchId === session.activeBranchId);
        
        const thoughtStep: ThoughtStep = {
          id: uuidv4(),
          stepNumber: args.thoughtNumber,
          thought: args.thought,
          thoughtType: inferThoughtType(args.thought),
          isRevision: args.isRevision || false,
          revisesStep: args.revisesThought,
          branchId: session.activeBranchId,
          branchFromStep: args.branchFromThought,
          timestamp: new Date(),
        };
        
        session.thoughts.push(thoughtStep);
        session.updatedAt = new Date();
        
        const activeBranch = session.branches.find(b => b.id === session.activeBranchId);
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              sessionId: session.id,
              stepNumber: thoughtStep.stepNumber,
              totalSteps: session.thoughts.length,
              activeBranch: activeBranch?.name || DEFAULT_BRANCH_NAME,
              thoughtType: thoughtStep.thoughtType,
              isRevision: thoughtStep.isRevision,
              nextThoughtNeeded: args.nextThoughtNeeded,
              status: args.nextThoughtNeeded ? 'continue' : 'complete',
            }, null, 2),
          }],
        };
      }
    );

    // Tool 2: Get Thinking Summary
    server.tool(
      'get_thinking_summary',
      'Get a summary of the current thinking session including all thoughts, branches, and insights.',
      {
        sessionId: z.string().describe('Session ID to get summary for'),
      },
      async ({ sessionId }) => {
        const session = sessions.get(sessionId);
        if (!session) {
          return {
            content: [{ type: 'text', text: JSON.stringify({ error: 'Session not found' }) }],
          };
        }
        
        const summary = {
          sessionId: session.id,
          title: session.title,
          problem: session.problem,
          totalSteps: session.thoughts.length,
          branches: session.branches.map(b => ({
            name: b.name,
            stepCount: session.thoughts.filter(t => t.branchId === b.id).length,
          })),
          insights: session.thoughts.filter(t => t.thoughtType === 'insight').map(t => t.thought),
          conclusions: session.thoughts.filter(t => t.thoughtType === 'conclusion').map(t => t.thought),
          status: session.status,
        };
        
        return {
          content: [{ type: 'text', text: JSON.stringify(summary, null, 2) }],
        };
      }
    );

    // Tool 3: List Sessions
    server.tool(
      'list_thinking_sessions',
      'List all available thinking sessions.',
      {},
      async () => {
        const sessionList = Array.from(sessions.values()).map(s => ({
          id: s.id,
          title: s.title,
          status: s.status,
          stepCount: s.thoughts.length,
          createdAt: s.createdAt,
        }));
        
        return {
          content: [{ type: 'text', text: JSON.stringify(sessionList, null, 2) }],
        };
      }
    );

    // Tool 4: Switch Branch
    server.tool(
      'switch_thinking_branch',
      'Switch to a different thinking branch within a session.',
      {
        sessionId: z.string().describe('Session ID'),
        branchName: z.string().describe('Name of the branch to switch to'),
      },
      async ({ sessionId, branchName }) => {
        const session = sessions.get(sessionId);
        if (!session) {
          return {
            content: [{ type: 'text', text: JSON.stringify({ error: 'Session not found' }) }],
          };
        }
        
        const branch = session.branches.find(b => b.name === branchName);
        if (!branch) {
          return {
            content: [{ type: 'text', text: JSON.stringify({ error: 'Branch not found', availableBranches: session.branches.map(b => b.name) }) }],
          };
        }
        
        session.activeBranchId = branch.id;
        session.updatedAt = new Date();
        
        return {
          content: [{ type: 'text', text: JSON.stringify({ success: true, activeBranch: branchName }) }],
        };
      }
    );

    // Tool 5: Complete Session
    server.tool(
      'complete_thinking_session',
      'Mark a thinking session as completed.',
      {
        sessionId: z.string().describe('Session ID to complete'),
        finalConclusion: z.string().optional().describe('Final conclusion or summary'),
      },
      async ({ sessionId, finalConclusion }) => {
        const session = sessions.get(sessionId);
        if (!session) {
          return {
            content: [{ type: 'text', text: JSON.stringify({ error: 'Session not found' }) }],
          };
        }
        
        if (finalConclusion) {
          session.thoughts.push({
            id: uuidv4(),
            stepNumber: session.thoughts.length + 1,
            thought: finalConclusion,
            thoughtType: 'conclusion',
            isRevision: false,
            branchId: session.activeBranchId,
            timestamp: new Date(),
          });
        }
        
        session.status = 'completed';
        session.updatedAt = new Date();
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              sessionId: session.id,
              status: 'completed',
              totalSteps: session.thoughts.length,
              conclusions: session.thoughts.filter(t => t.thoughtType === 'conclusion').map(t => t.thought),
            }, null, 2),
          }],
        };
      }
    );
  },
  {
    capabilities: {
      tools: {
        sequential_thinking: {
          description: 'Dynamic problem-solving through structured thinking',
        },
        get_thinking_summary: {
          description: 'Get session summary with insights and conclusions',
        },
        list_thinking_sessions: {
          description: 'List all thinking sessions',
        },
        switch_thinking_branch: {
          description: 'Switch between thinking branches',
        },
        complete_thinking_session: {
          description: 'Mark session as completed',
        },
      },
    },
  }
);

// Export handlers for Vercel
export { handler as GET, handler as POST, handler as DELETE };
