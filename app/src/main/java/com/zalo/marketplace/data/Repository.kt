package com.zalo.marketplace.data

import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.firstOrNull

class EcomRepository(private val dao: EcomDao) {

    val allUsers: Flow<List<User>> = dao.getAllUsers()
    val allStores: Flow<List<Store>> = dao.getAllStores()
    val allProducts: Flow<List<Product>> = dao.getAllProducts()
    val allOrders: Flow<List<Order>> = dao.getAllOrders()
    val allComplaints: Flow<List<Complaint>> = dao.getAllComplaints()
    val allAuditLogs: Flow<List<AuditLog>> = dao.getAllAuditLogs()

    fun getStoreByMerchantId(merchantId: Int): Flow<Store?> = dao.getStoreByMerchantId(merchantId)
    fun getStoreById(id: Int): Flow<Store?> = dao.getStoreById(id)
    fun getProductsByStore(storeId: Int): Flow<List<Product>> = dao.getProductsByStore(storeId)
    fun getOrdersByCustomer(customerId: Int): Flow<List<Order>> = dao.getOrdersByCustomer(customerId)
    fun getOrdersByStore(storeId: Int): Flow<List<Order>> = dao.getOrdersByStore(storeId)
    fun getReviewsForProduct(productId: Int): Flow<List<Review>> = dao.getReviewsForProduct(productId)
    fun getNotificationsByUser(userId: Int): Flow<List<Notification>> = dao.getNotificationsByUser(userId)
    fun getSubscriptionByMerchant(merchantId: Int): Flow<MerchantSubscription?> = dao.getSubscriptionByMerchant(merchantId)
    fun getOrderItems(orderId: Int): Flow<List<OrderItem>> = dao.getOrderItems(orderId)

    suspend fun getUserByEmail(email: String): User? = dao.getUserByEmail(email)

    suspend fun insertUser(user: User): Long = dao.insertUser(user)
    suspend fun updateUser(user: User) = dao.updateUser(user)

    suspend fun insertStore(store: Store): Long = dao.insertStore(store)
    suspend fun updateStore(store: Store) = dao.updateStore(store)

    suspend fun insertProduct(product: Product): Long = dao.insertProduct(product)
    suspend fun updateProduct(product: Product) = dao.updateProduct(product)
    suspend fun deleteProduct(product: Product) = dao.deleteProduct(product)

    suspend fun insertComplaint(complaint: Complaint): Long = dao.insertComplaint(complaint)
    suspend fun updateComplaint(complaint: Complaint) = dao.updateComplaint(complaint)

    suspend fun insertAuditLog(log: AuditLog) = dao.insertAuditLog(log)
    suspend fun insertReview(review: Review) = dao.insertReview(review)
    suspend fun insertNotification(notification: Notification) = dao.insertNotification(notification)
    suspend fun markAllNotificationsAsRead(userId: Int) = dao.markAllNotificationsAsRead(userId)

    suspend fun insertSubscription(sub: MerchantSubscription) = dao.insertSubscription(sub)
    suspend fun updateSubscription(sub: MerchantSubscription) = dao.updateSubscription(sub)

    // --- High-level composite transitions ---
    suspend fun checkout(
        customerId: Int,
        storeId: Int,
        storeName: String,
        items: List<Pair<Product, Int>>,
        paymentMethod: String,
        deliveryFee: Double,
        address: String
    ): Long {
        val totalAmount = items.sumOf { it.first.price * it.second }
        val order = Order(
            customerId = customerId,
            storeId = storeId,
            storeName = storeName,
            status = "PENDING",
            totalAmount = totalAmount,
            paymentMethod = paymentMethod,
            paymentStatus = if (paymentMethod == "COD") "PENDING" else "PAID_VERIFY",
            deliveryFee = deliveryFee,
            address = address
        )
        val orderId = dao.insertOrder(order).toInt()

        // Create order items
        val orderItems = items.map { (product, qty) ->
            OrderItem(
                orderId = orderId,
                productId = product.id,
                productName = product.name,
                price = product.price,
                quantity = qty
            )
        }
        dao.insertOrderItems(orderItems)

        // Lower product stock & increase salesCount
        for ((product, qty) in items) {
            val updatedProd = product.copy(
                stock = (product.stock - qty).coerceAtLeast(0),
                salesCount = product.salesCount + qty
            )
            dao.updateProduct(updatedProd)
        }

        // Award dynamic loyalty points
        val currentUsers = dao.getAllUsers().firstOrNull() ?: emptyList()
        val user = currentUsers.find { it.id == customerId }
        if (user != null) {
            val awardedPoints = (totalAmount / 100).toInt().coerceAtLeast(10)
            dao.updateUser(user.copy(loyaltyPoints = user.loyaltyPoints + awardedPoints))
        }

        // Write log
        dao.insertAuditLog(
            AuditLog(
                actorName = "Customer #$customerId",
                action = "PLACE_ORDER",
                details = "Placed order #$orderId to Store #$storeId for total ${totalAmount + deliveryFee} DZD"
            )
        )

        // Send Notification
        dao.insertNotification(
            Notification(
                userId = customerId,
                title = "تم استلام طلبك نجاح!",
                message = "جاري مراجعة طلبك رقم #$orderId من طرف المتجر وقيمته DZD ${totalAmount + deliveryFee}."
            )
        )

        return orderId.toLong()
    }

    suspend fun updateOrderStatus(orderId: Int, newStatus: String, actorName: String) {
        dao.getAllOrders().firstOrNull()?.find { it.id == orderId }?.let { order ->
            val updatedOrder = order.copy(
                status = newStatus,
                paymentStatus = if (newStatus == "COMPLETED") "COMPLETED" else order.paymentStatus
            )
            dao.updateOrder(updatedOrder)

            // Audit
            dao.insertAuditLog(
                AuditLog(
                    actorName = actorName,
                    action = "UPDATE_ORDER_STATUS",
                    details = "Order #$orderId updated to $newStatus"
                )
            )

            // Send notification to customer
            val msg = when (newStatus) {
                "CONFIRMED" -> "تم قبول وتأكيد طلبك #$orderId! جاري تحضير المحتويات."
                "PREPARING" -> "طلبك #$orderId قيد التحضير والتغليف حالياً."
                "SHIPPING" -> "طلبك #$orderId قيد الشحن الآن مع سائق التوصيل!"
                "DELIVERED" -> "تم توصيل طلبك #$orderId بنجاح! شكراً للتسوق."
                "COMPLETED" -> "تم إكمال المعاملة لطلبك #$orderId."
                "CANCELLED" -> "تم إلغاء طلبك #$orderId."
                else -> "تغيرت حالة طلبك #$orderId إلى $newStatus"
            }
            dao.insertNotification(
                Notification(
                    userId = order.customerId,
                    title = "تحديث حالة الطلب",
                    message = msg
                )
            )
        }
    }

    // Initial state setup to match provided look & Wilayas/Communes/Approved stores
    suspend fun seedInitialData() {
        // Users
        val usersCount = dao.getAllUsers().firstOrNull()?.size ?: 0
        if (usersCount == 0) {
            // Seed Super Admin
            val adminId = dao.insertUser(
                User(
                    email = "admin@zalo.dz",
                    name = "عبد الهادي نجمي",
                    role = "SUPER_ADMIN"
                )
            )
            
            // Seed Merchants
            val m1 = dao.insertUser(
                User(
                    email = "tech@zalo.dz",
                    name = "محمد - تيك مارشيه",
                    role = "MERCHANT"
                )
            ).toInt()

            val m2 = dao.insertUser(
                User(
                    email = "green@zalo.dz",
                    name = "أحمد - الأخضر بازار",
                    role = "MERCHANT"
                )
            ).toInt()

            val m3 = dao.insertUser(
                User(
                    email = "seller@zalo.dz",
                    name = "سعيد - بائع جديد",
                    role = "MERCHANT"
                )
            ).toInt()

            // Seed Customers
            val c1 = dao.insertUser(
                User(
                    email = "zinzinochop@gmail.com",
                    name = "العميل الجزائري الذكي",
                    role = "CUSTOMER",
                    loyaltyPoints = 1250,
                    wilaya = "الجزائر",
                    commune = "المرسى"
                )
            )

            // Deliver driver
            dao.insertUser(
                User(
                    email = "driver@zalo.dz",
                    name = "ياسين التوصيل السريع",
                    role = "DRIVER"
                )
            )

            // Seed approved Stores from screenshots
            val s1 = dao.insertStore(
                Store(
                    merchantId = m1,
                    name = "تيك_مارشيه",
                    description = "متجر الإلكترونيات الذكي - نوفر أرقى الأجهزة الحديثة والهواتف بأقوى الأسعار في الجزائر واطول فترة ضمان.",
                    phone = "+213 555-12-34-56",
                    whatsapp = "+213 555-12-34-56",
                    wilaya = "الجزائر",
                    commune = "المرسى",
                    category = "إلكترونيات",
                    status = "APPROVED",
                    rating = 4.9f
                )
            ).toInt()

            val s2 = dao.insertStore(
                Store(
                    merchantId = m2,
                    name = "أخضر بازار",
                    description = "خضروات وفواكه طازجة مباشرة من المزارع المحلية إلى بيتك. جودة عالية وتوصيل سريع ومغلف بعناية.",
                    phone = "+213 666-45-78-90",
                    whatsapp = "+213 666-45-78-90",
                    wilaya = "وهران",
                    commune = "الحراش",
                    category = "خضروات وفواكه",
                    status = "APPROVED",
                    rating = 4.7f
                )
            ).toInt()

            val s3 = dao.insertStore(
                Store(
                    merchantId = m3,
                    name = "متجر الموضة العصرية",
                    description = "ملابس وحقائب واكسسوارات راقية تناسب كافة الأذواق وبأفضل خامات مستوردة ومحلية.",
                    phone = "+213 777-99-88-77",
                    whatsapp = "+213 777-99-88-77",
                    wilaya = "قسنطينة",
                    commune = "الخروب",
                    category = "ملابس وموضة",
                    status = "PENDING",
                    rating = 4.2f
                )
            ).toInt()

            // Seed Products from screenshots
            dao.insertProduct(
                Product(
                    storeId = s1,
                    name = "هاتف ذكي",
                    description = "أفضل العروض الأجهزة الحديثة مع كاميرا فائقة الدقة 108 ميجابيكسل وبطارية 6000 مللي أمبير تدوم يومين.",
                    price = 47000.0,
                    category = "إلكترونيات",
                    stock = 12,
                    imageUrl = ""
                )
            )

            dao.insertProduct(
                Product(
                    storeId = s1,
                    name = "سماعات لاسلكية",
                    description = "صوت نقي وتصميم أنيق يدعم ميزة إلغاء الضوضاء الفائقة وعمر بطارية الاستماع لـ 30 ساعة متواصلة.",
                    price = 8200.0,
                    category = "إلكترونيات",
                    stock = 32,
                    imageUrl = ""
                )
            )

            dao.insertProduct(
                Product(
                    storeId = s2,
                    name = "سلة خضار لرمضان",
                    description = "توصيل سريع وخضار طازجة تشمل الطماطم والبطاطس والبصل والليمون والتوابل الأساسية المحضرة محلياً.",
                    price = 2500.0,
                    category = "خضروات وفواكه",
                    stock = 20,
                    imageUrl = ""
                )
            )

            dao.insertProduct(
                Product(
                    storeId = s2,
                    name = "سلة فواكه طبيعية",
                    description = "تشكيلة من الفواكه الموسمية الطازجة والمغسولة والمعقمة من مزارع متيجة.",
                    price = 3600.0,
                    category = "خضروات وفواكه",
                    stock = 15,
                    imageUrl = ""
                )
            )

            // Seed Subscriptions for Merchants
            dao.insertSubscription(
                MerchantSubscription(
                    merchantId = m1,
                    planName = "SMART_ENTERPRISE",
                    status = "ACTIVE",
                    price = 4500.0
                )
            )

            dao.insertSubscription(
                MerchantSubscription(
                    merchantId = m2,
                    planName = "STARTER_COMPACT",
                    status = "ACTIVE",
                    price = 2000.0
                )
            )

            // Build starter audit log
            dao.insertAuditLog(
                AuditLog(
                    actorName = "نظام ZaLo",
                    action = "INITIALIZE",
                    details = "تم ترقية منصة ZaLo بنجاح وتهيئة بيانات المحلات والولايات والعملاء."
                )
            )
        }
    }
}
