package com.zalo.marketplace

import com.zalo.marketplace.data.Product
import org.junit.Assert.*
import org.junit.Test

class CartBusinessLogicUnitTest {

    data class CartItem(
        val product: Product,
        var quantity: Int
    )

    class CartManager {
        private val items = mutableMapOf<Int, CartItem>()

        fun addProduct(product: Product, quantity: Int = 1) {
            val existing = items[product.id]
            if (existing != null) {
                existing.quantity += quantity
            } else {
                items[product.id] = CartItem(product, quantity)
            }
        }

        fun removeProduct(productId: Int) {
            items.remove(productId)
        }

        fun updateQuantity(productId: Int, quantity: Int) {
            if (quantity <= 0) {
                removeProduct(productId)
            } else {
                items[productId]?.quantity = quantity
            }
        }

        fun getSubtotal(): Double {
            return items.values.sumOf { it.product.price * it.quantity }
        }

        fun calculateDeliveryFee(wilaya: String): Double {
            return when (wilaya) {
                "الجزائر", "البليدة", "تيبازة", "بومرداس" -> 400.0
                "وهران", "قسنطينة", "عنابة", "سطيف" -> 600.0
                "أدرار", "تمنراست", "إليزي", "تندوف" -> 1000.0
                else -> 500.0
            }
        }

        fun applyDiscountCoupon(couponCode: String, subtotal: Double): Double {
            return when (couponCode.uppercase()) {
                "ZALO10" -> subtotal * 0.10
                "RAMADAN20" -> subtotal * 0.20
                "FREESHIP" -> 0.0
                else -> 0.0
            }
        }

        fun getTotal(wilaya: String, couponCode: String = ""): Double {
            val subtotal = getSubtotal()
            val discount = applyDiscountCoupon(couponCode, subtotal)
            val delivery = if (couponCode.uppercase() == "FREESHIP") 0.0 else calculateDeliveryFee(wilaya)
            return (subtotal - discount) + delivery
        }

        fun getItemCount(): Int {
            return items.values.sumOf { it.quantity }
        }

        fun clear() {
            items.clear()
        }
    }

    @Test
    fun testCartItemAdditionAndQuantityUpdate() {
        val cart = CartManager()
        val p1 = Product(id = 1, storeId = 10, name = "هاتف ذكي", description = "", price = 45000.0, category = "هواتف")
        val p2 = Product(id = 2, storeId = 10, name = "حافظة حماية", description = "", price = 1500.0, category = "إكسسوارات")

        cart.addProduct(p1, 1)
        cart.addProduct(p2, 2)

        assertEquals(3, cart.getItemCount())
        assertEquals(48000.0, cart.getSubtotal(), 0.001)

        cart.updateQuantity(2, 3)
        assertEquals(4, cart.getItemCount())
        assertEquals(49500.0, cart.getSubtotal(), 0.001)
    }

    @Test
    fun testDeliveryFeeByWilayaRegion() {
        val cart = CartManager()
        assertEquals(400.0, cart.calculateDeliveryFee("الجزائر"), 0.001)
        assertEquals(600.0, cart.calculateDeliveryFee("وهران"), 0.001)
        assertEquals(1000.0, cart.calculateDeliveryFee("تمنراست"), 0.001)
        assertEquals(500.0, cart.calculateDeliveryFee("باتنة"), 0.001)
    }

    @Test
    fun testDiscountCouponsAndFinalTotal() {
        val cart = CartManager()
        val p1 = Product(id = 1, storeId = 10, name = "حذاء رياضي", description = "", price = 10000.0, category = "ملابس")
        cart.addProduct(p1, 1)

        val totalNormal = cart.getTotal("الجزائر")
        assertEquals(10400.0, totalNormal, 0.001)

        val totalWithZalo10 = cart.getTotal("الجزائر", "ZALO10")
        assertEquals(9400.0, totalWithZalo10, 0.001)

        val totalFreeShip = cart.getTotal("الجزائر", "FREESHIP")
        assertEquals(10000.0, totalFreeShip, 0.001)
    }
}
