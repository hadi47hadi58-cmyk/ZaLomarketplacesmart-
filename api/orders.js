/**
 * Vercel Serverless Function - ZaLo Orders API
 * Handles secure order creation and retrieval using SUPABASE_SERVICE_ROLE_KEY
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

  // GET: Retrieve orders
  if (req.method === 'GET') {
    try {
      const { store_id, status } = req.query;
      let query = supabaseAdmin.from('orders').select('*').order('created_at', { ascending: false });

      if (store_id) query = query.eq('store_id', store_id);
      if (status) query = query.eq('status', status);

      const { data, error } = await query;
      if (error) {
        return res.status(500).json({ success: false, error: error.message });
      }
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
      if (isNaN(qty) || qty <= 0) {
        return res.status(400).json({
          success: false,
          error: 'الكمية (quantity) يجب أن تكون رقماً أكبر من 0.'
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

      const pName = product_name || (items && items[0] && (items[0].name || items[0].title)) || 'طلب زبون';
      const orderStatus = body.status || 'pending'; // Default: pending for immediate manager visibility

      const orderId = body.id || ('ord_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7));

      // 2. Exact Payload matching Supabase Schema & Requirements
      const orderPayload = {
        id: orderId,
        product_name: pName,
        quantity: qty,
        shipping_wilaya: wilayaNum,
        status: orderStatus,
        customer_name: customer_name || body.customerName || 'زبون المنصة',
        customer_phone: customer_phone || body.customerPhone || '',
        delivery_address: delivery_address || address || body.address || '',
        address: delivery_address || address || body.address || '',
        wilaya: wilayaNum.toString(),
        total_amount: parseFloat(total_amount || body.totalAmount || 0),
        store_id: store_id || body.storeId || 'direct',
        store_name: store_name || body.storeName || 'متجر معتمد',
        payment_method: payment_method || body.paymentMethod || 'cod',
        payment_status: 'pending',
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
        message: 'تم تسجيل وتأكيد الطلبية بنجاح في قاعدة البيانات السحابية.',
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
