package com.example.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "users")
data class User(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val email: String,
    val name: String,
    val role: String, // "SUPER_ADMIN", "ADMIN", "SUPPORT", "MERCHANT", "CUSTOMER", "DRIVER"
    val status: String = "ACTIVE",
    val loyaltyPoints: Int = 1250,
    val wilaya: String = "الجزائر",
    val commune: String = "المرسى"
)

@Entity(tableName = "stores")
data class Store(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val merchantId: Int,
    val name: String,
    val description: String,
    val phone: String,
    val whatsapp: String,
    val wilaya: String,
    val commune: String,
    val category: String,
    val status: String, // "PENDING", "APPROVED", "REJECTED", "SUSPENDED"
    val workingHours: String = "08:00 - 22:00",
    val rating: Float = 4.5f
)

@Entity(tableName = "products")
data class Product(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val storeId: Int,
    val name: String,
    val description: String,
    val price: Double,
    val category: String,
    val stock: Int = 10,
    val salesCount: Int = 0,
    val rating: Float = 4.0f,
    val imageUrl: String = ""
)

@Entity(tableName = "orders")
data class Order(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val customerId: Int,
    val storeId: Int,
    val storeName: String,
    val status: String, // "PENDING", "CONFIRMED", "PREPARING", "SHIPPING", "DELIVERED", "COMPLETED", "CANCELLED"
    val totalAmount: Double,
    val paymentMethod: String, // "COD", "BARIDIMOB", "CCP"
    val paymentStatus: String = "PENDING",
    val deliveryFee: Double = 400.0,
    val address: String,
    val timestamp: Long = System.currentTimeMillis()
)

@Entity(tableName = "order_items")
data class OrderItem(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val orderId: Int,
    val productId: Int,
    val productName: String,
    val price: Double,
    val quantity: Int
)

@Entity(tableName = "complaints")
data class Complaint(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val orderId: Int,
    val userId: Int,
    val userName: String,
    val message: String,
    val status: String = "PENDING", // "PENDING", "RESOLVED"
    val timestamp: Long = System.currentTimeMillis()
)

@Entity(tableName = "reviews")
data class Review(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val productId: Int,
    val userId: Int,
    val userName: String,
    val rating: Int,
    val comment: String,
    val timestamp: Long = System.currentTimeMillis()
)

@Entity(tableName = "notifications")
data class Notification(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val userId: Int,
    val title: String,
    val message: String,
    val isRead: Boolean = false,
    val timestamp: Long = System.currentTimeMillis()
)

@Entity(tableName = "merchant_subscriptions")
data class MerchantSubscription(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val merchantId: Int,
    val planName: String, // "FREE", "STARTER_COMPACT", "SMART_ENTERPRISE", "UNLIMITED_PLATINUM"
    val status: String, // "ACTIVE", "EXPIRED", "PENDING_VERIFICATION"
    val price: Double,
    val paymentReceiptUrl: String = "",
    val startDate: Long = System.currentTimeMillis(),
    val endDate: Long = System.currentTimeMillis() + (30 * 24 * 60 * 60 * 1000L) // 30 days
)

@Entity(tableName = "audit_logs")
data class AuditLog(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val actorName: String,
    val action: String,
    val details: String,
    val timestamp: Long = System.currentTimeMillis()
)
