/**
 * ZaLo Smart Algerian Multivendor Marketplace
 * نظام تحليل محاولات تسجيل الدخول والوقاية من الروبوتات - Login Analytics & Bot Prevention
 */

class LoginAnalytics {
  constructor(formId, usernameInputId) {
    this.form = document.getElementById(formId);
    this.usernameInput = document.getElementById(usernameInputId);
    this.keyPressTimes = [];
    this.pasteDetected = false;
    this.submitAttempts = 0;
    this.startTime = Date.now();

    if (this.form) {
      this.initTrackers();
    }
  }

  initTrackers() {
    // 1. Check for suspicious paste on sensitive input
    if (this.usernameInput) {
      this.usernameInput.addEventListener('paste', () => {
        this.pasteDetected = true;
        console.warn('Security notice: Credentials paste action detected.');
      });

      this.usernameInput.addEventListener('keypress', (e) => {
        this.keyPressTimes.push({
          char: e.key,
          time: Date.now()
        });
      });
    }

    // 2. Monitor form submission speed and frequency
    this.form.addEventListener('submit', (e) => {
      this.submitAttempts++;
      const timeToSubmit = (Date.now() - this.startTime) / 1000;

      // Anomaly detection: extremely fast form submit (less than 1.5 seconds) indicates bot/automated submission
      if (timeToSubmit < 1.5) {
        e.preventDefault();
        alert('مرفوض: تم رصد حركة إدخال فائقة السرعة غير طبيعية! يرجى الانتظار والمحاولة كبشر 🤖🛡️');
        return;
      }

      // Check keypress dynamics for bot patterns (e.g. constant 0ms delay between keystrokes)
      if (this.detectBotTypingDynamics()) {
        e.preventDefault();
        alert('مرفوض: تم رصد محاكاة روبوتية للكتابة ولوحة المفاتيح! 🛡️');
        return;
      }

      // Log login attempt metrics to telemetry
      this.sendTelemetryMetrics({
        timeToSubmit,
        pasteDetected: this.pasteDetected,
        submitAttempts: this.submitAttempts,
        keystrokeCount: this.keyPressTimes.length
      });
    });
  }

  detectBotTypingDynamics() {
    if (this.keyPressTimes.length < 4) return false;

    const deltas = [];
    for (let i = 1; i < this.keyPressTimes.length; i++) {
      deltas.push(this.keyPressTimes[i].time - this.keyPressTimes[i - 1].time);
    }

    // If standard deviation is 0 (exactly the same time difference between keys, indicating automated scripted typing)
    const average = deltas.reduce((sum, d) => sum + d, 0) / deltas.length;
    const variance = deltas.reduce((sum, d) => sum + Math.pow(d - average, 2), 0) / deltas.length;
    const stdDev = Math.sqrt(variance);

    if (average > 0 && stdDev < 2) {
      console.warn('Bot signature detected in typing patterns: Standard deviation too low.', stdDev);
      return true;
    }

    return false;
  }

  sendTelemetryMetrics(data) {
    if (window.TelemetryLogger && typeof window.TelemetryLogger.logEvent === 'function') {
      window.TelemetryLogger.logEvent('login_security_metrics', data);
    } else {
      console.log('[Security Telemetry Log]:', data);
    }
  }
}

// Export initialization function
window.initLoginAnalytics = (formId, usernameInputId) => {
  return new LoginAnalytics(formId, usernameInputId);
};
export default LoginAnalytics;
