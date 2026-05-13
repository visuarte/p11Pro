import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8040',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    outDir: "dist"
  }
});