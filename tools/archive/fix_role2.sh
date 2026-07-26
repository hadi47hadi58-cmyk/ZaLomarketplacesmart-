#!/bin/bash
sed -i -e 's/if (currentPath.endsWith("store-login.html")) { role = "MERCHANT"; }/if (currentPath.includes("store-login") || currentPath.includes("dashboard-store")) { role = "MERCHANT"; }/g' web/js/supabase-db-compat.js
sed -i -e 's/else if (currentPath.endsWith("admin-login.html")) { role = "ADMIN"; }/else if (currentPath.includes("admin-login") || currentPath.includes("dashboard-admin")) { role = "ADMIN"; }/g' web/js/supabase-db-compat.js
sed -i -e 's/else if (currentPath.endsWith("staff-login.html")) { role = "MANAGER"; }/else if (currentPath.includes("staff-login") || currentPath.includes("dashboard-manager")) { role = "MANAGER"; }/g' web/js/supabase-db-compat.js
