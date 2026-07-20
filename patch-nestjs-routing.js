const fs = require('fs');
let content = fs.readFileSync('web/js/supabase-db-compat.js', 'utf8');

const replacement = `export async function getDocs(queryObj) {
    const table = queryObj.table || queryObj;
    
    // 1. Try unified NestJS API routing for products catalog
    if (table === 'products') {
        try {
            const token = localStorage.getItem('zalo_session_jwt') || localStorage.getItem('nestjs_token');
            const headers = token ? { 'Authorization': 'Bearer ' + token } : {};
            const res = await fetch('/api/products', { headers });
            if (res.ok) {
                const result = await res.json();
                if (result && result.data) {
                    console.log("[ZaLo Compat] Fetched products from NestJS:", result.data.length);
                    return {
                        docs: result.data.map(p => ({
                            id: p.id,
                            exists: true,
                            data: () => p
                        }))
                    };
                }
            }
        } catch(e) {
            console.warn("[ZaLo Compat] NestJS products fetch failed, falling back to Supabase", e);
        }
    }

    // 2. Try NestJS routing for orders list
    if (table === 'orders') {
        try {
            const token = localStorage.getItem('zalo_session_jwt') || localStorage.getItem('nestjs_token');
            if (token) {
                const headers = { 'Authorization': 'Bearer ' + token };
                const res = await fetch('/api/orders', { headers });
                if (res.ok) {
                    const result = await res.json();
                    if (result && result.data) {
                        console.log("[ZaLo Compat] Fetched orders from NestJS:", result.data.length);
                        return {
                            docs: result.data.map(o => ({
                                id: o.id,
                                exists: true,
                                data: () => o
                            }))
                        };
                    }
                }
            }
        } catch(e) {
            console.warn("[ZaLo Compat] NestJS orders fetch failed, falling back to Supabase", e);
        }
    }`;

// Find where export async function getDocs is
const start = content.indexOf('export async function getDocs(queryObj) {');
const end = content.indexOf('// Resilient Fallback for merchant_requests', start);
if (start !== -1 && end !== -1) {
    content = content.substring(0, start) + replacement + "\n\n    " + content.substring(end);
    fs.writeFileSync('web/js/supabase-db-compat.js', content);
    console.log("Patched getDocs for NestJS routing");
}

const addDocStart = content.indexOf('export async function addDoc(colRef, data) {');
const addDocEnd = content.indexOf('const cleanData = { ...data };', addDocStart);
if (addDocStart !== -1 && addDocEnd !== -1) {
    const addDocReplacement = `export async function addDoc(colRef, data) {
    // Intercept checkout to create order in NestJS + PostgreSQL
    if (colRef.table === 'orders') {
        try {
            const token = localStorage.getItem('zalo_session_jwt') || localStorage.getItem('nestjs_token');
            if (token) {
                const res = await fetch('/api/orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                    body: JSON.stringify(data)
                });
                if (res.ok) {
                    const result = await res.json();
                    return {
                        id: result.data.id,
                        data: () => result.data
                    };
                }
            }
        } catch (e) {
            console.warn("[ZaLo Compat] NestJS add order failed, falling back to Supabase", e);
        }
    }
    
    `;
    content = content.substring(0, addDocStart) + addDocReplacement + content.substring(addDocEnd);
    fs.writeFileSync('web/js/supabase-db-compat.js', content);
    console.log("Patched addDoc for NestJS routing");
}

