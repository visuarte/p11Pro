import { useEffect } from 'react';
import { useProjectStore } from '../store/useProjectStore';

export function useProjects() {
  const { projects, isLoading, fetchProjects } = useProjectStore();

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return { projects, isLoading, refetch: fetchProjects };
}