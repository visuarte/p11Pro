
// secureIpcMiddleware.js
// MITIGADOR: Firmas HMAC, verificación de integridad de mensajes IPC
// Middleware para firmar y verificar mensajes IPC con HMAC SHA-256
// ThunderKoli 2026

import crypto from 'crypto';

let sessionSecret = null;

// MITIGADOR: Inicializa el secreto de sesión para firmar/verificar mensajes.
export function setSessionSecret(secret) {
  sessionSecret = secret;
}

// MITIGADOR: Firma el payload con HMAC SHA-256.
export function signPayload(payload) {
  if (!sessionSecret) throw new Error('Session secret no inicializado');
  const hmac = crypto.createHmac('sha256', sessionSecret);
  hmac.update(JSON.stringify(payload));
  return hmac.digest('hex');
}

// MITIGADOR: Adjunta la firma HMAC al payload.
export function attachSignature(payload) {
  return {
    ...payload,
    hmac: signPayload(payload),
  };
}

// MITIGADOR: Verifica la integridad del payload usando HMAC.
export function verifySignature(payload) {
  if (!sessionSecret) throw new Error('Session secret no inicializado');
  const { hmac, ...rest } = payload;
  return hmac === signPayload(rest);
}


// Instrucciones para agentes:
// - Llama a setSessionSecret() al iniciar la sesión IPC.
// - Usa attachSignature() antes de enviar cualquier mensaje IPC.
// - Verifica con verifySignature() en el receptor antes de procesar el payload.

// CHECKLIST QA: Tras modificar este archivo, ejecuta el script de validación QA y revisa la BIBLIA_QA_CHECKLIST.md.
