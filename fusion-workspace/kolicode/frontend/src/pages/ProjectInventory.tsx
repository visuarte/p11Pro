import { useEffect } from 'react';
import { useProjectStore } from '../store/useProjectStore';

export function ProjectInventory() {
  const { projects, isLoading, fetchProjects, updateProjectStatus } = useProjectStore();

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  if (isLoading) {
    return <p className="text-center py-8">Loading projects...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Project Inventory</h2>
        <button
          onClick={() => {
            // Placeholder for adding a new project
            alert('Add project functionality not implemented yet');
          }}
          className="btn btn-primary"
        >
          Add Project
        </button>
      </div>

      {projects.length === 0 ? (
        <p className="text-center text-slate-500 py-8">No projects found.</p>
      ) : (
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              <th className="p-4 border-b border-slate-200 text-slate-600 text-left">Alias</th>
              <th className="p-4 border-b border-slate-200 text-slate-600 text-left">Status</th>
              <th className="p-4 border-b border-slate-200 text-slate-600 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {projects.map((project) => (
              <tr key={project.id} className="hover:bg-slate-50">
                <td className="p-4 font-mono text-sm">{project.alias}</td>
                <td className="p-4 text-sm">
                  <select
                    value={project.status}
                    onChange={(e) => {
                      updateProjectStatus(project.id, e.target.value as any);
                    }}
                    className="border border-slate-300 rounded px-2 py-1 bg-white text-slate-800"
                  >
                    <option value="active">Active</option>
                    <option value="archived">Archived</option>
                    <option value="candidato">Candidate</option>
                  </select>
                </td>
                <td className="p-4 text-sm space-x-2">
                  <button
                    onClick={() => {
                      // Placeholder for managing project
                      alert(`Manage project ${project.alias}`);
                    }}
                    className="btn btn-outline btn-sm"
                  >
                    Manage
                  </button>
                  <button
                    onClick={() => {
                      // Navigate to editor for this project
                      // We'll use navigate from react-router-dom, but we don't have it here.
                      // For now, we'll just alert.
                      alert(`Navigate to editor for ${project.alias}`);
                    }}
                    className="btn btn-outline btn-sm"
                  >
                    Editor
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}