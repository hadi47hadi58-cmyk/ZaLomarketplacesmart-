#!/bin/bash
patch_file() {
    local file=$1
    local login_page=$2
    local allowed_roles=$3
    
    # Replace the strict session check with one that supports local mock
    sed -i "s/const { data: { session }, error } = await supabase.auth.getSession();/const { data: { session } } = await supabase.auth.getSession();\n            const localToken = localStorage.getItem('zalo_session_jwt');\n            let role = localStorage.getItem('zalo_role');\n            if (session \&\& session.user) role = role || session.user.user_metadata?.role;\n            if (role) role = role.toLowerCase();/g" "$file"
    
    sed -i "s/if (error || !session || !session.user) {/if (!session \&\& !localToken) {/g" "$file"
    sed -i "s/const role = session.user.user_metadata?.role;//g" "$file"
    sed -i "s/const allowedRoles =.*/const allowedRoles = [$allowed_roles];/g" "$file"
}

patch_file "web/dashboard-admin.html" "admin-login.html" "'admin', 'super_admin'"
patch_file "web/dashboard-store.html" "store-login.html" "'admin', 'merchant', 'super_admin'"
patch_file "web/dashboard-manager.html" "staff-login.html" "'admin', 'merchant', 'manager', 'super_admin', 'staff'"

echo "Patched dashboards"
