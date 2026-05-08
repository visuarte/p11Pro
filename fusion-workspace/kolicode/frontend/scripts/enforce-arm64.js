// [TRACE-ID: FASE-10-DEPLOY-002-ARCH]
// Falla rápido y de forma segura si el entorno no es idempotente.
const arch = process.arch;

if (arch !== 'arm64') {
  console.error(`\n[ERROR FATAL] Detectada arquitectura: ${arch}.`);
  console.error(`Para mantener la idempotencia del build nativo, Node.js DEBE ejecutarse en arm64 nativo.`);
  console.error(`Si estás en un Mac M1, asegúrate de no estar usando una terminal con Rosetta 2.\n`);
  process.exit(1);
}

console.log('[INFO] Entorno idempotente verificado: Node.js está corriendo en Apple Silicon (arm64).');
process.exit(0);

