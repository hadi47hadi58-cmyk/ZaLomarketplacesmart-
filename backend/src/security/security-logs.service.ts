import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class SecurityLogsService {
  private readonly logger = new Logger(SecurityLogsService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Records a login attempt to audit logs and login_attempts table.
   */
  async logAttempt(email: string, ipAddress: string, isSuccessful: boolean, userAgent: string): Promise<void> {
    try {
      const supabase = this.supabaseService.getClient();

      // Write to login_attempts
      await supabase.from('login_attempts').insert({
        email,
        ip_address: ipAddress,
        is_successful: isSuccessful,
        user_agent: userAgent,
      });

      // Write to audit logs
      await supabase.from('audit_logs').insert({
        actor_name: email,
        action: isSuccessful ? 'USER_LOGIN_SUCCESS' : 'USER_LOGIN_FAILED',
        details: `محاولة تسجيل دخول من عنوان الـ IP (${ipAddress}) باستخدام ${userAgent.substring(0, 100)}`,
      });

      // Handle IP blocking on multiple failures
      if (!isSuccessful) {
        await this.registerFailedAttempt(ipAddress);
      } else {
        await this.clearFailedAttempts(ipAddress);
      }
    } catch (error) {
      this.logger.error('Failed to log security attempt:', error);
    }
  }

  private async registerFailedAttempt(ipAddress: string): Promise<void> {
    try {
      const supabase = this.supabaseService.getClient();

      const { data: record, error } = await supabase
        .from('failed_logins')
        .select('*')
        .eq('ip_address', ipAddress)
        .single();

      if (error || !record) {
        // Create first failed record
        await supabase.from('failed_logins').insert({
          ip_address: ipAddress,
          count: 1,
        });
      } else {
        const newCount = record.count + 1;
        let isBlocked = record.is_blocked;
        let blockedUntil = record.blocked_until;

        if (newCount >= 5) {
          isBlocked = true;
          // Block for 15 minutes
          blockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        }

        await supabase
          .from('failed_logins')
          .update({
            count: newCount,
            is_blocked: isBlocked,
            blocked_until: blockedUntil,
            last_attempt: new Date().toISOString(),
          })
          .eq('id', record.id);
      }
    } catch (err) {
      this.logger.error('Error registering failed IP attempt:', err);
    }
  }

  private async clearFailedAttempts(ipAddress: string): Promise<void> {
    try {
      const supabase = this.supabaseService.getClient();
      await supabase
        .from('failed_logins')
        .delete()
        .eq('ip_address', ipAddress);
    } catch (err) {
      this.logger.error('Error clearing IP attempts:', err);
    }
  }

  /**
   * Checks if an IP is currently blocked due to repeated failures.
   */
  async isIpBlocked(ipAddress: string): Promise<boolean> {
    try {
      const supabase = this.supabaseService.getClient();
      const { data: record, error } = await supabase
        .from('failed_logins')
        .select('*')
        .eq('ip_address', ipAddress)
        .single();

      if (error || !record) return false;

      if (record.is_blocked) {
        const now = new Date();
        const blockedUntil = new Date(record.blocked_until);

        if (now > blockedUntil) {
          // Unblock after expiration
          await this.clearFailedAttempts(ipAddress);
          return false;
        }
        return true;
      }
    } catch (err) {
      this.logger.error('Error checking blocked status:', err);
    }
    return false;
  }
}
