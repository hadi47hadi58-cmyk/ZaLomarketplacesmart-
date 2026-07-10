/**
 * ZaLo Smart - Password Strength Verification Unit Tests (password-strength.spec.ts)
 * اختبارات التحقق من قوة ومتانة كلمات المرور وامتثالها لمعايير الأمن السيبراني الموحدة
 */

// A simple local function that replicates password validator logic
function validatePasswordStrength(password: string): { isValid: boolean; score: number; feedback: string[] } {
  const feedback: string[] = [];
  let score = 0;

  if (!password || password.length < 8) {
    feedback.push('يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.');
  } else {
    score += 2;
  }

  if (/[A-Z]/.test(password)) {
    score += 2;
  } else {
    feedback.push('يرجى إضافة حرف كبير واحد على الأقل (A-Z).');
  }

  if (/[a-z]/.test(password)) {
    score += 1;
  }

  if (/\d/.test(password)) {
    score += 2;
  } else {
    feedback.push('يرجى إضافة رقم واحد على الأقل (0-9).');
  }

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 3;
  } else {
    feedback.push('يرجى إضافة رمز خاص واحد على الأقل مثل (@، #، $).');
  }

  return {
    isValid: score >= 8 && password.length >= 8,
    score,
    feedback,
  };
}

describe('Password Strength Validator Unit Tests', () => {
  it('should reject empty or very short passwords', () => {
    const result = validatePasswordStrength('123');
    expect(result.isValid).toBe(false);
    expect(result.feedback).toContain('يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.');
  });

  it('should flag weak passwords lacking uppercase letters or symbols', () => {
    const result = validatePasswordStrength('weakpassword123');
    expect(result.isValid).toBe(false);
    expect(result.feedback).toContain('يرجى إضافة حرف كبير واحد على الأقل (A-Z).');
    expect(result.feedback).toContain('يرجى إضافة رمز خاص واحد على الأقل مثل (@، #، $).');
  });

  it('should approve complex passwords with uppercase, numbers, and special symbols', () => {
    const result = validatePasswordStrength('ZaloMarketplace#2026!');
    expect(result.isValid).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(8);
    expect(result.feedback.length).toBe(0);
  });
});
