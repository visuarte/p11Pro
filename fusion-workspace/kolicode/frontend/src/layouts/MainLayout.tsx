import { NavLink, Outlet } from 'react-router-dom';
import { useProjectStore } from '../store/useProjectStore';
import { useEffect } from 'react';
import { useBridgeHealth } from '../hooks/useBridgeHealth';

export function MainLayout() {
  const { fetchProjects, isLoading } = useProjectStore();
  const { status, error, isLoading: bridgeLoading } = useBridgeHealth();

  // Fetch projects on mount
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">
            KoliCode <span className="text-indigo-600">Project Manager</span>
          </h1>
          
          <nav className="space-y-2">
            <NavLink 
              to="/" 
              end 
              className={( { isActive }: { isActive: boolean }) => `
                flex items-center px-3 py-2 rounded-md text-sm font-medium 
                ${isActive ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'}
              `}
            >
              Dashboard
            </NavLink>
            <NavLink 
              to="/projects" 
              className={( { isActive }: { isActive: boolean }) => `
                flex items-center px-3 py-2 rounded-md text-sm font-medium 
                ${isActive ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'}
              `}
            >
              Proyecto Inventory
            </NavLink>
          </nav>
          
          {/* Loading indicator for projects fetch */}
          {isLoading && (
            <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
              <div className="h-3 w-3 animate-spin border-2 border-slate-300 border-t-transparent rounded-full"></div>
              <span>Updating project list...</span>
            </div>
          )}
        </div>
        
        {/* Bridge Status Indicator */}
        <div className="mt-auto p-4 border-t border-slate-200">
          <div className="flex items-center gap-2 text-sm">
            <div className={`w-3 h-3 rounded-full ${status && (status.status === 'OK' || status.status === 'online') ? 'bg-emerald-500' : status && status.status ? 'bg-amber-500' : 'bg-slate-400'}`}>
              {/* Status indicator */}
            </div>
            <span id="bridge-status-text">
              {bridgeLoading ? 'Checking...' : error ? `Error: ${error}` : status ? status.status : 'Unknown'}
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}