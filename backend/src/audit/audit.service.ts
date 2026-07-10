import { Injectable, Logger } from '@nestjs/common';

export interface AuditLogDto {
  id: number;
  actorName: string;
  action: string;
  details: string;
  timestamp: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger('ZaLoAuditSystem');
  
  // In-Memory Database storage mapped to PostgreSQL 'audit_logs'
  private logs: AuditLogDto[] = [
    { id: 1, actorName: 'النظام الذكي تلقائياً', action: 'SETUP', details: 'تشغيل وتهيئة بوابات ومقابس REST API للخوادم بنجاح.', timestamp: new Date().toISOString() },
    { id: 2, actorName: 'عبد الهادي نجم الدين', action: 'USER_LOGIN', details: 'ربط اتصال آمن وتصدير وثيقة دخول متكرر.', timestamp: new Date(Date.now() - 3600000).toISOString() }
  ];

  log(actorName: string, action: string, details: string) {
    const entry: AuditLogDto = {
      id: this.logs.length + 1,
      actorName,
      action,
      details,
      timestamp: new Date().toISOString(),
    };
    this.logs.unshift(entry);
    this.logger.log(`[AUDIT] Action: ${action} | Actor: ${actorName} | Details: ${details}`);
    return entry;
  }

  async getAllLogs(): Promise<AuditLogDto[]> {
    return this.logs;
  }

  async clearLogs() {
    this.logs = [{ id: 1, actorName: 'إعادة تهيئة الإدارة', action: 'CLEANUP', details: 'تنظيف وتطهير شامل لكافة سجلات العمليات السابقة.', timestamp: new Date().toISOString() }];
    return this.logs;
  }
}
