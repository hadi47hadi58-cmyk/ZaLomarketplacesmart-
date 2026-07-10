import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class DeviceFingerprintService {
  private readonly logger = new Logger(DeviceFingerprintService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Generates a secure cryptographic hash identifying the client device based on HTTP headers and IP.
   */
  generateFingerprint(userAgent: string, ipAddress: string, acceptLanguage: string): string {
    const rawString = `${userAgent || ''}|${ipAddress || ''}|${acceptLanguage || ''}`;
    return crypto
      .createHash('sha256')
      .update(rawString)
      .digest('hex');
  }

  /**
   * Registers a login or access event for a specific user and device fingerprint.
   */
  async registerDevice(userId: number, fingerprint: string, deviceName: string, ipAddress: string, userAgent?: string): Promise<boolean> {
    try {
      const supabase = this.supabaseService.getClient();

      // Check if device already registered for this user
      const { data: existing, error } = await supabase
        .from('user_devices')
        .select('*')
        .eq('user_id', userId)
        .eq('device_fingerprint', fingerprint)
        .maybeSingle();

      const now = new Date().toISOString();

      if (error || !existing) {
        // Register new device
        await supabase.from('user_devices').insert({
          user_id: userId,
          device_fingerprint: fingerprint,
          device_name: deviceName || this.parseDeviceName(userAgent || ''),
          last_ip: ipAddress,
          last_login: now,
          is_trusted: true, // Default to true on first successful login, can be updated later
        });
        this.logger.log(`New secure device registered successfully for user ID ${userId}`);
        return true;
      } else {
        // Update last login
        await supabase
          .from('user_devices')
          .update({
            last_ip: ipAddress,
            last_login: now,
          })
          .eq('id', existing.id);
        return existing.is_trusted;
      }
    } catch (err) {
      this.logger.error('Error registering device metadata:', err);
      return true; // Safe fallback
    }
  }

  /**
   * Heuristically determines a friendly device/browser name from user-agent.
   */
  private parseDeviceName(userAgent: string): string {
    if (!userAgent) return 'متصفح ويب مجهول';
    if (userAgent.includes('iPhone')) return 'هاتف iPhone';
    if (userAgent.includes('iPad')) return 'جهاز iPad';
    if (userAgent.includes('Android')) return 'جهاز ذكي Android';
    if (userAgent.includes('Windows')) return 'حاسوب Windows OS';
    if (userAgent.includes('Macintosh')) return 'جهاز macOS';
    if (userAgent.includes('Linux')) return 'حاسوب Linux OS';
    return 'متصفح ويب';
  }
}
