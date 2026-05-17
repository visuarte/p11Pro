export interface KoliAPI {
  getBridgeStatus: () => Promise<{ status: string; version: string }>;
  listProjects: () => Promise<any[]>;
  onProjectUpdate: (callback: any) => void;
  executeProject: (projectId: string) => Promise<any>;
}

declare global {
  interface Window {
    koliAPI: KoliAPI;
  }
}