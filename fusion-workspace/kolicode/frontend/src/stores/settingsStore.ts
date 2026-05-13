// stores/settingsStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Tipado de la configuración
export interface SettingsConfig {
  tripleBuffering: boolean;
  gpuMode: 'auto' | 'cpu_only';
  vramLimit: number;
  // ...otros campos críticos (añade según tus tabs)
}

interface SettingsState {
  config: SettingsConfig;
  isUpdating: boolean;
  updateConfig: (updates: Partial<SettingsConfig>) => void;
}

// Estado inicial (puedes cargarlo desde backend o localStorage)
const initialConfig: SettingsConfig = {
  tripleBuffering: false,
  gpuMode: 'auto',
  vramLimit: 2048,
  // ...otros valores por defecto
};

export const useSettingsStore = create<SettingsState>()(
  devtools((set, get) => ({
    config: initialConfig,
    isUpdating: false,
    updateConfig: async (updates: Partial<SettingsConfig>) => {
      const prevConfig = get().config;
      // Optimista: actualiza UI inmediatamente
      set({ config: { ...prevConfig, ...updates }, isUpdating: true });
      try {
        // Simula envo al backend/IPC (reemplaza por tu lgica real)
        const response: any = await window.ipcRenderer?.invoke?.('update-settings', {
          ...prevConfig,
          ...updates,
        });
        if (response && response.success) {
          set({ isUpdating: false });
        } else {
          // Rollback si el Core rechaza el cambio
          set({ config: prevConfig, isUpdating: false });
          window.alert?.('El Core rechaz el cambio: ' + (response?.error || 'Error desconocido'));
        }
      } catch (err: any) {
        // Rollback en error de comunicacin
        set({ config: prevConfig, isUpdating: false });
        window.alert?.('Error de comunicacin con el Core: ' + err.message);
      }
    },
  }))
);
