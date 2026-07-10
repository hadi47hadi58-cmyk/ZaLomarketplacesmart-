import * as admin from 'firebase-admin';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

// Load environment variables if a .env file exists
dotenv.config();

// ==========================================
// 1. SUPABASE CONFIGURATION
// ==========================================
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_KEY (or SUPABASE_SECRET_KEY) must be defined as environment variables or in a .env file.');
  process.exit(1);
}

// Path to your Firebase serviceAccountKey.json file
const SERVICE_ACCOUNT_PATH = path.join(__dirname, 'serviceAccountKey.json');

if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
  console.error(`❌ Error: serviceAccountKey.json not found at expected path: ${SERVICE_ACCOUNT_PATH}`);
  console.log('💡 Please place your serviceAccountKey.json file in the same directory as this script.');
  process.exit(1);
}

const serviceAccount = require(SERVICE_ACCOUNT_PATH);

// ==========================================
// 2. INITIALIZE SDK CLIENTS
// ==========================================
console.log('🔄 Initializing Firebase Admin SDK...');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const firestore = admin.firestore();
console.log('✅ Firebase Admin SDK successfully initialized.');

console.log('🔄 Initializing Supabase Client...');
const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});
console.log('✅ Supabase Client successfully initialized.');

// ==========================================
// 3. ID MAPPING STATE
// ==========================================
// Maps Firebase Document IDs (strings) to PostgreSQL SERIAL IDs (integers)
const firebaseUserToPostgresId = new Map<string, number>();
const firebaseStoreToPostgresId = new Map<string, number>();

// Dummy password hash for migrated users (bcrypt for '123456789')
const DEFAULT_PASSWORD_HASH = '$2b$10$eFytJDGtjbThAOM74G4tS.HjK.V84y7vY6z7T.v4e7H779774z712';

// ==========================================
// 4. MIGRATION FLOWS
// ==========================================

/**
 * Migrates admins from Firestore to Supabase 'users' table (role = 'ADMIN')
 */
async function migrateAdmins() {
  console.log('\n👑 Migrating admins to "users" table...');
  try {
    const snapshot = await firestore.collection('admins').get();
    if (snapshot.empty) {
      console.log('ℹ️ No admins found in Firestore.');
      return;
    }

    console.log(`📥 Retrieved ${snapshot.size} admins from Firestore.`);
    let successCount = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const email = data.email || `${doc.id}@zalo.dz`;
      
      // Determine role ('ADMIN' or 'CUSTOMER' or 'MERCHANT')
      let mappedRole = 'ADMIN';
      if (data.role === 'supervisor') {
        mappedRole = 'ADMIN'; // Let supervisor map to ADMIN
      }

      const userRecord = {
        name: data.name || 'Admin User',
        email: email,
        password_hash: DEFAULT_PASSWORD_HASH,
        role: mappedRole,
        status: 'ACTIVE',
        wilaya: data.wilaya || 'الجزائر',
        commune: data.commune || 'الجزائر',
        phone: data.phone || null,
        loyalty_points: 0
      };

      // Check if user already exists in Supabase to avoid duplicates
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (existingUser) {
        console.log(`ℹ️ Admin "${email}" already exists. Mapping to existing ID: ${existingUser.id}`);
        firebaseUserToPostgresId.set(doc.id, existingUser.id);
        successCount++;
        continue;
      }

      const { data: insertedUser, error } = await supabase
        .from('users')
        .insert(userRecord)
        .select('id')
        .single();

      if (error) {
        console.error(`❌ Error inserting admin "${email}":`, error.message);
      } else if (insertedUser) {
        firebaseUserToPostgresId.set(doc.id, insertedUser.id);
        console.log(`✅ Migrated admin "${email}" -> PostgreSQL ID: ${insertedUser.id}`);
        successCount++;
      }
    }

    console.log(`✨ Admins migration complete: ${successCount}/${snapshot.size} migrated successfully.`);
  } catch (error: any) {
    console.error('❌ Critical error during admins migration:', error.message || error);
  }
}

/**
 * Migrates shops (stores) and their owners to Supabase
 */
async function migrateShopsAndOwners() {
  console.log('\n🏪 Migrating shops and owners to "users" and "stores" tables...');
  try {
    const snapshot = await firestore.collection('shops').get();
    if (snapshot.empty) {
      console.log('ℹ️ No shops found in Firestore.');
      return;
    }

    console.log(`📥 Retrieved ${snapshot.size} shops from Firestore.`);
    let successCount = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const email = data.email || `merchant_${doc.id}@zalo.dz`;

      // 1. Create or Map Merchant User
      let postgresMerchantId: number | undefined;

      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (existingUser) {
        postgresMerchantId = existingUser.id;
        firebaseUserToPostgresId.set(doc.id, postgresMerchantId);
        console.log(`ℹ️ Merchant "${email}" already exists (PostgreSQL ID: ${postgresMerchantId}).`);
      } else {
        const merchantRecord = {
          name: data.ownerName || 'Merchant Owner',
          email: email,
          password_hash: DEFAULT_PASSWORD_HASH,
          role: 'MERCHANT',
          status: data.status === 'suspended' ? 'SUSPENDED' : 'ACTIVE',
          wilaya: data.wilaya || 'الجزائر',
          commune: data.commune || 'الجزائر',
          phone: data.phone || null,
          loyalty_points: 0
        };

        const { data: insertedUser, error } = await supabase
          .from('users')
          .insert(merchantRecord)
          .select('id')
          .single();

        if (error) {
          console.error(`❌ Error inserting merchant "${email}":`, error.message);
          continue;
        } else if (insertedUser) {
          postgresMerchantId = insertedUser.id;
          firebaseUserToPostgresId.set(doc.id, postgresMerchantId);
          console.log(`✅ Created merchant user "${email}" -> PostgreSQL ID: ${postgresMerchantId}`);
        }
      }

      if (!postgresMerchantId) continue;

      // 2. Insert Store
      // Map status
      let mappedStatus = 'APPROVED';
      if (data.status === 'suspended') mappedStatus = 'SUSPENDED';
      else if (data.status === 'pending') mappedStatus = 'PENDING_APPROVAL';
      else if (data.status === 'rejected') mappedStatus = 'REJECTED';

      const storeRecord = {
        merchant_id: postgresMerchantId,
        name: data.storeName || data.name || 'Unnamed Store',
        description: data.description || '',
        phone: data.phone || '0500000000',
        whatsapp: data.whatsapp || null,
        wilaya: data.wilaya || 'الجزائر',
        commune: data.commune || 'الجزائر',
        category: (data.category || 'ELECTRONICS').toUpperCase(),
        status: mappedStatus,
        rating: data.rating ? parseFloat(data.rating) : 5.00
      };

      // Check if store already exists
      const { data: existingStore } = await supabase
        .from('stores')
        .select('id')
        .eq('merchant_id', postgresMerchantId)
        .eq('name', storeRecord.name)
        .maybeSingle();

      if (existingStore) {
        console.log(`ℹ️ Store "${storeRecord.name}" already exists. Mapping to existing ID: ${existingStore.id}`);
        firebaseStoreToPostgresId.set(doc.id, existingStore.id);
        successCount++;
        continue;
      }

      const { data: insertedStore, error } = await supabase
        .from('stores')
        .insert(storeRecord)
        .select('id')
        .single();

      if (error) {
        console.error(`❌ Error inserting store "${storeRecord.name}":`, error.message);
      } else if (insertedStore) {
        firebaseStoreToPostgresId.set(doc.id, insertedStore.id);
        console.log(`✅ Migrated store "${storeRecord.name}" -> PostgreSQL ID: ${insertedStore.id}`);
        successCount++;
      }
    }

    console.log(`✨ Shops & Owners migration complete: ${successCount}/${snapshot.size} stores migrated successfully.`);
  } catch (error: any) {
    console.error('❌ Critical error during shops migration:', error.message || error);
  }
}

/**
 * Migrates products from Firestore to Supabase 'products' table
 */
async function migrateProducts() {
  console.log('\n📦 Migrating products to "products" table...');
  try {
    const snapshot = await firestore.collection('products').get();
    if (snapshot.empty) {
      console.log('ℹ️ No products found in Firestore.');
      return;
    }

    console.log(`📥 Retrieved ${snapshot.size} products from Firestore.`);
    let successCount = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      // Resolve store ID from our mapping
      const firebaseStoreId = data.storeId;
      const postgresStoreId = firebaseStoreToPostgresId.get(firebaseStoreId);

      if (!postgresStoreId) {
        console.warn(`⚠️ Warning: Store mapping not found for Firestore Store ID: "${firebaseStoreId}". Skipping product "${data.productName || data.name}".`);
        continue;
      }

      const productRecord = {
        store_id: postgresStoreId,
        name: data.productName || data.name || 'Unnamed Product',
        description: data.description || '',
        price: data.price ? parseFloat(data.price) : 0,
        category: (data.category || 'ELECTRONICS').toUpperCase(),
        stock: data.stock !== undefined ? parseInt(data.stock, 10) : (data.quantity !== undefined ? parseInt(data.quantity, 10) : 0),
        sales_count: data.salesCount !== undefined ? parseInt(data.salesCount, 10) : 0,
        rating: data.rating ? parseFloat(data.rating) : 5.00,
        image_url: data.imageUrl || data.image || '',
        is_active: data.isActive !== undefined ? !!data.isActive : true
      };

      // Check if product already exists
      const { data: existingProduct } = await supabase
        .from('products')
        .select('id')
        .eq('store_id', postgresStoreId)
        .eq('name', productRecord.name)
        .maybeSingle();

      if (existingProduct) {
        console.log(`ℹ️ Product "${productRecord.name}" already exists in store ${postgresStoreId}. Skipping.`);
        successCount++;
        continue;
      }

      const { error } = await supabase
        .from('products')
        .insert(productRecord);

      if (error) {
        console.error(`❌ Error inserting product "${productRecord.name}":`, error.message);
      } else {
        console.log(`✅ Migrated product "${productRecord.name}" under PostgreSQL Store ID: ${postgresStoreId}`);
        successCount++;
      }
    }

    console.log(`✨ Products migration complete: ${successCount}/${snapshot.size} products migrated successfully.`);
  } catch (error: any) {
    console.error('❌ Critical error during products migration:', error.message || error);
  }
}

// ==========================================
// 5. ORCHESTRATION ENGINE
// ==========================================
async function executeMigration() {
  console.log('\n🚀 =======================================================');
  console.log('🚀   STARTING CLOUD DATA MIGRATION: FIRESTORE -> SUPABASE  ');
  console.log('🚀 =======================================================\n');
  
  const startTime = Date.now();

  try {
    // 1. Migrate Admins to 'users' table
    await migrateAdmins();

    // 2. Migrate Shops & Owners to 'users' and 'stores' tables
    await migrateShopsAndOwners();

    // 3. Migrate Products to 'products' table (requires store_id)
    await migrateProducts();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n✨ =======================================================');
    console.log(`✨   MIGRATION COMPLETED SUCCESSFULLY IN ${duration}s! `);
    console.log('✨ =======================================================\n');
  } catch (err: any) {
    console.error('\n💥 Critical failure during overall migration process:', err);
  } finally {
    process.exit(0);
  }
}

// Fire up the migration
executeMigration();
