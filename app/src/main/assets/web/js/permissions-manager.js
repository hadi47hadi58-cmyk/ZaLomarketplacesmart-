// ZaLo Marketplace Smart Sync Update: 2026-07-16
/**
 * ZaLo Smart - Fine-Grained Role Based Access Control (RBAC) & Permissions Manager
 * نظام إدارة الصلاحيات المفصلة للتحقق الآمن من الصلاحيات والتحكم بالأدوار (CUSTOMER, MERCHANT, ADMIN)
 */

export const PermissionsManager = {
  // Definition of available fine-grained permissions per role
  ROLE_PERMISSIONS: {
    CUSTOMER: [
      'VIEW_PRODUCTS',
      'PLACE_ORDER',
      'VIEW_OWN_ORDERS',
      'MANAGE_PROFILE',
      'LOYALTY_PROGRAM_READ',
    ],
    MERCHANT: [
      'VIEW_PRODUCTS',
      'MANAGE_OWN_PRODUCTS',
      'VIEW_OWN_ORDERS',
      'UPDATE_ORDER_STATUS',
      'VIEW_SALES_ANALYTICS',
      'MANAGE_STORE_SETTINGS',
    ],
    ADMIN: [
      'VIEW_PRODUCTS',
      'MANAGE_ALL_PRODUCTS',
      'VIEW_ALL_ORDERS',
      'MANAGE_USERS',
      'VIEW_AUDIT_LOGS',
      'MANAGE_SYSTEM_SETTINGS',
      'VIEW_SYSTEM_ANALYTICS',
    ],
  },

  /**
   * Checks if the currently logged-in user possesses a specific privilege.
   */
  hasPermission(permission) {
    const userRole = localStorage.getItem('zalo_user_role') || 'CUSTOMER';
    const permissions = this.ROLE_PERMISSIONS[userRole.toUpperCase()] || [];
    return permissions.includes(permission);
  },

  /**
   * Enforces role protection on specific UI components or pages.
   * Hides or disables unauthorized interactive items.
   */
  enforceUIPermissions() {
    const securedElements = document.querySelectorAll('[data-require-permission]');
    
    securedElements.forEach(el => {
      const requiredPermission = el.getAttribute('data-require-permission');
      if (!this.hasPermission(requiredPermission)) {
        // Option 1: Hide element completely
        el.style.display = 'none';
        
        // Option 2: Add disabled styling to indicate visual limitation
        el.setAttribute('disabled', 'true');
        el.classList.add('unauthorized-action');
        el.style.opacity = '0.35';
        el.style.pointerEvents = 'none';
        
        console.warn(`[RBAC System] Securing component: Hidden/Disabled unauthorized action [${requiredPermission}]`);
      }
    });
  },

  /**
   * Applies permission enforcement on UI.
   */
  apply() {
    this.enforceUIPermissions();
  }
};

window.PermissionsManager = PermissionsManager;

// Run automatically on content loaded
document.addEventListener('DOMContentLoaded', () => {
  PermissionsManager.enforceUIPermissions();
});

export default PermissionsManager;
