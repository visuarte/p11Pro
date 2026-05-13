/**
 * thunder-utils.js - ThunderKoli Core v2.1
 * Utilidades compartidas para resiliencia y soberanía del sistema.
 */

/**
 * retryWithBackoff
 * Reintenta una función asíncrona con política de retroceso exponencial.
 * @param {Function} fn - Función a ejecutar.
 * @param {Object} options - Opciones de reintento.
 */
async function retryWithBackoff(fn, { 
    attempts = 3, 
    delay = 1000, 
    maxDelay = 3600000, // 1h
    factor = 2,
    onRetry = (err, attempt) => console.log(`[Retry] Intento ${attempt} fallido: ${err.message}`)
} = {}) {
    let currentAttempt = 0;
    let currentDelay = delay;

    while (currentAttempt < attempts) {
        try {
            return await fn();
        } catch (error) {
            currentAttempt++;
            if (currentAttempt >= attempts) throw error;
            
            onRetry(error, currentAttempt);
            
            await new Promise(resolve => setTimeout(resolve, currentDelay));
            currentDelay = Math.min(currentDelay * factor, maxDelay);
        }
    }
}

module.exports = {
    retryWithBackoff
};
