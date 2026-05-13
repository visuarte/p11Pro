# 🚀 CHECKLIST EJECUTABLE: VALIDACIÓN Y PRIMER BUILD MULTIPLATAFORMA
**[TRACE-ID: FASE-10-DEPLOY-001]**

Este documento es el procedimiento estándar operativo (SOP) para ejecutar la primera compilación real del proyecto. Sigue los pasos secuencialmente. Si un paso falla, no avances al siguiente; ve a la sección de Troubleshooting.

## Fase 1: Validación Local (Dry-Run)
Ejecuta estos pasos en tu máquina principal (Mac M1) antes de empujar a GitHub Actions.

- [ ] **1. Limpieza profunda:** Asegúrate de que no haya artefactos de compilaciones antiguas que contaminen el entorno.
  ```bash
  rm -rf node_modules package-lock.json dist build
  npm cache clean --force
  ```
- [ ] **2. Instalación limpia:** Recrea el árbol de dependencias y el lockfile.
  ```bash
  npm install
  ```
- [ ] **3. Validación de Lockfile:** Ejecuta el script que acabas de crear para confirmar que todo es reproducible.
  ```bash
  ./scripts/validate-lockfile.sh
  ```
- [ ] **4. Validación de Build Local:** Ejecuta el pre-test y la validación de sintaxis/dependencias.
  ```bash
  npm run validate:build
  ```

## Fase 2: Compilación Local de Prueba (Mac M1 -> DMG)
Vamos a probar que electron-builder logra empaquetar la versión de tu sistema operativo actual.

- [ ] **1. Construir el Frontend/Backend:** Compila el código fuente (Vite/React, tsc, etc.) a la carpeta dist.
  ```bash
  npm run build
  ```
- [ ] **2. Empaquetar con Electron Builder:** Genera el archivo DMG (específico para arm64 en tu caso).
  ```bash
  npm run electron:build -- --mac --arm64
  ```
- [ ] **3. Prueba de Humo:** Abre el .dmg generado en la carpeta dist o release, instálalo y verifica que la aplicación arranca y el Bridge C++/Python no lanza errores en consola.

## Fase 3: Prueba de Fuego (GitHub Actions CI/CD)
Si funciona en tu Mac, es hora de probar Windows y Linux en la nube.

- [ ] **1. Commit del código:** Asegúrate de que el workflow .github/workflows/build.yml está en tu commit.
  ```bash
  git add .
  git commit -m "feat(ci): [FASE-10-DEPLOY-001] Primera prueba de build multiplataforma en CI"
  git push origin main
  ```
- [ ] **2. Monitoreo:** Abre la pestaña "Actions" en GitHub. Revisa los logs en tiempo real de los runners de ubuntu-latest, macos-latest y windows-latest.

---

## 🛠️ TROUBLESHOOTING ESPECÍFICO (Primeros Auxilios)

**Error 1: Módulos Nativos de C++ no coinciden con la versión de Node de Electron**
- Síntoma: El build funciona, pero la app lanza una pantalla blanca o un error en consola que dice was compiled against a different Node.js version using NODE_MODULE_VERSION.
- Solución: Tienes que recompilar los binarios C++ específicamente para la versión de V8 que usa Electron.
  ```bash
  npx electron-rebuild -f -w tu_modulo_nativo_c++
  # O si usas node-gyp directamente:
  npm rebuild --runtime=electron --target=28.0.0 --disturl=https://electronjs.org/headers
  ```

**Error 2: Permisos denegados en los scripts .sh**
- Síntoma: GitHub Actions o tu terminal dicen Permission denied al intentar ejecutar validate-build.sh.
- Solución: Los scripts bash pierden sus permisos de ejecución en Git si no se configuran bien. Devuélveles el poder:
  ```bash
  chmod +x scripts/*.sh
  git update-index --chmod=+x scripts/validate-build.sh
  git update-index --chmod=+x scripts/validate-lockfile.sh
  git commit -m "fix(ci): [FASE-10-DEPLOY-002] Arreglar permisos de ejecución de scripts"
  ```

**Error 3: Fallo en la Firma de Código (Code Signing) en macOS**
- Síntoma: El build en macOS falla al final del proceso de electron-builder quejándose de Identity name o Apple Certificates.
- Solución (Modo Desarrollo): Para saltarte la firma mientras haces pruebas (no válido para enviar a la App Store), dile a electron-builder que ignore el firmado temporalmente.
  ```bash
  CSC_IDENTITY_AUTO_DISCOVERY=false npm run electron:build -- --mac --arm64
  ```

