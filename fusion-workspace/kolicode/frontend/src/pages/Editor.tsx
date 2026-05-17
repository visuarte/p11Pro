import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useProjectStore } from '../store/useProjectStore';

export function Editor() {
  const { projectId } = useParams<{ projectId: string }>();
  const { projects } = useProjectStore();

  // Find the project by id
  const project = projects.find(p => p.id === projectId);

  // We're intentionally not using 'projects' directly here, but we need it for the find operation
  // This is a common pattern and the variable is used indirectly

  useEffect(() => {
    if (projectId) {
      console.log(`Editing project: ${projectId}`);
      // TODO: Load project data and initialize editor
    }
  }, [projectId]);

  return (
    <div className="p-6 bg-white rounded-lg shadow border border-slate-200">
      <h1 className="text-2xl font-bold text-slate-900 mb-4">
        Editor
      </h1>
      {projectId ? (
        <div>
          {project ? (
            <>
              <p className="text-slate-600">Editing project: <strong className="font-mono">{project.alias}</strong></p>
              <p className="text-slate-400">Path: {project.path}</p>
              {/* TODO: Editor UI */}
            </>
          ) : (
            <p className="text-slate-500">Project not found in inventory.</p>
          )}
        </div>
      ) : (
        <p className="text-slate-500">No project ID provided.</p>
      )}
    </div>
  );
}