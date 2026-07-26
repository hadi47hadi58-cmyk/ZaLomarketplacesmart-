#!/bin/bash

for file in web/store-login.html web/staff-login.html web/admin-login.html; do
  sed -i '/ليس لديك حساب؟/d' "$file"
  sed -i '/أنشئ حساباً جديداً/d' "$file"
  sed -i '/هل ترغب في الانضمام لفريق عملنا؟/d' "$file"
  sed -i '/قدم طلب توظيف الآن/d' "$file"
done

echo "Cleaned footers"
