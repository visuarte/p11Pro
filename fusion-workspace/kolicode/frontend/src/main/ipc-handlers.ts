import { dialog, ipcMain } from 'electron';
import { saveSettings } from './settings-store.js';
import axios from 'axios';

// Create an axios instance for the Bridge
// The Bridge URL should be configurable via environment variable
const bridgeAxios = axios.create({
  baseURL: process.env.BRIDGE_URL || 'http://localhost:8080',
  timeout: 5000,
  // Add headers if needed for authentication
  // headers: { 'Authorization': `Bearer ${process.env.BRIDGE_TOKEN}` }
});

/**
 * Get Bridge health status
 * @returns Promise with bridge status object
 */
export async function getBridgeStatus() {
  try {
    const response = await bridgeAxios.get('/v1/health');
    return response.data;
  } catch (error: any) {
    // Return structured error instead of throwing to maintain IPC contract
    return { 
      status: 'error', 
      version: 'unknown', 
      error: error.message || 'Unknown error' 
    };
  }
}

/**
 * List all projects from the Bridge
 * @returns Promise with array of project objects
 */
export async function listProjects() {
  try {
    const response = await bridgeAxios.get('/v1/projects');
    // Assuming the response is an array of project objects
    // Adjust based on actual Bridge API response format
    return Array.isArray(response.data) ? response.data : [];
  } catch (error: any) {
    console.error('Error listing projects from Bridge:', error);
    throw new Error(`Failed to list projects: ${error.message}`);
  }
}

/**
 * Execute a project via the Bridge
 * @param projectId - The ID of the project to execute
 * @returns Promise with execution result
 */
export async function executeProject(projectId: string) {
  try {
    const response = await bridgeAxios.post(`/v1/projects/${projectId}/execute`);
    return response.data;
  } catch (error: any) {
    console.error(`Error executing project ${projectId}:`, error);
    throw new Error(`Failed to execute project: ${error.message}`);
  }
}

let handlersRegistered = false;

export function registerIpcHandlers() {
  if (handlersRegistered) {
    return;
  }

  handlersRegistered = true;

  // Existing handlers (keep these)
  ipcMain.handle('app:ping', async (_event, arg) => {
    return { pong: true, ts: Date.now(), echo: arg };
  });

  ipcMain.handle('debug:ping-pong', async (_event, arg) => {
    return { ok: true, channel: 'debug:ping-pong', ts: Date.now(), echo: arg };
  });

  ipcMain.handle('app:open-file', async () => {
    const result = await dialog.showOpenDialog({ properties: ['openFile'] });
    return result;
  });

  ipcMain.handle('update-settings', async (_event, nextSettings) => {
    const savedSettings = await saveSettings(nextSettings);
    return { success: true, config: savedSettings };
  });

  ipcMain.on('app:log', (_event, message) => {
    console.log('[renderer]', message);
  });

  // Bridge communication handlers
  ipcMain.handle('bridge:status', async () => {
    return await getBridgeStatus();
  });

  ipcMain.handle('projects:list', async () => {
    return await listProjects();
  });

  ipcMain.handle('execute:project', async (_event, projectId: string) => {
    return await executeProject(projectId);
  });
}