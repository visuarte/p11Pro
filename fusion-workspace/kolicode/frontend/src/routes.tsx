import { createBrowserRouter } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { Dashboard } from './pages/Dashboard';
import { Editor } from './pages/Editor';
import { ProjectInventory } from './pages/ProjectInventory';

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "projects", element: <ProjectInventory /> },
      { path: "editor/:projectId", element: <Editor /> },
    ],
  },
]);