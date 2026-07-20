package com.zalo.marketplace.data

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Dao
interface EcomDao {

    // --- Users ---
    @Query("SELECT * FROM users")
    fun getAllUsers(): Flow<List<User>>

    @Query("SELECT * FROM users WHERE email = :email LIMIT 1")
    suspend fun getUserByEmail(email: String): User?

    @Query("SELECT * FROM users WHERE id = :id LIMIT 1")
    fun getUserById(id: Int): Flow<User?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertUser(user: User): Long

    @Update
    suspend fun updateUser(user: User)

    // --- Stores ---
    @Query("SELECT * FROM stores")
    fun getAllStores(): Flow<List<Store>>

    @Query("SELECT * FROM stores WHERE id = :id LIMIT 1")
    fun getStoreById(id: Int): Flow<Store?>

    @Query("SELECT * FROM stores WHERE merchantId = :merchantId LIMIT 1")
    fun getStoreByMerchantId(merchantId: Int): Flow<Store?>

    @Query("SELECT * FROM stores WHERE status = :status")
    fun getStoresByStatus(status: String): Flow<List<Store>>

    @Query("SELECT * FROM stores WHERE wilaya = :wilaya")
    fun getStoresByWilaya(wilaya: String): Flow<List<Store>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertStore(store: Store): Long

    @Update
    suspend fun updateStore(store: Store)

    // --- Products ---
    @Query("SELECT * FROM products")
    fun getAllProducts(): Flow<List<Product>>

    @Query("SELECT * FROM products WHERE storeId = :storeId")
    fun getProductsByStore(storeId: Int): Flow<List<Product>>

    @Query("SELECT * FROM products WHERE id = :id LIMIT 1")
    fun getProductById(id: Int): Flow<Product?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertProduct(product: Product): Long

    @Delete
    suspend fun deleteProduct(product: Product)

    @Update
    suspend fun updateProduct(product: Product)

    // --- Orders ---
    @Query("SELECT * FROM orders ORDER BY timestamp DESC")
    fun getAllOrders(): Flow<List<Order>>

    @Query("SELECT * FROM orders WHERE customerId = :customerId ORDER BY timestamp DESC")
    fun getOrdersByCustomer(customerId: Int): Flow<List<Order>>

    @Query("SELECT * FROM orders WHERE storeId = :storeId ORDER BY timestamp DESC")
    fun getOrdersByStore(storeId: Int): Flow<List<Order>>

    @Query("SELECT * FROM orders WHERE id = :id LIMIT 1")
    fun getOrderById(id: Int): Flow<Order?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOrder(order: Order): Long

    @Update
    suspend fun updateOrder(order: Order)

    // --- Order Items ---
    @Query("SELECT * FROM order_items WHERE orderId = :orderId")
    fun getOrderItems(orderId: Int): Flow<List<OrderItem>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOrderItems(items: List<OrderItem>)

    // --- Complaints ---
    @Query("SELECT * FROM complaints ORDER BY timestamp DESC")
    fun getAllComplaints(): Flow<List<Complaint>>

    @Query("SELECT * FROM complaints WHERE userId = :userId ORDER BY timestamp DESC")
    fun getComplaintsByUser(userId: Int): Flow<List<Complaint>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertComplaint(complaint: Complaint): Long

    @Update
    suspend fun updateComplaint(complaint: Complaint)

    // --- Reviews ---
    @Query("SELECT * FROM reviews WHERE productId = :productId ORDER BY timestamp DESC")
    fun getReviewsForProduct(productId: Int): Flow<List<Review>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertReview(review: Review): Long

    // --- Notifications ---
    @Query("SELECT * FROM notifications WHERE userId = :userId ORDER BY timestamp DESC")
    fun getNotificationsByUser(userId: Int): Flow<List<Notification>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertNotification(notification: Notification): Long

    @Query("UPDATE notifications SET isRead = 1 WHERE userId = :userId")
    suspend fun markAllNotificationsAsRead(userId: Int)

    // --- Subscriptions ---
    @Query("SELECT * FROM merchant_subscriptions WHERE merchantId = :merchantId LIMIT 1")
    fun getSubscriptionByMerchant(merchantId: Int): Flow<MerchantSubscription?>

    @Query("SELECT * FROM merchant_subscriptions WHERE status = 'PENDING_VERIFICATION'")
    fun getPendingSubscriptions(): Flow<List<MerchantSubscription>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSubscription(sub: MerchantSubscription): Long

    @Update
    suspend fun updateSubscription(sub: MerchantSubscription)

    // --- Audit Logs ---
    @Query("SELECT * FROM audit_logs ORDER BY timestamp DESC")
    fun getAllAuditLogs(): Flow<List<AuditLog>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAuditLog(log: AuditLog): Long
}
