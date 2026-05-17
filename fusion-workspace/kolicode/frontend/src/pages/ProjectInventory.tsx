import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '../store/useProjectStore';

export function ProjectInventory() {
  const { projects, isLoading, fetchProjects, updateProjectStatus, addProject, deleteProject, executeProject } = useProjectStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleAddProject = async () => {
    const alias = window.prompt('Enter project alias:');
    if (!alias) return;
    const path = window.prompt('Enter project path (optional):') || `/tmp/${alias}`;
    try {
      await addProject({
        alias,
        status: 'active',
        path,
      });
    } catch (error) {
      console.error('Failed to add project:', error);
      alert('Failed to add project. See console for details.');
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (window.confirm(`Are you sure you want to delete project ${id}?`)) {
      try {
        await deleteProject(id);
        // Optionally, show a success message
      } catch (error) {
        console.error('Failed to delete project:', error);
        alert('Failed to delete project. See console for details.');
      }
    }
  };

  const handleExecuteProject = async (id: string) => {
    if (window.confirm(`Are you sure you want to execute project ${id}?`)) {
      try {
        const result = await executeProject(id);
        if (result.success) {
          alert(`Project executed successfully. PID: ${result.pid ?? 'N/A'}`);
        } else {
          alert('Project execution failed.');
        }
      } catch (error) {
        console.error('Failed to execute project:', error);
        alert('Failed to execute project. See console for details.');
      }
    }
  };

  const handleEditProject = (id: string) => {
    navigate(`/editor/${id}`);
  };

  if (isLoading) {
    return <p className="text-center py-8">Loading projects...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Project Inventory</h2>
        <button
          onClick={handleAddProject}
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
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleExecuteProject(project.id)}
                      className="btn btn-outline btn-sm"
                    >
                      Run
                    </button>
                    <button
                      onClick={() => handleEditProject(project.id)}
                      className="btn btn-outline btn-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      className="btn btn-outline btn-sm"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}