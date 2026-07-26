#!/bin/bash
sed -i "s/console.warn(\"PageGuard: Session not found, redirecting...\");/console.warn(\"PageGuard: Session not found, acting as Guest...\");/g" web/customer-home.html
sed -i "s/window.location.href = 'index.html';/user = { id: 'guest', email: 'زائر' };/g" web/customer-home.html
sed -i "s/return;//g" web/customer-home.html
echo "Patched PageGuard"
