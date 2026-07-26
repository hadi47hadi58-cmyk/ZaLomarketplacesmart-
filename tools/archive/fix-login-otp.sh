#!/bin/bash
for f in web/customer-login.html web/store-login.html web/staff-login.html web/admin-login.html; do
  if [ -f "$f" ]; then
    if [[ "$f" == *"customer-login"* ]]; then
      ROLE="CUSTOMER"
    elif [[ "$f" == *"store-login"* ]]; then
      ROLE="MERCHANT"
    elif [[ "$f" == *"staff-login"* ]]; then
      ROLE="MANAGER"
    elif [[ "$f" == *"admin-login"* ]]; then
      ROLE="ADMIN"
    fi

    sed -i "s/if (res.success) {/if (res.success) {\n              localStorage.setItem('zalo_session_jwt', res.token || ('mock-otp-token-' + Date.now()));\n              localStorage.setItem('zalo_user_email', email);\n              localStorage.setItem('zalo_uid', res.userId || ('$ROLE-' + Date.now()));\n              localStorage.setItem('zalo_role', '$ROLE');/g" "$f"
    echo "Fixed $f"
  fi
done
