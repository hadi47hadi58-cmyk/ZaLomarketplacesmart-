import * as crypto from 'crypto';

export class EncryptionService {
  private static readonly ALGORITHM = 'aes-256-cbc';
  private static getKey(): Buffer {
    const keyString = process.env.ENCRYPTION_KEY || process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET;
    if (!keyString && process.env.NODE_ENV === 'production') {
      throw new Error('CRITICAL SECURITY ERROR: ENCRYPTION_KEY or SUPABASE_JWT_SECRET is required in production!');
    }
    return crypto.scryptSync(
      keyString || 'dev-only-local-secret-do-not-use-in-prod',
      'salt-for-key-generation',
      32
    );
  }

  private static get KEY(): Buffer {
    return this.getKey();
  }

  /**
   * Encrypts a plain-text string.
   * @param text Plain-text data
   */
  static encrypt(text: string): string {
    if (!text) return '';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.ALGORITHM, this.KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypts an encrypted string.
   * @param encryptedText Format "iv:encryptedData"
   */
  static decrypt(encryptedText: string): string {
    if (!encryptedText) return '';
    try {
      const parts = encryptedText.split(':');
      if (parts.length !== 2) return encryptedText; // Fallback if not encrypted

      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = parts[1];
      const decipher = crypto.createDecipheriv(this.ALGORITHM, this.KEY, iv);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      // In case of error or wrong key, return original text safely
      return encryptedText;
    }
  }
}
