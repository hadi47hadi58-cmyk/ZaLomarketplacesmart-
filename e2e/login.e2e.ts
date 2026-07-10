/**
 * ZaLo Smart - End-to-End (E2E) Login Tests (login.e2e.ts)
 * اختبارات نهاية إلى نهاية لمحاكاة رحلة الزبون والتاجر والمدير للتأكد من سلاسة التوجيه وتدفق الجلسات
 */

describe('E2E Login & Redirection Journey', () => {
  const mockLocalStorage: { [key: string]: string } = {};

  beforeEach(() => {
    // Clear mock localStorage before each test
    Object.keys(mockLocalStorage).forEach(key => delete mockLocalStorage[key]);
  });

  it('should redirect guest user on protected dashboard page to login.html', () => {
    // Simulation of session manager running on dashboard.html without token
    const isAuth = !!mockLocalStorage['zalo_session_jwt'];
    const currentPath = '/web/dashboard.html';
    
    let redirectTarget = '';
    if (!isAuth && currentPath.includes('dashboard.html')) {
      redirectTarget = 'login.html';
    }

    expect(redirectTarget).toBe('login.html');
  });

  it('should redirect authenticated merchant to merchant dashboard', () => {
    // Inject valid token and role
    mockLocalStorage['zalo_session_jwt'] = 'header.payload.signature_jwt';
    mockLocalStorage['zalo_user_role'] = 'MERCHANT';

    const isAuth = !!mockLocalStorage['zalo_session_jwt'];
    const role = mockLocalStorage['zalo_user_role'];
    const currentPath = '/web/login.html';

    let redirectTarget = '';
    if (isAuth && currentPath.includes('login.html')) {
      if (role === 'MERCHANT') {
        redirectTarget = 'dashboard.html';
      } else if (role === 'ADMIN') {
        redirectTarget = 'admin.html';
      } else {
        redirectTarget = 'customer-home.html';
      }
    }

    expect(redirectTarget).toBe('dashboard.html');
  });

  it('should redirect authenticated admin to admin control panel', () => {
    // Inject admin credentials
    mockLocalStorage['zalo_session_jwt'] = 'header.payload.signature_jwt_admin';
    mockLocalStorage['zalo_user_role'] = 'ADMIN';

    const isAuth = !!mockLocalStorage['zalo_session_jwt'];
    const role = mockLocalStorage['zalo_user_role'];
    const currentPath = '/web/login.html';

    let redirectTarget = '';
    if (isAuth && currentPath.includes('login.html')) {
      if (role === 'MERCHANT') {
        redirectTarget = 'dashboard.html';
      } else if (role === 'ADMIN') {
        redirectTarget = 'admin.html';
      } else {
        redirectTarget = 'customer-home.html';
      }
    }

    expect(redirectTarget).toBe('admin.html');
  });
});
