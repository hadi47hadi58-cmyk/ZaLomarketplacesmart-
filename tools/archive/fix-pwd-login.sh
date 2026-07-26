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

    sed -i "s/const { error } = await supabaseClient.auth.signInWithPassword({ email, password });/const { error, data } = await supabaseClient.auth.signInWithPassword({ email, password });/g" "$f"
    
    sed -i "s/if (error) throw error;/if (error) throw error;\n            localStorage.setItem('zalo_session_jwt', (data \&\& data.session) ? data.session.access_token : ('mock-pwd-token-' + Date.now()));\n            localStorage.setItem('zalo_user_email', email);\n            localStorage.setItem('zalo_uid', (data \&\& data.user) ? data.user.id : ('$ROLE-' + Date.now()));\n            localStorage.setItem('zalo_role', '$ROLE');/g" "$f"
    echo "Fixed $f pwd login"
  fi
done
