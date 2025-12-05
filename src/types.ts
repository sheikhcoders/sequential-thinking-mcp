/**
 * Sequential Thinking MCP Server - Type Definitions
 *
 * Defines the core data structures for the sequential thinking process.
 */

export interface ThoughtStep {
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

export type ThoughtType =
  | 'observation'
  | 'analysis'
  | 'hypothesis'
  | 'verification'
  | 'refinement'
  | 'conclusion'
  | 'question'
  | 'insight'
  | 'reflection';

export interface ThinkingBranch {
  id: string;
  name: string;
  parentBranchId?: string;
  branchFromStepId?: string;
  createdAt: Date;
  description?: string;
}

export interface ThinkingSession {
  id: string;
  title: string;
  problem: string;
  thoughts: ThoughtStep[];
  branches: ThinkingBranch[];
  activeBranchId: string;
  createdAt: Date;
  updatedAt: Date;
  status: SessionStatus;
  metadata?: Record<string, unknown>;
}

export type SessionStatus = 'active' | 'paused' | 'completed' | 'abandoned';

export interface ThinkingProgress {
  sessionId: string;
  totalSteps: number;
  currentStep: number;
  branches: number;
  activeBranch: string;
  hasMoreThoughts: boolean;
  summary?: string;
}

export interface AddThoughtInput {
  sessionId?: string;
  thought: string;
  thoughtType?: ThoughtType;
  isRevision?: boolean;
  revisesStep?: number;
  branchId?: string;
  branchFromStep?: number;
  newBranchName?: string;
  confidence?: number;
  tags?: string[];
  nextThoughtNeeded: boolean;
}

export interface AddThoughtResult {
  sessionId: string;
  stepNumber: number;
  totalSteps: number;
  activeBranch: string;
  branchCount: number;
  thoughtRecorded: string;
  thoughtType: ThoughtType;
  isRevision: boolean;
  nextThoughtNeeded: boolean;
  progress: ThinkingProgress;
}

export interface SessionSummary {
  sessionId: string;
  title: string;
  problem: string;
  totalSteps: number;
  branches: BranchSummary[];
  keyInsights: string[];
  conclusions: string[];
  status: SessionStatus;
  timeline: TimelineEntry[];
}

export interface BranchSummary {
  id: string;
  name: string;
  stepCount: number;
  thoughtTypes: Record<ThoughtType, number>;
}

export interface TimelineEntry {
  stepNumber: number;
  thought: string;
  type: ThoughtType;
  branchName: string;
  isRevision: boolean;
}
