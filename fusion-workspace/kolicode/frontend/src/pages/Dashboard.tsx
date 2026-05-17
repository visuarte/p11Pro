import { useEffect } from 'react';
import { useProjectStore } from '../store/useProjectStore';

export function Dashboard() {
  const { projects, isLoading } = useProjectStore();

  useEffect(() => {
    if (window.koliAPI) {
      // We can fetch projects here if needed, but MainLayout already does it.
      // Alternatively, we can just use the store.
    }
  }, []);

  return (
    <div className="p-6 bg-white rounded-lg shadow border border-slate-200">
      <h1 className="text-2xl font-bold text-slate-900 mb-4">
        Welcome to KoliCode Dashboard
      </h1>
      <p className="text-slate-600 mb-6">
        This is the main dashboard. Use the sidebar to navigate to the project inventory or editor.
      </p>

      {isLoading ? (
        <p className="text-center py-8">Loading...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-slate-50 p-4 rounded border border-slate-200">
            <h3 className="font-semibold text-slate-900 mb-2">Total Projects</h3>
            <p className="text-3xl font-bold text-indigo-600">{projects.length}</p>
          </div>
          <div className="bg-slate-50 p-4 rounded border border-slate-200">
            <h3 className="font-semibold text-slate-900 mb-2">Active Projects</h3>
            <p className="text-3xl font-bold text-emerald-600">
              {projects.filter(p => p.status === 'active').length}
            </p>
          </div>
          <div className="bg-slate-50 p-4 rounded border border-slate-200">
            <h3 className="font-semibold text-slate-900 mb-2">Archived Projects</h3>
            <p className="text-3xl font-bold text-slate-600">
              {projects.filter(p => p.status === 'archived').length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}