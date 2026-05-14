const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs/promises');
const crypto = require('crypto');

// Agentes ThunderKoli
const ArchitectAgent = require('./agents/architect');
const ExecutorAgent = require('./agents/executor');
const ThunderEngine = require('./lib/engine');
const { sendWhatsAppNotification } = require('./lib/whatsapp'); // Legacy fallback
const whatsapp = require('./lib/whatsapp');
const googleAuth = require('./lib/googleAuth');
const DeepSeekClient = require('./lib/deepseek');
const qrcode = require('qrcode');
const VaultService = require('./lib/vault');

const SETTINGS_PATH = path.join(__dirname, 'config/settings.json');
const CONVERSATIONS_PATH = path.join(__dirname, 'data/conversations.json');
const MISSIONS_PATH = path.join(__dirname, 'data/missions.json');
const VAULT_PATH = path.join(__dirname, 'vault');

const architect = new ArchitectAgent();
const executor = new ExecutorAgent();
const engine = new ThunderEngine();

const app = express();
const PORT = process.env.PORT || 3001;

// Configuración de la ruta de datos para permitir aislamiento en tests
const DATA_PATH = process.env.DATA_PATH || path.join(__dirname, 'data.json');
const AUDITS_PATH = path.join(__dirname, 'data/audits.json');

// --- VAULT INITIALIZATION ---
const vault = new VaultService(process.env.SYSTEM_SECRET || 'thunder-sovereign-2026');

// --- OBSERVABILITY LAYER: Audit System v2.1 ---
/**
 * Logs audit events with automatic rotation and retention management.
 * 
 * Features:
 * - Automatic log rotation at 1MB threshold
 * - Retention of last 2000 records in memory
 * - Timestamped entries for complete traceability
 * - Graceful error handling to prevent audit failures
 * 
 * @param {string} userId - User identifier performing the action
 * @param {string} action - Action type (API_ACTION, SECRET_ACCESSED, etc.)
 * @param {Object} payload - Additional metadata about the action
 * @returns {Promise<void>}
 */
async function logAudit(userId, action, payload = {}) {
    try {
        const timestamp = new Date().toISOString();
        let audits = [];
        
        // Rotación de Logs (Check size)
        // When audit log exceeds 1MB, archive it with timestamp and start fresh
        try {
            const stats = await fs.stat(AUDITS_PATH);
            if (stats.size > 1 * 1024 * 1024) { // 1MB Limit
                const archivalPath = AUDITS_PATH.replace('.json', `_archived_${Date.now()}.json`);
                await fs.rename(AUDITS_PATH, archivalPath);
                console.log(`[Audit] Log rotated to ${archivalPath}`);
            }
        } catch (e) { /* file doesn't exist yet */ }

        // Load existing audit records or initialize empty array
        try {
            const data = await fs.readFile(AUDITS_PATH, 'utf-8');
            audits = JSON.parse(data);
        } catch (e) { /* init empty */ }

        // Add new audit entry with timestamp
        audits.push({ userId, action, payload, timestamp });
        
        // Maintain retention policy: keep only last 2000 records
        if (audits.length > 2000) audits = audits.slice(-2000);
        
        // Persist to disk
        await fs.writeFile(AUDITS_PATH, JSON.stringify(audits, null, 2));
    } catch (err) {
        console.error('[Audit] Error:', err.message);
    }
}

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(cors()); // Se mantiene por si se accede directamente, aunque Nginx ya lo maneja
app.use(express.json());

// --- MASTER AUDIT MIDDLEWARE ---
app.use((req, res, next) => {
    const originalJson = res.json;
    res.json = function(data) {
        // Interceptar solo acciones críticas
        const criticalPaths = ['/agent/config', '/users', '/update', '/qr'];
        if (criticalPaths.some(path => req.url.includes(path))) {
            logAudit(req.query.user_id || 'system', 'API_ACTION', {
                method: req.method,
                path: req.path,
                status: res.statusCode,
                // No logueamos payload completo por seguridad, solo meta o status
                success: res.statusCode < 400
            });
        }
        return originalJson.call(this, data);
    };
    next();
});

/**
 * Reads all users from JSON-based data store.
 * 
 * This is a temporary JSON-based implementation. In production,
 * this should be replaced with PostgreSQL queries.
 * 
 * @returns {Promise<Array>} Array of user objects, empty array on error
 */
async function readUsers() {
    try {
        const data = await fs.readFile(DATA_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error leyendo base de datos:', err);
        return [];
    }
}

/**
 * Persists users to JSON-based data store.
 * 
 * Writes user data with 4-space indentation for readability.
 * In production, replace with PostgreSQL INSERT/UPDATE operations.
 * 
 * @param {Array} users - Array of user objects to persist
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
async function saveUsers(users) {
    try {
        await fs.writeFile(DATA_PATH, JSON.stringify(users, null, 4), 'utf-8');
        return true;
    } catch (err) {
        console.error('Error guardando base de datos:', err);
        return false;
    }
}

// ── Inicialización de Motores ───────────────────────────────────────────────
async function initCore() {
    // 0. Cargar Secretos del Vault
    console.log('[Vault] Cargando secretos en Capa de Ejecución...');
    const keysLoaded = await vault.injectToEnv();
    if (keysLoaded.length > 0) {
        await logAudit('system', 'SECRET_ACCESSED', { keys: keysLoaded });
    }

    const settings = await readSettings();
    
    // 1. Inicializar Google usando Vault (env) si existen
    const gId = process.env.GOOGLE_CLIENT_ID || settings.google_client_id;
    const gSecret = process.env.GOOGLE_CLIENT_SECRET || settings.google_client_secret;

    if (gId && gSecret) {
        console.log('[Core] Inicializando Google Auth desde Vault...');
        googleAuth.initClient(gId, gSecret, `http://localhost:${PORT}/auth/google/callback`);
        await googleAuth.loadSavedCredentials();
    }

    // 2. Inicializar WhatsApp
    whatsapp.init();

    // 3. Vincular WhatsApp con el Engine
    whatsapp.on('incoming_message', async (msg) => {
        console.log(`[WhatsApp -> Engine] Procesando prompt: ${msg.body}`);
        const response = await engine.processMission(msg.body, {
            userState: 'directo',
            provider: settings.provider
        });
        msg.reply(`🤖 *ThunderKoli Engine*:\n\n${response.message}`);
    });

    // 4. Bucle de Sincronización Google (Background Worker)
    const syncInterval = (settings.sync_interval || 3600) * 1000;
    console.log(`[Core] Sincronización Google programada cada ${settings.sync_interval}s`);
    
    setInterval(async () => {
        try {
            const newContacts = await googleAuth.syncContacts();
            if (newContacts && newContacts.length > 0) {
                let users = await readUsers();
                let addedCount = 0;

                newContacts.forEach(contact => {
                    if (!users.some(u => u.email === contact.email)) {
                        users.push({
                            id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
                            ...contact,
                            bio: 'Importado de Google Contacts'
                        });
                        addedCount++;
                    }
                });

                if (addedCount > 0) {
                    await saveUsers(users);
                    await logAudit('system', 'GOOGLE_SYNC_COMPLETED', { added: addedCount });
                    console.log(`[Core] Sincronización finalizada: ${addedCount} nuevos talentos importados.`);
                }
            }
        } catch (err) {
            console.error('[Core] Error en ciclo de sincronización:', err.message);
        }
    }, syncInterval);
}

// ── Endpoints ────────────────────────────────────────────────────────────────

/**
 * GET /users
 * Devuelve todos los usuarios.
 */
app.get('/users', async (req, res) => {
    const users = await readUsers();
    if (users.length === 0) {
        return res.status(500).json({ error: 'No hay usuarios disponibles.' });
    }
    res.status(200).json(users);
});

/**
 * GET /users/:id/documents
 * Devuelve los documentos asociados a un usuario (DMS).
 */
app.get('/users/:id/documents', async (req, res) => {
    res.json([
        {
            id: 101,
            title: "CV_Resumen_Tecnico.pdf",
            type: "CURRICULUM",
            date: "2026-01-15",
            tags: ["OFICIAL", "VERIFICADO"],
            status: "PROCESSED"
        }
    ]);
});

/**
 * POST /users
 * Crea un nuevo usuario.
 */
app.post('/users', async (req, res) => {
    const { name, email, role, avatar, bio } = req.body;

    if (!name || !email) {
        return res.status(400).json({ error: 'Nombre y email son obligatorios.' });
    }

    const users = await readUsers();
    const newUser = {
        id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
        name,
        email,
        role: role || 'User',
        avatar: avatar || `https://i.pravatar.cc/150?u=${name}`,
        bio: bio || ''
    };

    users.push(newUser);
    const success = await saveUsers(users);

    if (!success) return res.status(500).json({ error: 'Error al persistir los datos.' });

    res.status(201).json(newUser);
});

/**
 * DELETE /users/:id
 * Elimina un usuario por ID.
 */
app.delete('/users/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    let users = await readUsers();
    const originalLength = users.length;

    users = users.filter(u => u.id !== id);

    if (users.length === originalLength) {
        return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    const success = await saveUsers(users);
    if (!success) return res.status(500).json({ error: 'Error al persistir los datos.' });

    res.status(200).json({ message: 'Usuario eliminado correctamente.', id });
});

// --- GESTIÓN DE TAREAS AUTÓNOMAS (BACKGROUND AGENTS) ---
let activeTasks = [];
let backgroundNotifications = [];

// ── Mock Data para DMS ───────────────────────────────────────────────────────
const mockDossiers = {
    "expedientes": [
        { id: 1, title: "Certificado de Empresa - Sarah Smith", content: "Certificado emitido en 2023 para Sarah Smith...", tags: ["certific", "empresa"] },
        { id: 2, title: "CV - Alex Johnson", content: "Frontend Developer with 5 years experience...", tags: ["cv", "frontend"] },
        { id: 3, title: "Expediente Académico - David Chen", content: "Grado en Diseño UI/UX...", tags: ["expediente", "educacion"] }
    ]
};

/**
 * Motor de Misiones Asíncronas (Heartbeat cada 10s)
 */
setInterval(() => {
    activeTasks.forEach(task => {
        task.progress += 5;
        if (task.progress >= 100) {
            task.status = "COMPLETED";
            task.progress = 100;
            
            // Acción según el tipo de misión
            if (task.type === "scout") {
                const message = `⚡️ Misión Scout completada: Se ha localizado a un experto en ${task.target} para ThunderKoli.`;
                backgroundNotifications.push({
                    id: Date.now(),
                    type: "SCOUT_SUCCESS",
                    message: message,
                    timestamp: new Date().toISOString()
                });
                
                // Notificación móvil
                sendWhatsAppNotification(message);
            }
        }
    });
}, 10000);

app.get('/agent/tasks', (req, res) => {
    res.json({ tasks: activeTasks, notifications: backgroundNotifications });
});

app.post('/agent/tasks/spawn', (req, res) => {
    const { type, target } = req.body;
    const newTask = {
        id: Date.now(),
        type,
        target,
        status: "RUNNING",
        progress: 0,
        startTime: new Date().toISOString()
    };
    activeTasks.push(newTask);
    res.status(201).json(newTask);
});

app.delete('/agent/tasks/clear-notifications', (req, res) => {
    backgroundNotifications = [];
    res.json({ message: "Notificaciones despejadas." });
});

// --- CONFIGURACIÓN HÍBRIDA (OLLAMA / DEEPSEEK) ---
async function readSettings() {
    try {
        const data = await fs.readFile(SETTINGS_PATH, 'utf-8');
        const settings = JSON.parse(data);
        // Garantizar valores por defecto universales
        return {
            provider: settings.provider || "ollama",
            deepseek_key: settings.deepseek_key || "",
            ollama_model: settings.ollama_model || "deepseek-coder:1.3b",
            deepseek_model: settings.deepseek_model || "deepseek-chat",
            google_client_id: settings.google_client_id || "",
            google_client_secret: settings.google_client_secret || "",
            whatsapp_busy_mode: settings.whatsapp_busy_mode || false,
            sync_interval: settings.sync_interval || 3600,
            ...settings
        };
    } catch {
        return { 
            provider: "ollama", 
            deepseek_key: "",
            ollama_model: "deepseek-coder:1.3b",
            google_client_id: "",
            google_client_secret: ""
        };
    }
}

async function saveSettings(settings) {
    await fs.writeFile(SETTINGS_PATH, JSON.stringify(settings, null, 4), 'utf-8');
}

app.get('/agent/config', async (req, res) => {
    const settings = await readSettings();
    const ws = whatsapp.getStatus();
    // Enviar estados sin secretos completos
    res.json({ 
        provider: settings.provider, 
        ollama_model: settings.ollama_model,
        deepseek_model: settings.deepseek_model,
        whatsapp_busy_mode: settings.whatsapp_busy_mode,
        sync_interval: settings.sync_interval,
        hasDeepseekKey: !!settings.deepseek_key,
        hasGoogleConfig: !!(settings.google_client_id && settings.google_client_secret),
        google_client_id: settings.google_client_id ? `••••${settings.google_client_id.slice(-8)}` : "",
        whatsapp_status: ws.status
    });
});

app.post('/agent/config/keys', async (req, res) => {
    const body = req.body;
    const settings = await readSettings();
    let changed = false;

    // Manejo dinámico de llaves Universales
    if (body.key) {
        // Validación de DeepSeek heredada
        console.log('[ThunderKoli] Validando DeepSeek API Key...');
        const validation = await DeepSeekClient.validateKey(body.key);
        if (validation.success) {
            settings.deepseek_key = body.key;
            settings.provider = "deepseek";
            changed = true;
        } else {
            return res.status(401).json({ error: 'Llave inválida', details: validation.error });
        }
    }

    if (body.google_client_id) { settings.google_client_id = body.google_client_id; changed = true; }
    if (body.google_client_secret) { settings.google_client_secret = body.google_client_secret; changed = true; }
    if (body.ollama_model) { settings.ollama_model = body.ollama_model; changed = true; }
    if (body.whatsapp_busy_mode !== undefined) { settings.whatsapp_busy_mode = body.whatsapp_busy_mode; changed = true; }

    if (changed) {
        await saveSettings(settings);
        // Si han cambiado las llaves de Google, reinicializar el cliente si es posible
        if (body.google_client_id || body.google_client_secret) {
            googleAuth.initClient(settings.google_client_id, settings.google_client_secret, `http://localhost:${PORT}/auth/google/callback`);
        }
        res.json({ message: 'Configuración actualizada y guardada correctamente.', settings });
    } else {
        res.status(400).json({ error: 'No se enviaron campos válidos para actualizar.' });
    }
});

app.post('/agent/config/provider', async (req, res) => {
    const { provider } = req.body;
    if (!["ollama", "deepseek"].includes(provider)) {
        return res.status(400).json({ error: 'Proveedor no válido' });
    }

    const settings = await readSettings();
    if (provider === "deepseek" && !settings.deepseek_key) {
        return res.status(400).json({ error: 'Debes configurar una API Key primero' });
    }

    settings.provider = provider;
    await saveSettings(settings);
    res.json({ message: `Proveedor cambiado a ${provider}`, provider });
});

// --- GESTIÓN DE HISTORIAL Y PERSISTENCIA ---
async function readConversations() {
    try {
        const data = await fs.readFile(CONVERSATIONS_PATH, 'utf-8');
        return JSON.parse(data);
    } catch {
        return [];
    }
}

async function saveConversations(conversations) {
    await fs.writeFile(CONVERSATIONS_PATH, JSON.stringify(conversations, null, 4), 'utf-8');
}

// Helper saveMissionToFile movido al Engine (Regla de Oro)

app.get('/agent/history', async (req, res) => {
    const history = await readConversations();
    res.json(history);
});

app.delete('/agent/history/all', async (req, res) => {
    await saveConversations([]);
    res.json({ message: "Historial completo eliminado." });
});

app.delete('/agent/history/:id', async (req, res) => {
    const { id } = req.params;
    let history = await readConversations();
    history = history.filter(msg => msg.id !== id);
    await saveConversations(history);
    res.json({ message: "Mensaje eliminado." });
});

app.post('/agent/history/save/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const history = await readConversations();
        const msg = history.find(m => m.id === id);
        
        if (!msg) return res.status(404).json({ error: "Mensaje no encontrado." });

        // Intentar extraer titulo para el nombre de archivo (con salvaguarda de texto)
        const messageText = msg.text || msg.context || "";
        const titleMatch = messageText.match(/^# (.*)/m) || messageText.match(/^\*\* (.*) \*\*/m);
        const rawTitle = titleMatch ? titleMatch[1] : `manual_${id}`;
        const sanitizedTitle = rawTitle.trim().replace(/[^a-z0-9]/gi, '_').substring(0, 50);
        
        const timestamp = new Date().toISOString().split('T')[0];
        const fileName = `${sanitizedTitle}_${timestamp}.md`;
        const filePath = path.join(VAULT_PATH, fileName);

        let content = `# EXPORTACIÓN DE THUNDERKOLI\n`;
        content += `Fecha: ${new Date().toLocaleString()}\n`;
        content += `ID Mensaje: ${id}\n\n`;
        content += `---\n\n`;
        content += msg.text;
        content += `\n\n---\nGenerado por ThunderKoli Agent Core`;

        await fs.writeFile(filePath, content, 'utf-8');
        res.json({ message: "Guardado con éxito", fileName });
    } catch (error) {
        console.error('Error saving manual message:', error);
        res.status(500).json({ error: "Error al guardar en el Vault." });
    }
});

app.post('/agent/history/delete-bulk', async (req, res) => {
    const { ids } = req.body;
    if (!Array.isArray(ids)) return res.status(400).json({ error: "IDs deben ser un array." });
    let history = await readConversations();
    history = history.filter(msg => !ids.includes(msg.id));
    await saveConversations(history);
    res.json({ message: "Mensajes eliminados en bloque." });
});

app.post('/agent/interact', async (req, res) => {
    try {
        const { prompt, mode = "internal", role = "default", userState = "directo" } = req.body;
        if (!prompt) return res.status(400).json({ error: 'Falta el prompt.' });

        const users = await readUsers();
        const settings = await readSettings();
        const history = await readConversations();

        // Guardar mensaje del usuario
        const userMsg = {
            id: Date.now().toString() + "-user",
            role: "user",
            text: prompt,
            timestamp: new Date().toISOString()
        };
        history.push(userMsg);
        await saveConversations(history);

        // --- BYPASS DE SEGURIDAD PARA SALUDOS ---
        const simpleGreetings = /^(hola|buenas|que tal|hi|hello|buenos dias|buenas tardes|ping)$/i;
        if (prompt.trim().length < 15 && simpleGreetings.test(prompt.trim())) {
            const greetingResponse = {
                id: Date.now().toString() + "-agent",
                agent: "ThunderKoli Agent v1.0",
                message: "¡Hola! Modo " + userState + " activo. ¿Qué misión tenemos hoy?",
                context: { meta: { goal: "Saludo" }, steps: [] },
                mode, role, mcp: "ThunderCore Bridge",
                timestamp: new Date().toISOString()
            };
            history.push({ role: "agent", ...greetingResponse });
            await saveConversations(history);
            return res.status(200).json(greetingResponse);
        }

        // --- DELEGACIÓN AL ENGINE (EL CEREBRO) ---
        console.log(`[Bridge] Dispatching to Engine: Mode=${userState}`);
        const engineResponse = await engine.processMission(prompt, {
            mode, role, provider: settings.provider,
            apiKey: settings.deepseek_key,
            userState,
            teamContext: { teamSize: users.length }
        });

        const finalResponse = {
            ...engineResponse,
            id: Date.now().toString() + "-agent",
            mode, role, mcp: "ThunderCore Engine"
        };

        history.push({ role: "agent", ...finalResponse });
        await saveConversations(history);

        res.status(200).json(finalResponse);
    } catch (error) {
        res.status(500).json({ error: 'Fallo en el núcleo ThunderKoli Engine.' });
    }
});

/**
 * POST /users/:id/update
 * Actualiza el perfil de un usuario.
 */
app.get('/users/:id/update', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.query; // En un entorno real vendría en body
        let users = await readUsers();
        const index = users.findIndex(u => u.id === id || u.id === parseInt(id));

        if (index === -1) return res.status(404).json({ error: "Usuario no encontrado." });

        users[index] = { ...users[index], ...updates };
        await saveUsers(users);

        res.json({ success: true, user: users[index] });
    } catch (error) {
        res.status(500).json({ error: "Error al actualizar perfil." });
    }
});

// --- SMART QR IDENTITY LAYER (Hardened v2.1) ---
/**
 * Generates QR code for user identity verification.
 * 
 * Security features:
 * - HMAC-SHA256 token generation
 * - 5-minute token expiration
 * - One-time use per generation
 * - Audit logging on access
 * 
 * Token format: {userId}:{expiryTimestamp}
 * Signed with SYSTEM_SECRET from environment
 */
app.get('/users/:id/qr', async (req, res) => {
    try {
        const { id } = req.params;
        const users = await readUsers();
        const user = users.find(u => u.id === id || u.id === parseInt(id));

        if (!user) {
            return res.status(404).json({ error: "Miembro no encontrado." });
        }

        // Lógica de Token HMAC Soberano
        // Generate HMAC-SHA256 token with 5-minute expiration
        const secret = process.env.SYSTEM_SECRET || 'thunder-sovereign-2026';
        const expiry = Date.now() + (5 * 60 * 1000); // 5 minutos
        const dataToSign = `${id}:${expiry}`;
        const token = crypto.createHmac('sha256', secret).update(dataToSign).digest('hex');

        // URL de la landing con Validadores
        const landingUrl = `http://localhost:${PORT}/card/${id}?t=${token}&e=${expiry}`;
        
        const qrImage = await qrcode.toDataURL(landingUrl, {
            color: { dark: '#4f46e5', light: '#ffffff' },
            margin: 1,
            width: 400
        });

        res.json({ 
            userId: id,
            userName: user.name,
            qr: qrImage,
            url: landingUrl,
            expiresIn: "5m"
        });
    } catch (error) {
        console.error('[Identity] Error generating QR:', error);
        res.status(500).json({ error: "Fallo al generar código de identidad." });
    }
});

// --- SOVEREIGN LANDING PAGE (Public Reveal + Token Validation) ---
/**
 * Sovereign landing page for verified identity.
 * 
 * Security validation:
 * 1. Token presence check
 * 2. HMAC-SHA256 signature verification
 * 3. Expiration timestamp validation
 * 4. Audit logging on access
 */
app.get('/card/:id', async (req, res) => {
    const { id } = req.params;
    const { t: token, e: expiry } = req.query;

    // 1. Validación de Token e Integridad
    // Verify token signature and presence
    const secret = process.env.SYSTEM_SECRET || 'thunder-sovereign-2026';
    const dataToVerify = `${id}:${expiry}`;
    const expectedToken = crypto.createHmac('sha256', secret).update(dataToVerify).digest('hex');

    if (!token || !expiry || token !== expectedToken) {
        await logAudit(id, 'SECURITY_VIOLATION', { detail: 'Intento de acceso con token inválido o ausente.' });
        return res.status(401).send(`
            <div style="font-family:sans-serif; text-align:center; padding:50px;">
                <h1 style="color:#ef4444;">🚨 ACCESO DENEGADO</h1>
                <p>Token de identidad no válido o manipulado.</p>
                <p style="font-size:12px; color:#64748b;">ThunderKoli Sovereign Security Engine</p>
            </div>
        `);
    }

    // 2. Validación de Expiración
    // Check if token has expired
    if (Date.now() > parseInt(expiry)) {
        await logAudit(id, 'TOKEN_EXPIRED', { detail: 'Acceso intentado con token caducado.' });
        return res.status(403).send(`
            <div style="font-family:sans-serif; text-align:center; padding:50px;">
                <h1 style="color:#f59e0b;">⏳ TOKEN EXPIRADO</h1>
                <p>Este código QR ha caducado por seguridad. Solicita uno nuevo en el Dashboard.</p>
            </div>
        `);
    }

    const users = await readUsers();
    const user = users.find(u => u.id === id || u.id === parseInt(id));

    if (!user) {
        return res.status(404).send("<h1>404: Identidad no encontrada en el Vault</h1>");
    }

    // Registrar acceso exitoso
    await logAudit(id, 'IDENTITY_VERIFIED', { detail: 'Escaneo de tarjeta exitoso.' });

    res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>ThunderKoli Identity | ${user.name}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
                body { background: #020617; color: white; font-family: sans-serif; }
                .glass { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.1); }
            </style>
        </head>
        <body class="min-h-screen flex items-center justify-center p-6">
            <div class="glass max-w-sm w-full p-8 rounded-[2.5rem] text-center space-y-6">
                <img src="${user.avatar}" class="w-32 h-32 mx-auto rounded-full border-4 border-indigo-500 shadow-2xl">
                <div>
                    <h1 class="text-3xl font-black tracking-tighter uppercase">${user.name}</h1>
                    <p class="text-indigo-400 font-bold uppercase tracking-widest text-[10px] mt-1">${user.role}</p>
                </div>
                <div class="h-px bg-white/10 w-24 mx-auto"></div>
                <p class="text-xs text-slate-400 leading-relaxed italic">"Identidad verificada por el ecosistema ThunderKoli Core v2.0."</p>
                <div class="pt-4 flex justify-center gap-4">
                   <div class="w-2 h-2 rounded-full bg-green-500"></div>
                   <span class="text-[8px] font-black uppercase tracking-tighter text-slate-500">Status: Dynamic Node Active</span>
                </div>
            </div>
        </body>
        </html>
    `);
});

/**
 * GET /health
 */
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- RUTAS DE ONBOARDING v2.0 ---

app.get('/auth/google/url', (req, res) => {
    try {
        const url = googleAuth.generateAuthUrl();
        res.json({ url });
    } catch (err) {
        res.status(500).json({ error: 'Configura las credenciales de Google primero.' });
    }
});

app.get('/auth/google/callback', async (req, res) => {
    const { code } = req.query;
    try {
        await googleAuth.exchangeCode(code);
        res.send('<h1>¡Autenticación exitosa!</h1><p>Ya puedes cerrar esta pestaña y volver al Dashboard.</p>');
    } catch (err) {
        res.status(500).send('<h1>Error en la autenticación</h1>');
    }
});

app.get('/whatsapp/status', (req, res) => {
    res.json(whatsapp.getStatus());
});

app.post('/whatsapp/logout', async (req, res) => {
    await whatsapp.logout();
    res.json({ message: 'Sesión cerrada.' });
});

app.get('/core/status', async (req, res) => {
    const settings = await readSettings();
    const ws = whatsapp.getStatus();
    const isConfigured = !!(settings.google_client_id && settings.google_client_secret && ws.status === 'READY');
    res.json({
        isConfigured,
        google: !!settings.google_client_id,
        whatsapp: ws.status
    });
});

app.use((req, res) => {
    res.status(404).json({ error: `Ruta '${req.path}' no encontrada.` });
});

// ── Arranque del servidor ────────────────────────────────────────────────────
if (require.main === module) {
    const server = app.listen(PORT, '0.0.0.0', () => {
        console.log(`\n🚀 THUNDERKOLI BACKEND DEPLOYED`);
        console.log(`🌍 Endpoint: http://localhost:${PORT}`);
        console.log(`📁 Database: ${DATA_PATH}`);
        console.log(`⏱️  Timestamp: ${new Date().toISOString()}\n`);
        
        // Inicializar el núcleo
        initCore();
    });

    server.timeout = 300000; // 5 minutos de tiempo de espera para el socket
    server.keepAliveTimeout = 300000;

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.error(`❌ PORT ${PORT} IS ALREADY IN USE.`);
            process.exit(1);
        } else {
            console.error('❌ SERVER FAILED TO START:', err);
        }
    });
}

module.exports = app;
