export interface KoliAPI {
  getBridgeStatus: () => Promise<{ status: string; version: string }>;
  listProjects: () => Promise<any[]>;
  onProjectUpdate: (callback: any) => void;
  createProject: (project: any) => Promise<any>;
  deleteProject: (projectId: string) => Promise<any>;
  executeProject: (projectId: string) => Promise<any>;
}

declare global {
  interface Window {
    koliAPI: KoliAPI;
  }
}