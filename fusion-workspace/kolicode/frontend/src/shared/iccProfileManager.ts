// utils/iccProfileManager.ts
// Utilidad para gestión dinámica de perfiles ICC en frontend (Node/Electron compatible)

import fs from 'fs';
import path from 'path';

const ICC_INPUT_DIR = path.resolve(__dirname, '../../../../iccprofiles/input');
const ICC_OUTPUT_DIR = path.resolve(__dirname, '../../../../iccprofiles/output');

export type IccProfile = {
  name: string;
  type: 'input' | 'output';
  path: string;
};

export function listIccProfiles(): IccProfile[] {
  const inputProfiles = fs.readdirSync(ICC_INPUT_DIR)
    .filter(f => f.endsWith('.icc') || f.endsWith('.icm'))
    .map(f => ({ name: f, type: 'input' as const, path: path.join(ICC_INPUT_DIR, f) }));
  const outputProfiles = fs.readdirSync(ICC_OUTPUT_DIR)
    .filter(f => f.endsWith('.icc') || f.endsWith('.icm'))
    .map(f => ({ name: f, type: 'output' as const, path: path.join(ICC_OUTPUT_DIR, f) }));
  return [...inputProfiles, ...outputProfiles];
}

export function importIccProfile(filePath: string, type: 'input' | 'output'): string {
  const destDir = type === 'input' ? ICC_INPUT_DIR : ICC_OUTPUT_DIR;
  const fileName = path.basename(filePath);
  const destPath = path.join(destDir, fileName);
  fs.copyFileSync(filePath, destPath);
  return destPath;
}

export function exportIccProfile(profileName: string, type: 'input' | 'output', destPath: string): void {
  const srcDir = type === 'input' ? ICC_INPUT_DIR : ICC_OUTPUT_DIR;
  const srcPath = path.join(srcDir, profileName);
  fs.copyFileSync(srcPath, destPath);
}

