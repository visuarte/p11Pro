import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { app } from 'electron';
import { z } from 'zod';

export const settingsSchema = z.object({
  tripleBuffering: z.boolean(),
  gpuMode: z.enum(['auto', 'cpu_only']),
  vramLimit: z.number().int().min(128).max(65536),
});

export type SettingsConfig = z.infer<typeof settingsSchema>;

const SETTINGS_FILE_NAME = 'settings.json';

function getSettingsFilePath(): string {
  return path.join(app.getPath('userData'), SETTINGS_FILE_NAME);
}

export async function loadSettings(): Promise<SettingsConfig | null> {
  const filePath = getSettingsFilePath();

  try {
    const fileContents = await readFile(filePath, 'utf8');
    return settingsSchema.parse(JSON.parse(fileContents));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }

    throw error;
  }
}

export async function saveSettings(rawSettings: unknown): Promise<SettingsConfig> {
  const parsedSettings = settingsSchema.parse(rawSettings);
  const filePath = getSettingsFilePath();

  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(parsedSettings, null, 2), 'utf8');

  return parsedSettings;
}
