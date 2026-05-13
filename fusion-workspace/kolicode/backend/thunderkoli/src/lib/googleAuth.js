const { google } = require('googleapis');
const path = require('path');
const fs = require('fs/promises');
const { retryWithBackoff } = require('./thunder-utils');

const TOKEN_PATH = path.join(__dirname, '..', '.google_auth/tokens.json');

class GoogleAuthManager {
  constructor() {
    this.oAuth2Client = null;
  }

  /**
   * Inicializa el cliente con las credenciales proporcionadas por el usuario
   */
  initClient(clientId, clientSecret, redirectUri) {
    this.oAuth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );

    // Configurar el listener para guardar tokens refrescados automáticamente
    this.oAuth2Client.on('tokens', async (tokens) => {
      await this.saveTokens(tokens);
    });
  }

  /**
   * Genera la URL de autorización
   */
  generateAuthUrl() {
    if (!this.oAuth2Client) throw new Error('Cliente Google no inicializado.');
    return this.oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/contacts.readonly'],
      prompt: 'consent'
    });
  }

  /**
   * Intercambia el código por tokens
   */
  async exchangeCode(code) {
    const { tokens } = await this.oAuth2Client.getToken(code);
    this.oAuth2Client.setCredentials(tokens);
    await this.saveTokens(tokens);
    return tokens;
  }

  /**
   * Carga tokens guardados
   */
  async loadSavedCredentials() {
    try {
      const content = await fs.readFile(TOKEN_PATH, 'utf-8');
      const tokens = JSON.parse(content);
      if (this.oAuth2Client) {
        this.oAuth2Client.setCredentials(tokens);
        return true;
      }
    } catch (err) {
      return false;
    }
  }

  /**
   * Guarda los tokens localmente
   */
  async saveTokens(newTokens) {
    try {
      let currentTokens = {};
      try {
        const content = await fs.readFile(TOKEN_PATH, 'utf-8');
        currentTokens = JSON.parse(content);
      } catch (e) {}

      const mergedTokens = { ...currentTokens, ...newTokens };
      await fs.writeFile(TOKEN_PATH, JSON.stringify(mergedTokens, null, 2));
      console.log('[GoogleAuth] Tokens actualizados y guardados.');
    } catch (err) {
      console.error('[GoogleAuth] Error guardando tokens:', err);
    }
  }

  getClient() {
    return this.oAuth2Client;
  }

  /**
   * Sincroniza contactos desde Google People API con reintentos
   */
  async syncContacts() {
    if (!this.oAuth2Client) throw new Error('Cliente Google no inicializado para sincronización.');

    return await retryWithBackoff(async () => {
      console.log('[GoogleSync] Iniciando descarga de contactos...');
      const service = google.people({ version: 'v1', auth: this.oAuth2Client });
      
      const res = await service.people.connections.list({
        resourceName: 'people/me',
        pageSize: 100,
        personFields: 'names,emailAddresses,photos,organizations',
      });

      const connections = res.data.connections || [];
      console.log(`[GoogleSync] Descargados ${connections.length} contactos exitosamente.`);
      
      return connections.map(person => ({
        name: person.names?.[0]?.displayName || 'Unknown',
        email: person.emailAddresses?.[0]?.value || '',
        avatar: person.photos?.[0]?.url || '',
        role: person.organizations?.[0]?.title || 'Contact'
      }));
    }, {
      attempts: 3,
      delay: 5000,
      onRetry: (err, i) => console.warn(`[GoogleSync] Reintento ${i}/3 por error de API: ${err.message}`)
    });
  }
}

module.exports = new GoogleAuthManager();
