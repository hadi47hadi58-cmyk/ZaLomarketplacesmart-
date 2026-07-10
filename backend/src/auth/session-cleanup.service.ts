import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class SessionCleanupService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SessionCleanupService.name);
  private cleanedCountTotal = 0;
  private lastCleanupTime: string = 'Never';

  constructor(private readonly supabaseService: SupabaseService) {}

  onApplicationBootstrap() {
    this.logger.log('🚀 تم بدء خدمة تنظيف الجلسات التلقائية الموحدة (Auto-Cleanup Session Engine)...');
    
    // Run cleanup immediately on startup
    this.cleanupExpiredSessions();

    // Run cleanup every 12 hours (12 * 60 * 60 * 1000 ms)
    setInterval(() => {
      this.cleanupExpiredSessions();
    }, 12 * 60 * 60 * 1000);
  }

  /**
   * Cleans up expired, inactive, or orphaned sessions from the sessions table
   * to ensure maximum performance and avoid database clutter.
   */
  async cleanupExpiredSessions(): Promise<{ cleaned: number; checked: number }> {
    this.logger.log('🧹 جاري تشغيل عملية التنظيف الذاتي للجلسات غير الصالحة والمنتهية الصلاحية...');
    const supabase = this.supabaseService.getClient();
    const nowIso = new Date().toISOString();
    let cleanedCount = 0;
    let checkedCount = 0;

    try {
      // 1. Delete sessions that are marked inactive or have an expiration date in the past
      const { data: deletedSessions, error: deleteError } = await supabase
        .from('sessions')
        .delete()
        .or(`is_active.eq.false,expires_at.lt.${nowIso}`)
        .select('id');

      if (deleteError) {
        this.logger.error(`❌ خطأ أثناء حذف الجلسات المنتهية: ${deleteError.message}`);
      } else {
        const deletedCount = deletedSessions?.length || 0;
        cleanedCount += deletedCount;
        if (deletedCount > 0) {
          this.logger.log(`✅ تم حذف وتطهير ${deletedCount} من جلسات العمل المنتهية أو غير النشطة بنجاح.`);
        }
      }

      // 2. Perform a deep validation sweep of currently active tokens against Supabase Auth Engine
      // to prune orphaned sessions (e.g. users deleted, passwords changed, or session revoked in Supabase directly)
      const { data: activeSessions, error: fetchError } = await supabase
        .from('sessions')
        .select('id, token')
        .eq('is_active', true);

      if (fetchError || !activeSessions) {
        this.lastCleanupTime = new Date().toISOString();
        this.cleanedCountTotal += cleanedCount;
        return { cleaned: cleanedCount, checked: 0 };
      }

      checkedCount = activeSessions.length;
      const invalidSessionIds: number[] = [];

      for (const session of activeSessions) {
        const { error: authVerifyError } = await supabase.auth.getUser(session.token);
        if (authVerifyError) {
          // Token is no longer validated by Supabase Auth engine -> mark for removal
          invalidSessionIds.push(session.id);
        }
      }

      if (invalidSessionIds.length > 0) {
        this.logger.log(`🔍 تم رصد ${invalidSessionIds.length} من الجلسات الوهمية/المعزولة التي تم إبطالها من مزود الهوية.`);
        const { error: pruneError } = await supabase
          .from('sessions')
          .delete()
          .in('id', invalidSessionIds);

        if (pruneError) {
          this.logger.error(`❌ خطأ أثناء تطهير الجلسات الوهمية: ${pruneError.message}`);
        } else {
          cleanedCount += invalidSessionIds.length;
          this.logger.log(`✅ تم تنظيف جميع الجلسات الوهمية والمعزولة بنجاح لضمان سلامة البيانات.`);
        }
      }

      this.lastCleanupTime = new Date().toISOString();
      this.cleanedCountTotal += cleanedCount;
    } catch (err) {
      this.logger.error(`⚠️ خطأ غير متوقع أثناء عملية التنظيف الدوري: ${err.message}`);
    }

    return { cleaned: cleanedCount, checked: checkedCount };
  }

  /**
   * Returns current statistics and health status of the session engine.
   */
  async getSystemHealth() {
    const supabase = this.supabaseService.getClient();
    let databaseStatus = 'healthy';
    let sessionCount = 0;

    try {
      const { count, error } = await supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        databaseStatus = 'degraded';
      } else {
        sessionCount = count || 0;
      }
    } catch {
      databaseStatus = 'offline';
    }

    return {
      status: databaseStatus === 'healthy' ? 'UP' : 'DEGRADED',
      database: databaseStatus,
      totalActiveSessions: sessionCount,
      cleanedSessionsCount: this.cleanedCountTotal,
      lastCleanupTime: this.lastCleanupTime,
      serverTime: new Date().toISOString(),
    };
  }
}
