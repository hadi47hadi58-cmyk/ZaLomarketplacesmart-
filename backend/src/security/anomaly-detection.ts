import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class AnomalyDetectionService {
  private readonly logger = new Logger(AnomalyDetectionService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Assesses risk for a login attempt based on IP and historic patterns.
   * Returns a risk score from 0.0 to 1.0.
   */
  async assessLoginRisk(email: string, ipAddress: string, userAgent: string): Promise<{ riskScore: number; reasons: string[] }> {
    const reasons: string[] = [];
    let riskScore = 0.0;

    try {
      const supabase = this.supabaseService.getClient();

      // Check failed attempts from this IP in the last 1 hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      
      const { data: recentFailures, error: failError } = await supabase
        .from('login_attempts')
        .select('id')
        .eq('ip_address', ipAddress)
        .eq('is_successful', false)
        .gt('attempted_at', oneHourAgo);

      if (!failError && recentFailures && recentFailures.length > 5) {
        riskScore += 0.4;
        reasons.push(`كثرة محاولات الدخول الفاشلة من عنوان الـ IP (${recentFailures.length} محاولة)`);
      }

      // Check if user has logged in from this IP before
      const { data: pastSessions, error: sessionError } = await supabase
        .from('sessions')
        .select('ip_address, user_agent')
        .eq('is_active', true)
        .limit(10);

      if (!sessionError && pastSessions && pastSessions.length > 0) {
        const matchesIp = pastSessions.some(s => s.ip_address === ipAddress);
        const matchesAgent = pastSessions.some(s => s.user_agent === userAgent);

        if (!matchesIp) {
          riskScore += 0.2;
          reasons.push('عنوان الـ IP جديد وغير مألوف لهذا الحساب');
        }

        if (!matchesAgent) {
          riskScore += 0.1;
          reasons.push('المتصفح أو نظام التشغيل المستخدم جديد كلياً');
        }
      }

    } catch (err) {
      this.logger.error('Error in anomaly detection evaluation:', err);
    }

    return {
      riskScore: Math.min(riskScore, 1.0),
      reasons,
    };
  }
}
