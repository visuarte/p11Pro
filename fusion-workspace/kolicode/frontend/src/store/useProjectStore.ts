import { create } from 'zustand';
import { ProjectService } from '../services/ProjectService';

export interface Project {
  id: string;
  alias: string;
  status: 'active' | 'archived' | 'candidato';
  path: string;
}

interface ProjectState {
  projects: Project[];
  isLoading: boolean;
  fetchProjects: () => Promise<void>;
  updateProjectStatus: (id: string, status: Project['status']) => void;
  addProject: (project: Omit<Project, 'id'>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  executeProject: (id: string) => Promise<{ success: boolean; pid?: number }>;
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  isLoading: false,
  fetchProjects: async () => {
    set({ isLoading: true });
    try {
      const data = await ProjectService.getAllProjects();
      set({ projects: data, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      console.error('Failed to fetch projects:', error);
    }
  },
  updateProjectStatus: (id: string, status: Project['status']) => set((state) => ({
    projects: state.projects.map(p => p.id === id ? { ...p, status } : p)
  })),
  addProject: async (project) => {
    try {
      const newProject = await ProjectService.createProject(project);
      set((state) => ({
        projects: [...state.projects, newProject],
      }));
    } catch (error) {
      console.error('Failed to add project:', error);
      throw error;
    }
  },
  deleteProject: async (id) => {
    try {
      await ProjectService.deleteProject(id);
      set((state) => ({
        projects: state.projects.filter(p => p.id !== id),
      }));
    } catch (error) {
      console.error('Failed to delete project:', error);
      throw error;
    }
  },
  executeProject: async (id) => {
    try {
      const result = await ProjectService.executeProject(id);
      return result;
    } catch (error) {
      console.error('Failed to execute project:', error);
      throw error;
    }
  },
}));