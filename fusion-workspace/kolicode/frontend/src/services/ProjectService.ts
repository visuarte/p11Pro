import { Project } from '../store/useProjectStore';

/**
 * Orquestador de lógica de proyectos. 
 * Abstrae las llamadas al window.koliAPI (IPC).
 */
export const ProjectService = {
  async getAllProjects(): Promise<Project[]> {
    try {
      const projects = await window.koliAPI.listProjects();
      return projects.map((p: any) => ({
        id: p.id || p.internal_alias || '',
        alias: p.alias || p.internal_alias || p.id || '',
        status: p.status as 'active' | 'archived' | 'candidato',
        path: p.absolute_path || ''
      }));
    } catch (error) {
      console.error("Error fetching projects via IPC:", error);
      throw error;
    }
  },

  async executeProject(id: string): Promise<{ success: boolean; pid?: number }> {
    return await window.koliAPI.executeProject(id);
  }
};