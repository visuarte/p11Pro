// stores/settingsStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { electronBridge } from '../renderer/electronBridge';

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
  updateConfig: (updates: Partial<SettingsConfig>) => Promise<void>;
}

// Estado inicial (puedes cargarlo desde backend o localStorage)
const initialConfig: SettingsConfig = {
  tripleBuffering: false,
  gpuMode: 'auto',
  vramLimit: 2048,
  // ...otros valores por defecto
};

interface UpdateSettingsResponse {
  success: boolean;
  config?: SettingsConfig;
  error?: string;
}

export const useSettingsStore = create<SettingsState>()(
  devtools((set, get) => ({
    config: initialConfig,
    isUpdating: false,
    updateConfig: async (updates: Partial<SettingsConfig>) => {
      const prevConfig = get().config;
      const nextConfig = { ...prevConfig, ...updates };

      set({ config: nextConfig, isUpdating: true });

      if (!electronBridge.isElectron()) {
        set({ isUpdating: false });
        return;
      }

      try {
        const response = await window.electron!.invoke<UpdateSettingsResponse>('update-settings', nextConfig);

        if (response && response.success) {
          set({ config: response.config ?? nextConfig, isUpdating: false });
        } else {
          set({ config: prevConfig, isUpdating: false });
          window.alert?.('El Core rechazo el cambio: ' + (response?.error || 'Error desconocido'));
        }
      } catch (err) {
        set({ config: prevConfig, isUpdating: false });
        const message = err instanceof Error ? err.message : 'Error desconocido';
        window.alert?.('Error de comunicacion con el Core: ' + message);
      }
    },
  }))
);
