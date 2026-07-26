#!/bin/bash
sed -i -E 's/(if \(!drawer\))[ ]*$/\1 return;/g' web/customer-home.html
sed -i -E 's/(if \(!input\))[ ]*$/\1 return;/g' web/customer-home.html
sed -i -E 's/(if \(!text\))[ ]*$/\1 return;/g' web/customer-home.html
sed -i -E 's/(if \(!btn \|\| !container\))[ ]*$/\1 return;/g' web/customer-home.html
sed -i -E 's/(if \(!user\))[ ]*$/\1 return;/g' web/customer-home.html
sed -i -E 's/(if \(!grid\))[ ]*$/\1 return;/g' web/customer-home.html
sed -i -E 's/(if \(!query\)) \{/\1 \{/g' web/customer-home.html
sed -i -E 's/(if \(!state\.selectedProduct\))[ ]*$/\1 return;/g' web/customer-home.html
sed -i -E 's/(if \(!container\))[ ]*$/\1 return;/g' web/customer-home.html
sed -i -E 's/(if \(!container \|\| !form\))[ ]*$/\1 return;/g' web/customer-home.html
sed -i -E 's/(if \(!container \|\| !tracker\))[ ]*$/\1 return;/g' web/customer-home.html
sed -i -E 's/(if \(!badge\))[ ]*$/\1 return;/g' web/customer-home.html
sed -i -E 's/(if \(!modal \|\| !body\))[ ]*$/\1 return;/g' web/customer-home.html
sed -i -E 's/(if \(!state\.loadedProducts \|\| state\.loadedProducts\.length === 0\))[ ]*$/\1 return;/g' web/customer-home.html
echo "Fixed returns"
