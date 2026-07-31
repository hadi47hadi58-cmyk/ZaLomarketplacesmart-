package com.zalo.marketplace

import com.zalo.marketplace.data.*
import org.junit.Assert.*
import org.junit.Test

class MarketplaceModelsUnitTest {

    @Test
    fun testUserCreationDefaultsAndRoles() {
        val customer = User(
            id = 1,
            email = "customer@zalo.dz",
            name = "أمينة بن علي",
            role = "CUSTOMER",
            wilaya = "الجزائر",
            commune = "المرسى"
        )

        assertEquals("CUSTOMER", customer.role)
        assertEquals("ACTIVE", customer.status)
        assertEquals(1250, customer.loyaltyPoints)
        assertEquals("الجزائر", customer.wilaya)
    }

    @Test
    fun testMerchantStoreProperties() {
        val store = Store(
            id = 10,
            merchantId = 1,
            name = "تيك مارشيه الجزائر",
            description = "محل إلكترونيات وهواتف ذكية معتمدة",
            phone = "0550123456",
            whatsapp = "0550123456",
            wilaya = "وهران",
            commune = "عين الترك",
            category = "إلكترونيات",
            status = "APPROVED"
        )

        assertEquals("APPROVED", store.status)
        assertEquals("08:00 - 22:00", store.workingHours)
        assertEquals(4.5f, store.rating, 0.01f)
    }

    @Test
    fun testProductPricingAndStock() {
        val product = Product(
            id = 101,
            storeId = 10,
            name = "سماعات لاسلكية عالية الدقة",
            description = "سماعة بلوتوث بطارية تدوم 24 ساعة",
            price = 8500.0,
            category = "إلكترونيات",
            stock = 15,
            salesCount = 42,
            rating = 4.8f
        )

        assertEquals(8500.0, product.price, 0.001)
        assertEquals(15, product.stock)
        assertEquals(42, product.salesCount)
    }

    @Test
    fun testOrderCalculationAndItems() {
        val item1 = OrderItem(id = 1, orderId = 500, productId = 101, productName = "سماعة", price = 8500.0, quantity = 2)
        val item2 = OrderItem(id = 2, orderId = 500, productId = 102, productName = "شاحن سريع", price = 2500.0, quantity = 1)

        val items = listOf(item1, item2)
        val itemsTotal = items.sumOf { it.price * it.quantity }
        val deliveryFee = 400.0

        val order = Order(
            id = 500,
            customerId = 1,
            storeId = 10,
            storeName = "تيك مارشيه الجزائر",
            status = "PENDING",
            totalAmount = itemsTotal + deliveryFee,
            paymentMethod = "COD",
            deliveryFee = deliveryFee,
            address = "حي النصر رقم 12"
        )

        assertEquals(19500.0, order.totalAmount, 0.001)
        assertEquals("COD", order.paymentMethod)
        assertEquals("PENDING", order.paymentStatus)
    }

    @Test
    fun testMerchantSubscriptionValidity() {
        val now = System.currentTimeMillis()
        val thirtyDaysLater = now + (30 * 24 * 60 * 60 * 1000L)

        val sub = MerchantSubscription(
            id = 1,
            merchantId = 5,
            planName = "SMART_ENTERPRISE",
            status = "ACTIVE",
            price = 4500.0,
            startDate = now,
            endDate = thirtyDaysLater
        )

        assertEquals("ACTIVE", sub.status)
        assertEquals(4500.0, sub.price, 0.001)
        assertTrue(sub.endDate > sub.startDate)
    }

    @Test
    fun testComplaintAndAuditLog() {
        val complaint = Complaint(
            id = 1,
            orderId = 500,
            userId = 1,
            userName = "أمينة",
            message = "تأخر المندوب عن الوقت المحدد",
            status = "PENDING"
        )

        val log = AuditLog(
            actorName = "ADMIN",
            action = "RESOLVE_COMPLAINT",
            details = "تم التواصل مع المشتري وتعويضه بخصم 10%"
        )

        assertEquals("PENDING", complaint.status)
        assertEquals("RESOLVE_COMPLAINT", log.action)
    }
}
