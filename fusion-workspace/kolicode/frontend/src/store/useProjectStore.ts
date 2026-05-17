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
      // In a real app, we might want to set an error state or show a notification
    }
  },
  updateProjectStatus: (id: string, status: Project['status']) => set((state) => ({
    projects: state.projects.map(p => p.id === id ? { ...p, status } : p)
  })),
}));