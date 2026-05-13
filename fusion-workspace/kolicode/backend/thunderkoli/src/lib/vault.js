const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');

/**
 * VaultService - ThunderKoli Core v2.1
 * Handles secure storage and encryption of sensitive secrets.
 */
class VaultService {
    constructor(secretKey) {
        // Asegurar que la llave sea de 32 bytes para AES-256
        this.algorithm = 'aes-256-cbc';
        this.key = crypto.createHash('sha256').update(String(secretKey)).digest();
        this.ivSize = 16;
        this.vaultPath = path.join(__dirname, '../config/vault.enc');
    }

    /**
     * Encripta una cadena de texto
     */
    encrypt(text) {
        const iv = crypto.randomBytes(this.ivSize);
        const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return iv.toString('hex') + ':' + encrypted;
    }

    /**
     * Desencripta una cadena de texto
     */
    decrypt(text) {
        try {
            const [ivHex, encryptedText] = text.split(':');
            const iv = Buffer.from(ivHex, 'hex');
            const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
            let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        } catch (err) {
            console.error('[Vault] Error desencriptando:', err.message);
            return null;
        }
    }

    /**
     * Guarda un objeto secreto en disco (encriptado)
     */
    async saveSecrets(secrets) {
        const encrypted = this.encrypt(JSON.stringify(secrets));
        await fs.writeFile(this.vaultPath, encrypted, 'utf-8');
    }

    /**
     * Carga y desencripta los secretos del disco
     */
    async loadSecrets() {
        try {
            const encrypted = await fs.readFile(this.vaultPath, 'utf-8');
            const decrypted = this.decrypt(encrypted);
            if (!decrypted) return {};
            return JSON.parse(decrypted);
        } catch (err) {
            // Si no existe el archivo, devolvemos objeto vacío
            return {};
        }
    }

    /**
     * Inyecta secretos en process.env para que los workers los usen
     */
    async injectToEnv() {
        const secrets = await this.loadSecrets();
        for (const [key, value] of Object.entries(secrets)) {
            process.env[key] = value;
        }
        return Object.keys(secrets);
    }
}

module.exports = VaultService;
