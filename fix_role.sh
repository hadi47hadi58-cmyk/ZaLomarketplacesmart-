#!/bin/bash
sed -i -e 's/role = '"'"'CUSTOMER'"'"';/if (currentPath.endsWith("store-login.html")) { role = "MERCHANT"; }\n        else if (currentPath.endsWith("admin-login.html")) { role = "ADMIN"; }\n        else if (currentPath.endsWith("staff-login.html")) { role = "MANAGER"; }\n        else { role = "CUSTOMER"; }/g' web/js/supabase-db-compat.js
