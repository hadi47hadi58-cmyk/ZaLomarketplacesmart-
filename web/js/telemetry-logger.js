// ZaLo Smart Marketplace - Production Telemetry & Central Error Logging
// وحدة برمجية متكاملة لمراقبة الأداء، تتبع الأخطاء وتسجيل الاستثناءات في بيئة الإنتاج

class ZaLoTelemetry {
  constructor() {
    this.logs = [];
    this.maxLogs = 100;
    this.userId = null;
    
    // إحصائيات لمراقبة الأداء ومعدل الأخطاء لحظياً (Sliding 1-Hour Window Tracker)
    this.hourlyRequestsCount = 0;
    this.hourlyErrorsCount = 0;
    this.lastThresholdAlertTime = 0; // طابع زمني لمنع تكرار التنبيهات المفرطة (Debouncing)

    this.initGlobalErrorHandler();
    this.initHourlyStatsReset();
  }

  setUserId(id) {
    this.userId = id;
    this.logInfo(`تم ربط معرّف المستخدم بالتيليمتري: ${id}`);
  }

  /**
   * تتبع كل طلب يتم إرساله للـ API لزيادة قاسم النسبة المئوية
   */
  trackApiRequest() {
    this.hourlyRequestsCount++;
    this.evaluatePredictiveAlerts();
  }

  /**
   * تتبع الأخطاء الناتجة عن الـ API
   */
  trackApiError() {
    this.hourlyErrorsCount++;
    this.evaluatePredictiveAlerts();
  }

  logInfo(message, context = {}) {
    this._addLog('INFO', message, context);
  }

  logWarning(message, context = {}) {
    this._addLog('WARNING', message, context);
  }

  logError(message, errorObject = {}, context = {}) {
    this.hourlyErrorsCount++; // زيادة عدد الأخطاء لحساب النسبة المئوية
    const errorDetails = {
      message: errorObject.message || String(errorObject),
      stack: errorObject.stack || '',
      ...context
    };
    this._addLog('ERROR', message, errorDetails);
    
    // إرسال مباشر للـ NestJS telemetry endpoint
    this._sendToCentralServer('ERROR', message, errorDetails);
    this.evaluatePredictiveAlerts();
  }

  /**
   * تصفير دوري للعداد كل ساعة للحفاظ على دقة النسبة المنزلقة
   */
  initHourlyStatsReset() {
    setInterval(() => {
      console.log(`[ZaLo Telemetry] إعادة ضبط عدادات النسبة المئوية للساعة الجديدة. إجمالي الطلبات السابقة: ${this.hourlyRequestsCount}, الأخطاء: ${this.hourlyErrorsCount}`);
      this.hourlyRequestsCount = 0;
      this.hourlyErrorsCount = 0;
    }, 3600000); // 1 hour in milliseconds
  }

  /**
   * تقييم فوري ومستمر لمعدل الاستثناءات (Predictive & Proactive Threshold Evaluator)
   * إذا تجاوزت نسبة الأخطاء 2% من إجمالي الطلبات (مع عينة إحصائية لا تقل عن 15 طلباً)
   * يتم إطلاق إنذار عالي الخطورة للـ NestJS ليتخذ إجراءات وقائية كحظر المهاجمين أو التبديل التلقائي للخوادم الاحتياطية.
   */
  evaluatePredictiveAlerts() {
    if (this.hourlyRequestsCount < 15) return; // عينة دنيا لضمان الدقة الإحصائية وتفادي الإنذار الكاذب
    
    const errorRate = (this.hourlyErrorsCount / this.hourlyRequestsCount) * 100;
    
    if (errorRate >= 2.0) {
      const now = Date.now();
      // منع تكرار التنبيه قبل مرور 5 دقائق لعدم إغراق قنوات الاتصال (Alert Debouncing)
      if (now - this.lastThresholdAlertTime < 300000) return;
      
      this.lastThresholdAlertTime = now;
      
      const alertPayload = {
        alertType: 'CRITICAL_EXCEPTION_RATE_BREACH',
        errorRate: errorRate.toFixed(2) + '%',
        totalRequests: this.hourlyRequestsCount,
        totalErrors: this.hourlyErrorsCount,
        timestamp: new Date().toISOString(),
        details: 'تجاوزت نسبة الأخطاء غير المعالجة في المتصفحات حاجز الـ 2% المسموح به في اتفاقية مستوى الخدمة (SLA).'
      };

      console.error(`%c[ZaLo ALERT] تحذير أمني/تشغيلي خطير! معدل الأخطاء تجاوز النسبة الآمنة: ${errorRate.toFixed(2)}%`, 'background: red; color: white; font-weight: bold; padding: 5px;');
      
      // إرسال الإنذار للواجهة الخلفية لـ NestJS لتقوم بدورها بالتوجيه لقناة Slack أو تفعيل الـ Circuit Breaker
      this._sendAlertToNestJS(alertPayload);
    }
  }

  async _sendAlertToNestJS(payload) {
    const alertUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:3000/api/analytics/alerts/threshold-breach'
      : 'https://zalo-smart-backend-service-api.run.app/api/analytics/alerts/threshold-breach';

    try {
      await fetch(alertUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      console.log('[ZaLo Telemetry] تم إبلاغ خادم NestJS بخرق العتبة بنجاح لاتخاذ الإجراء الوقائي.');
    } catch (e) {
      // صامت لتفادي حلقات التكرار اللانهائية
    }
  }

  _addLog(level, message, details) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      details,
      userId: this.userId,
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    this.logs.unshift(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    // طباعة منظمة في وحدة التحكم للمطورين
    const colors = {
      INFO: '#00AEEF',
      WARNING: '#D4AF37',
      ERROR: '#FF3333'
    };
    console.log(
      `%c[ZaLo Telemetry - ${level}] %c${message}`,
      `color: ${colors[level]}; font-weight: bold;`,
      'color: inherit;',
      details
    );
  }

  initGlobalErrorHandler() {
    window.addEventListener('error', (event) => {
      this.logError('خطأ غير معالج في الواجهة الأمامية', event.error || { message: event.message }, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.logError('وعد (Promise) غير معالج أو مرفوض', event.reason, {
        type: 'unhandled_rejection'
      });
    });
  }

  async _sendToCentralServer(level, message, details) {
    // محاكاة إرسال لـ NestJS telemetry endpoint
    const telemetryUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:3000/api/analytics/telemetry'
      : null;

    if (telemetryUrl) {
      try {
        fetch(telemetryUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ level, message, details, timestamp: new Date().toISOString() })
        });
      } catch (e) {
        // صامت لتفادي أي حلقات أخطاء مفرغة
      }
    }
  }

  getRecentLogs() {
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
  }
}

// تصدير وتوفير مراقب الأداء والأخطاء عالمياً
export const telemetry = new ZaLoTelemetry();
window.ZaLoTelemetry = telemetry;
