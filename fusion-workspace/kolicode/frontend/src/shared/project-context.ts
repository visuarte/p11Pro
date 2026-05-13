import rawProjectContext from '../../config/project-context.json';

export interface ContextListItem {
  id: string;
  label: string;
  status?: string;
  path?: string;
  notes?: string;
  reason?: string;
  source?: string;
  note?: string;
}

export interface ExecutionTarget {
  id: string;
  label: string;
  entry: string;
  mode: string;
  status: string;
  commands: string[];
}

export interface RoadmapItem {
  phase: string;
  title: string;
  status: string;
  outcome: string;
}

export interface ProjectContext {
  schemaVersion: number;
  project: {
    name: string;
    slug: string;
    owner: string;
    summary: string;
    status: string;
    updatedAt: string;
    governance: {
      sourceOfTruth: string;
      humanSummary: string;
      derivedViews: string[];
      rule: string;
    };
  };
  currentState: {
    implemented: ContextListItem[];
    notImplemented: ContextListItem[];
    templateOnly: ContextListItem[];
  };
  executionTargets: ExecutionTarget[];
  implementedStack: Record<string, string[]>;
  plannedStack: {
    candidates: string[];
    explicitlyNotCurrent: string[];
  };
  templateOnlyArtifacts: Array<{
    name: string;
    paths: string[];
    policy: string;
  }>;
  roadmap: RoadmapItem[];
}

export const projectContext = rawProjectContext as ProjectContext;
