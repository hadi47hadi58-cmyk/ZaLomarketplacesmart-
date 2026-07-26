#!/bin/bash
sed -i -e 's/if (!state.loadedProducts || state.loadedProducts.length === 0) return;/if (!state.loadedProducts) return;/g' web/customer-home.html
