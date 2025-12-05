/**
 * Sequential Thinking MCP Server - Session Manager
 */

import { v4 as uuidv4 } from 'uuid';
import {
  ThinkingSession, ThoughtStep, ThinkingBranch, ThoughtType,
  AddThoughtInput, AddThoughtResult, ThinkingProgress, SessionSummary,
  BranchSummary, TimelineEntry, SessionStatus,
} from './types.js';

const DEFAULT_BRANCH_NAME = 'main';

export class ThinkingSessionManager {
  private sessions: Map<string, ThinkingSession> = new Map();

  getOrCreateSession(sessionId?: string, problem?: string): ThinkingSession {
    if (sessionId && this.sessions.has(sessionId)) {
      return this.sessions.get(sessionId)!;
    }
    const id = sessionId || uuidv4();
    const mainBranch: ThinkingBranch = {
      id: uuidv4(), name: DEFAULT_BRANCH_NAME, createdAt: new Date(),
      description: 'Main thinking branch',
    };
    const session: ThinkingSession = {
      id, title: problem ? this.generateTitle(problem) : 'New Thinking Session',
      problem: problem || '', thoughts: [], branches: [mainBranch],
      activeBranchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date(), status: 'active',
    };
    this.sessions.set(id, session);
    return session;
  }

  addThought(input: AddThoughtInput): AddThoughtResult {
    const session = this.getOrCreateSession(input.sessionId, input.thought);
    let activeBranchId = input.branchId || session.activeBranchId;
    if (input.newBranchName) {
      const newBranch = this.createBranch(session, input.newBranchName, input.branchFromStep);
      activeBranchId = newBranch.id;
      session.activeBranchId = newBranch.id;
    }
    const branchThoughts = session.thoughts.filter(t => t.branchId === activeBranchId);
    const stepNumber = branchThoughts.length + 1;
    const thoughtStep: ThoughtStep = {
      id: uuidv4(), stepNumber, thought: input.thought,
      thoughtType: input.thoughtType || this.inferThoughtType(input.thought),
      isRevision: input.isRevision || false, revisesStep: input.revisesStep,
      branchId: activeBranchId, branchFromStep: input.branchFromStep,
      confidence: input.confidence, tags: input.tags, timestamp: new Date(),
    };
    session.thoughts.push(thoughtStep);
    session.updatedAt = new Date();
    if (session.thoughts.length === 1 && !session.problem) {
      session.problem = input.thought;
      session.title = this.generateTitle(input.thought);
    }
    const activeBranch = session.branches.find(b => b.id === activeBranchId);
    return {
      sessionId: session.id, stepNumber: thoughtStep.stepNumber,
      totalSteps: session.thoughts.length, activeBranch: activeBranch?.name || DEFAULT_BRANCH_NAME,
      branchCount: session.branches.length, thoughtRecorded: thoughtStep.thought,
      thoughtType: thoughtStep.thoughtType, isRevision: thoughtStep.isRevision,
      nextThoughtNeeded: input.nextThoughtNeeded, progress: this.getProgress(session),
    };
  }

  createBranch(session: ThinkingSession, name: string, branchFromStep?: number): ThinkingBranch {
    const parentBranch = session.branches.find(b => b.id === session.activeBranchId);
    let branchFromStepId: string | undefined;
    if (branchFromStep !== undefined) {
      const sourceThought = session.thoughts.find(
        t => t.stepNumber === branchFromStep && t.branchId === session.activeBranchId
      );
      branchFromStepId = sourceThought?.id;
    }
    const newBranch: ThinkingBranch = {
      id: uuidv4(), name, parentBranchId: parentBranch?.id, branchFromStepId, createdAt: new Date(),
    };
    session.branches.push(newBranch);
    return newBranch;
  }

  getProgress(session: ThinkingSession): ThinkingProgress {
    const activeBranch = session.branches.find(b => b.id === session.activeBranchId);
    const branchThoughts = session.thoughts.filter(t => t.branchId === session.activeBranchId);
    const conclusions = session.thoughts.filter(t => t.thoughtType === 'conclusion');
    return {
      sessionId: session.id, totalSteps: session.thoughts.length,
      currentStep: branchThoughts.length, branches: session.branches.length,
      activeBranch: activeBranch?.name || DEFAULT_BRANCH_NAME,
      hasMoreThoughts: conclusions.length === 0 || session.status === 'active',
      summary: this.generateQuickSummary(session),
    };
  }

  getSummary(sessionId: string): SessionSummary | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    const branchSummaries: BranchSummary[] = session.branches.map(branch => {
      const branchThoughts = session.thoughts.filter(t => t.branchId === branch.id);
      const thoughtTypes: Record<ThoughtType, number> = {
        observation: 0, analysis: 0, hypothesis: 0, verification: 0,
        refinement: 0, conclusion: 0, question: 0, insight: 0, reflection: 0,
      };
      branchThoughts.forEach(t => { thoughtTypes[t.thoughtType]++; });
      return { id: branch.id, name: branch.name, stepCount: branchThoughts.length, thoughtTypes };
    });
    const timeline: TimelineEntry[] = session.thoughts
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      .map(t => ({
        stepNumber: t.stepNumber, thought: t.thought, type: t.thoughtType,
        branchName: session.branches.find(b => b.id === t.branchId)?.name || DEFAULT_BRANCH_NAME,
        isRevision: t.isRevision,
      }));
    return {
      sessionId: session.id, title: session.title, problem: session.problem,
      totalSteps: session.thoughts.length, branches: branchSummaries,
      keyInsights: session.thoughts.filter(t => t.thoughtType === 'insight').map(t => t.thought),
      conclusions: session.thoughts.filter(t => t.thoughtType === 'conclusion').map(t => t.thought),
      status: session.status, timeline,
    };
  }

  updateSessionStatus(sessionId: string, status: SessionStatus): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    session.status = status;
    session.updatedAt = new Date();
    return true;
  }

  getSession(sessionId: string): ThinkingSession | undefined {
    return this.sessions.get(sessionId);
  }

  listSessions(): Array<{ id: string; title: string; status: SessionStatus; stepCount: number }> {
    return Array.from(this.sessions.values()).map(s => ({
      id: s.id, title: s.title, status: s.status, stepCount: s.thoughts.length,
    }));
  }

  switchBranch(sessionId: string, branchName: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    const branch = session.branches.find(b => b.name === branchName);
    if (!branch) return false;
    session.activeBranchId = branch.id;
    session.updatedAt = new Date();
    return true;
  }

  private inferThoughtType(thought: string): ThoughtType {
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

  private generateTitle(problem: string): string {
    const words = problem.split(' ').slice(0, 6);
    return words.join(' ') + (problem.split(' ').length > 6 ? '...' : '');
  }

  private generateQuickSummary(session: ThinkingSession): string {
    const types = session.thoughts.reduce((acc, t) => {
      acc[t.thoughtType] = (acc[t.thoughtType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const parts: string[] = [];
    if (types.observation) parts.push(`${types.observation} observations`);
    if (types.hypothesis) parts.push(`${types.hypothesis} hypotheses`);
    if (types.insight) parts.push(`${types.insight} insights`);
    if (types.conclusion) parts.push(`${types.conclusion} conclusions`);
    return parts.length > 0 ? parts.join(', ') : 'Starting analysis...';
  }
}

export const sessionManager = new ThinkingSessionManager();
