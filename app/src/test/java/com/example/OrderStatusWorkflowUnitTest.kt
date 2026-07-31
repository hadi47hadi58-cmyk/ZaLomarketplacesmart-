package com.zalo.marketplace

import com.zalo.marketplace.data.Order
import org.junit.Assert.*
import org.junit.Test

class OrderStatusWorkflowUnitTest {

    enum class OrderState {
        PENDING,
        CONFIRMED,
        PREPARING,
        SHIPPING,
        DELIVERED,
        COMPLETED,
        CANCELLED;

        fun canTransitionTo(nextState: OrderState): Boolean {
            return when (this) {
                PENDING -> nextState in listOf(CONFIRMED, CANCELLED)
                CONFIRMED -> nextState in listOf(PREPARING, CANCELLED)
                PREPARING -> nextState in listOf(SHIPPING, CANCELLED)
                SHIPPING -> nextState in listOf(DELIVERED, CANCELLED)
                DELIVERED -> nextState in listOf(COMPLETED)
                COMPLETED -> false
                CANCELLED -> false
            }
        }
    }

    @Test
    fun testOrderStateValidTransitions() {
        assertTrue(OrderState.PENDING.canTransitionTo(OrderState.CONFIRMED))
        assertTrue(OrderState.CONFIRMED.canTransitionTo(OrderState.PREPARING))
        assertTrue(OrderState.PREPARING.canTransitionTo(OrderState.SHIPPING))
        assertTrue(OrderState.SHIPPING.canTransitionTo(OrderState.DELIVERED))
        assertTrue(OrderState.DELIVERED.canTransitionTo(OrderState.COMPLETED))
    }

    @Test
    fun testOrderStateInvalidTransitions() {
        assertFalse(OrderState.COMPLETED.canTransitionTo(OrderState.SHIPPING))
        assertFalse(OrderState.CANCELLED.canTransitionTo(OrderState.CONFIRMED))
        assertFalse(OrderState.PENDING.canTransitionTo(OrderState.DELIVERED))
    }

    @Test
    fun testPaymentStatusResolution() {
        var order = Order(
            id = 101,
            customerId = 1,
            storeId = 5,
            storeName = "متجر الهواتف",
            status = "PENDING",
            totalAmount = 15000.0,
            paymentMethod = "BARIDIMOB",
            paymentStatus = "PENDING",
            address = "حي البدر 15"
        )

        assertEquals("PENDING", order.paymentStatus)

        // Admin verifies BaridiMob receipt
        order = order.copy(paymentStatus = "PAID", status = "CONFIRMED")
        assertEquals("PAID", order.paymentStatus)
        assertEquals("CONFIRMED", order.status)
    }
}
