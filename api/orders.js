/**
 * Vercel Serverless Function - ZaLo Orders API (Secure Edition)
 * Handles secure order creation and retrieval using SUPABASE_SERVICE_ROLE_KEY
 * Enforces strict authentication and role-based access controls (RBAC) to protect user data.
 */
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase with Service Role Key to bypass RLS restrictions safely on server
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zsscbsnufmu72b7pbbaapm.supabase.co';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

let supabaseAdmin = null;
if (supabaseUrl && supabaseServiceRoleKey) {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!supabaseAdmin) {
    return res.status(500).json({
      success: false,
      error: 'Supabase Service Role client is not configured. Missing SUPABASE_SERVICE_ROLE_KEY.'
    });
  }

  // AUTHENTICATION GUARD
  let isAuthenticated = false;
  let callerUser = null;
  let callerRole = 'CUSTOMER';

  // 1. Check for API key (Useful for backend-to-backend communication, e.g. NestJS or trusted jobs)
  const apiKeyHeader = req.headers['x-api-key'];
  const internalApiKey = process.env.ZALO_INTERNAL_API_KEY;

  if (apiKeyHeader && internalApiKey && apiKeyHeader === internalApiKey) {
    isAuthenticated = true;
    callerRole = 'SYSTEM'; // Granted system/admin bypass
  } 
  
  // 2. Fallback to Supabase User Token
  if (!isAuthenticated) {
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
        if (!authError && user) {
          callerUser = user;
          isAuthenticated = true;
          
          // Determine caller role securely from user metadata or profile table
          let role = user.app_metadata?.role || user.user_metadata?.role;
          
          try {
            const { data: profile } = await supabaseAdmin
              .from('profiles')
              .select('role')
              .eq('id', user.id)
              .maybeSingle();
            if (profile && profile.role) {
              role = profile.role;
            }
          } catch (e) {
            console.warn('[ZaLo Auth Guard] Profiles table fetch failed, using metadata:', e.message);
          }
          
          callerRole = (role || 'CUSTOMER').toUpperCase();
        }
      } catch (tokenErr) {
        console.error('[ZaLo Auth Guard] Token verification error:', tokenErr.message);
      }
    }
  }

  // Deny access if not authenticated
  if (!isAuthenticated) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Access denied. Please provide a valid authorization token or API key.'
    });
  }

  // GET: Retrieve orders (Strictly filtered by role to prevent data leakage)
  if (req.method === 'GET') {
    try {
      const { store_id, status } = req.query;
      let query = supabaseAdmin.from('orders').select('*').order('created_at', { ascending: false });

      // Apply Security Filters based on caller's role
      if (callerRole === 'SYSTEM' || callerRole === 'ADMIN' || callerRole === 'SUPER_ADMIN') {
        // Admins can see everything. Allow optional filters if provided.
        if (store_id) query = query.eq('store_id', store_id);
        if (status) query = query.eq('status', status);
      } 
      else if (callerRole === 'MERCHANT') {
        // Merchants can only view orders from THEIR OWN store.
        // Step A: Find the store owned by this merchant
        const { data: store, error: storeErr } = await supabaseAdmin
          .from('stores')
          .select('id')
          .eq('merchant_id', callerUser.id)
          .maybeSingle();

        if (storeErr || !store) {
          return res.status(403).json({
            success: false,
            error: 'Forbidden: No associated merchant store found.'
          });
        }

        const merchantStoreId = store.id;
        
        // Enforce query filtering on merchant's own store
        query = query.eq('store_id', merchantStoreId);
        if (status) query = query.eq('status', status);
      } 
      else if (callerRole === 'CUSTOMER') {
        // Customers can ONLY see their own orders.
        // We filter by their customer_id matching the authenticated user's ID
        query = query.eq('customer_id', callerUser.id);
        if (status) query = query.eq('status', status);
      } 
      else {
        // Unknown role or no permissions
        return res.status(403).json({
          success: false,
          error: 'Forbidden: Insufficient privileges to view orders.'
        });
      }

      const { data, error } = await query;
      if (error) {
        return res.status(500).json({ success: false, error: error.message });
      }

      // Sanitize output for non-admin/non-merchant to prevent metadata leakage if necessary
      return res.status(200).json({ success: true, count: data.length, data });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // POST: Create New Order
  if (req.method === 'POST') {
    try {
      const body = req.body || {};
      const {
        product_name,
        quantity,
        shipping_wilaya,
        customer_name,
        customer_phone,
        delivery_address,
        address,
        total_amount,
        store_id,
        store_name,
        payment_method,
        items
      } = body;

      // 1. Validation of Mandatory Fields
      if (!product_name && (!items || items.length === 0)) {
        return res.status(400).json({
          success: false,
          error: 'حقل اسم المنتج (product_name) أو قائمة العناصر إجباري.'
        });
      }

      const qty = parseInt(quantity || (items && items[0] && items[0].qty) || 1, 10);
      if (isNaN(qty) || qty <= 0 || qty > 1000) { // Limit max quantity per order to prevent spam/overflow
        return res.status(400).json({
          success: false,
          error: 'الكمية (quantity) يجب أن تكون رقماً معقولاً أكبر من 0.'
        });
      }

      // Wilaya Validation (1 to 69)
      const wilayaNum = parseInt(shipping_wilaya || body.wilaya || 16, 10);
      if (isNaN(wilayaNum) || wilayaNum < 1 || wilayaNum > 69) {
        return res.status(400).json({
          success: false,
          error: 'رقم ولاية الشحن (shipping_wilaya) يجب أن يكون محصوراً بين 1 و 69.'
        });
      }

      // Validate total amount to prevent giant/unrealistic spam values
      const parsedAmount = parseFloat(total_amount || body.totalAmount || 0);
      if (isNaN(parsedAmount) || parsedAmount < 0 || parsedAmount > 10000000) {
        return res.status(400).json({
          success: false,
          error: 'القيمة الإجمالية للطلب غير صالحة أو مبالغ فيها.'
        });
      }

      const pName = String(product_name || (items && items[0] && (items[0].name || items[0].title)) || 'طلب زبون').substring(0, 150);
      const orderStatus = body.status || 'pending'; // Default: pending for immediate manager visibility

      const orderId = body.id || ('ord_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7));

      // Security measure: Force customer_id to be the authenticated user's ID if available
      const customerId = callerUser ? callerUser.id : null;

      // 2. Exact Payload matching Supabase Schema & Requirements
      const orderPayload = {
        id: orderId,
        product_name: pName,
        quantity: qty,
        shipping_wilaya: wilayaNum,
        status: orderStatus,
        customer_name: String(customer_name || body.customerName || 'زبون المنصة').substring(0, 100),
        customer_phone: String(customer_phone || body.customerPhone || '').substring(0, 20),
        delivery_address: String(delivery_address || address || body.address || '').substring(0, 500),
        address: String(delivery_address || address || body.address || '').substring(0, 500),
        wilaya: wilayaNum.toString(),
        total_amount: parsedAmount,
        store_id: store_id || body.storeId || 'direct',
        store_name: String(store_name || body.storeName || 'متجر معتمد').substring(0, 100),
        payment_method: payment_method || body.paymentMethod || 'cod',
        payment_status: 'pending',
        customer_id: customerId, // Secured linked field
        items: typeof items === 'string' ? items : JSON.stringify(items || [{ name: pName, qty: qty }]),
        created_at: new Date().toISOString()
      };

      // 3. Technical Execution in Supabase Database FIRST (No simulated/mock response)
      const { data, error } = await supabaseAdmin
        .from('orders')
        .insert([orderPayload])
        .select()
        .single();

      if (error) {
        console.error('[ZaLo Backend Order Error]:', error);
        return res.status(500).json({
          success: false,
          error: error.message || 'فشل تسجيل الطلب في قاعدة البيانات.'
        });
      }

      // 4. Return Verified Success Result ONLY after error === null
      return res.status(201).json({
        success: true,
        message: 'تم تسجيل وتأكيد الطلبية بنجاح في قاعدة البيانات السحابية الحية.',
        orderId: data.id || orderId,
        data: data
      });

    } catch (err) {
      console.error('[ZaLo Orders Exception]:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'حدث خطأ غير متوقع أثناء معالجة الطلبية.'
      });
    }
  }

  return res.status(405).json({ success: false, error: 'Method Not Allowed' });
};
