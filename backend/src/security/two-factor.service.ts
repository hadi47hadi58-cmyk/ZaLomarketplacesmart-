import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class TwoFactorService {
  /**
   * Generates a cryptographically secure random Base32 string to act as the 2FA secret.
   */
  generateSecret(email: string): { secret: string; otpauthUrl: string } {
    const buffer = crypto.randomBytes(20);
    const secret = this.base32Encode(buffer);
    const label = encodeURIComponent(`ZaLo Smart:${email}`);
    const issuer = encodeURIComponent('ZaLo Smart');
    const otpauthUrl = `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}`;

    return { secret, otpauthUrl };
  }

  /**
   * Verifies a 6-digit TOTP token against a Base32 secret.
   * Supports window step of 1 to allow clock-drift safety.
   */
  verifyToken(secret: string, token: string): boolean {
    if (!token || token.length !== 6 || !/^\d+$/.test(token)) {
      return false;
    }

    try {
      const keyBytes = this.base32Decode(secret);
      const currentTimeSteps = Math.floor(Date.now() / 30000);

      // Check current step, previous step, and next step to accommodate network/clock drifts
      for (let offset = -1; offset <= 1; offset++) {
        const calculated = this.generateTOTP(keyBytes, currentTimeSteps + offset);
        if (calculated === token) {
          return true;
        }
      }
    } catch (err) {
      console.error('2FA Verification Error:', err);
    }

    return false;
  }

  private generateTOTP(keyBytes: Buffer, timeStep: number): string {
    // 1. Pack time step into 8 bytes buffer (big-endian)
    const timeBuffer = Buffer.alloc(8);
    let temp = BigInt(timeStep);
    for (let i = 7; i >= 0; i--) {
      timeBuffer[i] = Number(temp & BigInt(0xff));
      temp >>= BigInt(8);
    }

    // 2. HMAC-SHA1 of timeBuffer with keyBytes
    const hmac = crypto.createHmac('sha1', keyBytes);
    hmac.update(timeBuffer);
    const digest = hmac.digest();

    // 3. Dynamic truncation
    const offset = digest[digest.length - 1] & 0xf;
    const binary =
      ((digest[offset] & 0x7f) << 24) |
      ((digest[offset + 1] & 0xff) << 16) |
      ((digest[offset + 2] & 0xff) << 8) |
      (digest[offset + 3] & 0xff);

    // 4. Extract 6-digit code
    const otpVal = binary % 1000000;
    return otpVal.toString().padStart(6, '0');
  }

  // Base32 Alphabet definitions
  private readonly ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

  private base32Encode(buffer: Buffer): string {
    let bits = 0;
    let value = 0;
    let output = '';

    for (let i = 0; i < buffer.length; i++) {
      value = (value << 8) | buffer[i];
      bits += 8;

      while (bits >= 5) {
        output += this.ALPHABET[(value >>> (bits - 5)) & 31];
        bits -= 5;
      }
    }

    if (bits > 0) {
      output += this.ALPHABET[(value << (5 - bits)) & 31];
    }

    return output;
  }

  private base32Decode(base32: string): Buffer {
    const cleanBase32 = base32.toUpperCase().replace(/=+$/, '');
    let bits = 0;
    let value = 0;
    const bytes: number[] = [];

    for (let i = 0; i < cleanBase32.length; i++) {
      const idx = this.ALPHABET.indexOf(cleanBase32[i]);
      if (idx === -1) {
        throw new Error('Invalid Base32 characters in TOTP secret');
      }

      value = (value << 5) | idx;
      bits += 5;

      if (bits >= 8) {
        bytes.push((value >>> (bits - 8)) & 255);
        bits -= 8;
      }
    }

    return Buffer.from(bytes);
  }
}
