#!/bin/bash

# Create store-login.html
cat web/customer-login.html > web/store-login.html
sed -i 's/<title>تسجيل الدخول - ZaLo<\/title>/<title>بوابة التاجر - ZaLo<\/title>/g' web/store-login.html
sed -i 's/🔐 تسجيل الدخول لحسابك/🔐 تسجيل الدخول - لوحة التاجر/g' web/store-login.html
sed -i 's/customer-home\.html/dashboard-store.html/g' web/store-login.html
sed -i 's/CUSTOMER-/MERCHANT-/g' web/store-login.html
sed -i "s/'CUSTOMER'/'MERCHANT'/g" web/store-login.html

# Create staff-login.html
cat web/customer-login.html > web/staff-login.html
sed -i 's/<title>تسجيل الدخول - ZaLo<\/title>/<title>بوابة فريق العمل - ZaLo<\/title>/g' web/staff-login.html
sed -i 's/🔐 تسجيل الدخول لحسابك/🔐 تسجيل الدخول - فريق العمل/g' web/staff-login.html
sed -i 's/customer-home\.html/dashboard-manager.html/g' web/staff-login.html
sed -i 's/CUSTOMER-/MANAGER-/g' web/staff-login.html
sed -i "s/'CUSTOMER'/'MANAGER'/g" web/staff-login.html

# Create admin-login.html
cat web/customer-login.html > web/admin-login.html
sed -i 's/<title>تسجيل الدخول - ZaLo<\/title>/<title>بوابة الإدارة - ZaLo<\/title>/g' web/admin-login.html
sed -i 's/🔐 تسجيل الدخول لحسابك/🔐 تسجيل الدخول - الإدارة العليا/g' web/admin-login.html
sed -i 's/customer-home\.html/dashboard-admin.html/g' web/admin-login.html
sed -i 's/CUSTOMER-/ADMIN-/g' web/admin-login.html
sed -i "s/'CUSTOMER'/'ADMIN'/g" web/admin-login.html

echo "Unified login pages!"
