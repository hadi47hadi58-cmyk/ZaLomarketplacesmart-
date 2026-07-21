#!/bin/bash

for file in web/store-login.html web/staff-login.html web/admin-login.html; do
  # We want to remove lines 356 to 360 which contain those two register links and their wrapping divs
  # Let's first check if line 356 has "ليس لديك حساب"
  sed -i -e '/ليس لديك حساب/d' \
         -e '/أنشئ حساباً جديداً/d' \
         -e '/هل ترغب في الانضمام لفريق عملنا؟/d' \
         -e '/قدم طلب توظيف الآن/d' \
         -e '/<div class="register-link" style="margin-top: 8px;">/d' \
         "$file"
done
echo "Cleaned footers safely"
