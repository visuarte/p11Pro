const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const path = require('path');
const fs = require('fs/promises');
const EventEmitter = require('events');
const { retryWithBackoff } = require('./thunder-utils');

class WhatsAppManager extends EventEmitter {
  constructor() {
    super();
    this.client = null;
    this.qrCode = null;
    this.status = 'DISCONNECTED'; 
    this.isInitializing = false;
  }

  async init() {
    if (this.client || this.isInitializing) return;
    this.isInitializing = true;

    console.log('[WhatsApp] Inicializando motor interactivo (M1 Headless Mode)...');
    
    this.client = new Client({
      authStrategy: new LocalAuth({
        dataPath: path.join(__dirname, '..', '.wwebjs_auth')
      }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ],
        // Optimización M1: Usar el ejecutable del sistema si es necesario
        // executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
      }
    });

    this.client.on('qr', async (qr) => {
      this.status = 'QR';
      this.qrCode = await qrcode.toDataURL(qr);
      console.log('[WhatsApp] Nuevo código QR generado. Listo para escanear en Dashboard.');
      this.emit('status_change', { status: 'QR', qr: this.qrCode });
    });

    this.client.on('authenticated', () => {
      this.status = 'AUTHENTICATED';
      console.log('[WhatsApp] Autenticación completada con éxito.');
      this.emit('status_change', { status: 'AUTHENTICATED' });
    });

    this.client.on('ready', () => {
      this.status = 'READY';
      this.qrCode = null;
      console.log('[WhatsApp] Cliente está listo y operativo.');
      this.emit('status_change', { status: 'READY' });
    });

    this.client.on('message', async (msg) => {
      // Ignorar mensajes de grupos para no saturar
      if (msg.from.includes('@g.us')) return;

      console.log(`[WhatsApp] Mensaje recibido de ${msg.from}: ${msg.body}`);
      this.emit('incoming_message', msg);
    });

    this.client.on('disconnected', (reason) => {
      this.status = 'DISCONNECTED';
      console.log('[WhatsApp] Cliente desconectado (Razón):', reason);
      this.emit('status_change', { status: 'DISCONNECTED', reason });
      // No re-inicializar automáticamente aquí para evitar bucles infinitos en errores críticos
      // El usuario puede re-intentar desde el Panel de Ajustes
    });

    try {
      // 1. Limpieza preventiva de Locks de Puppeteer (Soberanía y Resiliencia M1)
      const lockPath = path.join(__dirname, '..', '.wwebjs_auth/session/SingletonLock');
      try {
        await fs.unlink(lockPath);
        console.log('[WhatsApp] Lock de Puppeteer limpiado exitosamente.');
      } catch (e) { /* no lock existed */ }

      // 2. Inicialización con Reintento Exponencial
      await retryWithBackoff(async () => {
        await this.client.initialize();
      }, {
        attempts: 3,
        delay: 2000,
        onRetry: (err, i) => console.warn(`[WhatsApp] Reintento de inicialización ${i}/3 debido a: ${err.message}`)
      });

    } catch (err) {
      console.error('[WhatsApp] Error crítico tras reintentos:', err.message);
      this.status = 'DISCONNECTED';
      this.client = null; // Reset para permitir reintento manual limpio
    } finally {
      this.isInitializing = false;
    }
  }

  getStatus() {
    return {
      status: this.status,
      qr: this.qrCode
    };
  }

  async logout() {
    if (this.client) {
      await this.client.logout();
      this.status = 'DISCONNECTED';
      this.emit('status_change', { status: 'DISCONNECTED' });
    }
  }
}

module.exports = new WhatsAppManager();
