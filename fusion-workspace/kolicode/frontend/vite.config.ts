import { cp, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { defineConfig } from "vite";

const mirrorTargets = [
  ["docs", "dist/docs"],
  ["creative", "dist/creative"],
  ["config", "dist/config"],
  ["src/assets", "dist/src/assets"]
] as const;

function mirrorWorkspaceArtifacts() {
  return {
    name: "mirror-workspace-artifacts",
    async closeBundle() {
      for (const [from, to] of mirrorTargets) {
        const source = resolve(__dirname, from);
        const target = resolve(__dirname, to);

        await mkdir(dirname(target), { recursive: true });
        await cp(source, target, { recursive: true, force: true });
      }
    }
  };
}

export default defineConfig({
  plugins: [mirrorWorkspaceArtifacts()]
});
