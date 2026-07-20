package com.zalo.marketplace.viewmodel

import android.app.Application
import android.util.Log
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.zalo.marketplace.BuildConfig
import com.zalo.marketplace.data.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.util.concurrent.TimeUnit

class EcomViewModel(application: Application) : AndroidViewModel(application) {

    private val database = AppDatabase.getDatabase(application)
    private val repository = EcomRepository(database.ecomDao())

    // --- State Observables ---
    val allUsers = repository.allUsers.stateIn(viewModelScope, SharingStarted.Eagerly, emptyList())
    val allStores = repository.allStores.stateIn(viewModelScope, SharingStarted.Eagerly, emptyList())
    val allProducts = repository.allProducts.stateIn(viewModelScope, SharingStarted.Eagerly, emptyList())
    val allOrders = repository.allOrders.stateIn(viewModelScope, SharingStarted.Eagerly, emptyList())
    val allComplaints = repository.allComplaints.stateIn(viewModelScope, SharingStarted.Eagerly, emptyList())
    val allAuditLogs = repository.allAuditLogs.stateIn(viewModelScope, SharingStarted.Eagerly, emptyList())

    // --- Active Session ---
    private val _currentUser = MutableStateFlow<User?>(null)
    val currentUser: StateFlow<User?> = _currentUser.asStateFlow()

    // --- Shopping Cart ---
    // Maps Product ID -> Pair(Product, Quantity)
    private val _cart = MutableStateFlow<Map<Int, Pair<Product, Int>>>(emptyMap())
    val cart: StateFlow<Map<Int, Pair<Product, Int>>> = _cart.asStateFlow()

    val cartTotal: StateFlow<Double> = _cart.map { cartMap ->
        cartMap.values.sumOf { it.first.price * it.second }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0.0)

    val cartCount: StateFlow<Int> = _cart.map { cartMap ->
        cartMap.values.sumOf { it.second }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0)

    // --- Gemini AI States ---
    private val _aiRecommendation = MutableStateFlow<String>("")
    val aiRecommendation: StateFlow<String> = _aiRecommendation.asStateFlow()

    private val _isGeneratingRecommendations = MutableStateFlow(false)
    val isGeneratingRecommendations: StateFlow<Boolean> = _isGeneratingRecommendations.asStateFlow()

    private val _aiChatHistory = MutableStateFlow<List<Pair<String, String>>>(
        listOf("assistant" to "مرحباً بك في مساعد ZaLo الذكي! 🤖\nكيف يمكنني مساعدتك في إدارة متجرك، تسعير المنتجات، أو تقديم تحليلات المبيعات الجزائرية اليوم؟")
    )
    val aiChatHistory: StateFlow<List<Pair<String, String>>> = _aiChatHistory.asStateFlow()

    private val _isChatLoading = MutableStateFlow(false)
    val isChatLoading: StateFlow<Boolean> = _isChatLoading.asStateFlow()

    // Location Filter for Customer Map/List
    val selectedWilaya = MutableStateFlow("الجزائر")
    val selectedCommune = MutableStateFlow("المرسى")

    // Active Notifications
    val activeNotifications: StateFlow<List<Notification>> = currentUser.flatMapLatest { user ->
        if (user != null) repository.getNotificationsByUser(user.id) else flowOf(emptyList())
    }.stateIn(viewModelScope, SharingStarted.Eagerly, emptyList())

    // Active Merchant's Store & Subscription
    val activeMerchantStore: StateFlow<Store?> = currentUser.flatMapLatest { user ->
        if (user != null && user.role == "MERCHANT") repository.getStoreByMerchantId(user.id) else flowOf(null)
    }.stateIn(viewModelScope, SharingStarted.Eagerly, null)

    val activeMerchantSub: StateFlow<MerchantSubscription?> = currentUser.flatMapLatest { user ->
        if (user != null && user.role == "MERCHANT") repository.getSubscriptionByMerchant(user.id) else flowOf(null)
    }.stateIn(viewModelScope, SharingStarted.Eagerly, null)

    private val httpClient = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .build()

    init {
        viewModelScope.launch {
            repository.seedInitialData()
        }
    }

    // --- Auth Actions ---
    fun login(email: String) {
        viewModelScope.launch {
            val user = repository.getUserByEmail(email)
            if (user != null) {
                _currentUser.value = user
                repository.insertAuditLog(
                    AuditLog(actorName = user.name, action = "LOGIN", details = "User logged in successfully with role ${user.role}")
                )
                // Trigger fresh recommendations for customers
                if (user.role == "CUSTOMER") {
                    generateAiRecommendations()
                }
            } else {
                // If it doesn't exist, create customer
                val newUser = User(email = email, name = email.substringBefore("@"), role = "CUSTOMER")
                val id = repository.insertUser(newUser)
                _currentUser.value = newUser.copy(id = id.toInt())
                repository.insertAuditLog(
                    AuditLog(actorName = newUser.name, action = "REGISTER", details = "Registered new customer profile")
                )
                generateAiRecommendations()
            }
        }
    }

    fun logout() {
        _currentUser.value = null
        _cart.value = emptyMap()
    }

    fun switchRole(role: String) {
        val current = _currentUser.value ?: return
        viewModelScope.launch {
            val updated = current.copy(role = role)
            repository.updateUser(updated)
            _currentUser.value = updated
            repository.insertAuditLog(
                AuditLog(actorName = current.name, action = "SWITCH_ROLE", details = "Switched operational role to $role")
            )
            if (role == "CUSTOMER") {
                generateAiRecommendations()
            }
        }
    }

    // --- Cart Actions ---
    fun addToCart(product: Product) {
        val currentCart = _cart.value.toMutableMap()
        if (currentCart.containsKey(product.id)) {
            val existing = currentCart[product.id]!!
            currentCart[product.id] = existing.copy(second = existing.second + 1)
        } else {
            currentCart[product.id] = Pair(product, 1)
        }
        _cart.value = currentCart
    }

    fun updateCartQty(productId: Int, quantity: Int) {
        if (quantity <= 0) {
            removeFromCart(productId)
            return
        }
        val currentCart = _cart.value.toMutableMap()
        if (currentCart.containsKey(productId)) {
            val existing = currentCart[productId]!!
            currentCart[productId] = existing.copy(second = quantity)
        }
        _cart.value = currentCart
    }

    fun removeFromCart(productId: Int) {
        val currentCart = _cart.value.toMutableMap()
        currentCart.remove(productId)
        _cart.value = currentCart
    }

    fun clearCart() {
        _cart.value = emptyMap()
    }

    // --- Order Placement ---
    fun placeOrder(address: String, paymentMethod: String, deliveryFee: Double = 400.0) {
        val current = _currentUser.value ?: return
        val itemsList = _cart.value.values.toList()
        if (itemsList.isEmpty()) return

        // Group items by store to create multi-vendor orders if needed, or place simplified order
        val firstStoreId = itemsList.first().first.storeId
        val firstStore = allStores.value.find { it.id == firstStoreId }
        val storeName = firstStore?.name ?: "متجر الجزائر"

        viewModelScope.launch {
            repository.checkout(
                customerId = current.id,
                storeId = firstStoreId,
                storeName = storeName,
                items = itemsList,
                paymentMethod = paymentMethod,
                deliveryFee = deliveryFee,
                address = address
            )
            clearCart()
        }
    }

    fun clearNotifications() {
        val user = _currentUser.value ?: return
        viewModelScope.launch {
            repository.markAllNotificationsAsRead(user.id)
        }
    }

    // --- Merchant Actions ---
    fun registerStore(name: String, description: String, phone: String, whatsapp: String, wilaya: String, commune: String, category: String) {
        val current = _currentUser.value ?: return
        viewModelScope.launch {
            val newStore = Store(
                merchantId = current.id,
                name = name,
                description = description,
                phone = phone,
                whatsapp = whatsapp,
                wilaya = wilaya,
                commune = commune,
                category = category,
                status = "PENDING"
            )
            repository.insertStore(newStore)
            repository.insertAuditLog(
                AuditLog(actorName = current.name, action = "REGISTER_STORE", details = "Applied for store registration '$name'")
            )
        }
    }

    fun updateStoreStatusAdmin(storeId: Int, newStatus: String) {
        val admin = _currentUser.value ?: return
        viewModelScope.launch {
            val storeFlow = repository.getStoreById(storeId)
            val store = storeFlow.firstOrNull() ?: return@launch
            val updated = store.copy(status = newStatus)
            repository.updateStore(updated)
            repository.insertAuditLog(
                AuditLog(actorName = admin.name, action = "MODERATION", details = "Set store #$storeId status to $newStatus")
            )
            repository.insertNotification(
                Notification(
                    userId = store.merchantId,
                    title = "حالة طلب المتجر",
                    message = "تم تحديث حالة متجرك (${store.name}) إلى '${newStatus}' من قبل إدارة النظام."
                )
            )
        }
    }

    fun paySubscription(planName: String, price: Double, receiptUrl: String = "CCP-BaridiMob-Receipt-10394.png") {
        val current = _currentUser.value ?: return
        viewModelScope.launch {
            val sub = MerchantSubscription(
                merchantId = current.id,
                planName = planName,
                status = "PENDING_VERIFICATION",
                price = price,
                paymentReceiptUrl = receiptUrl
            )
            repository.insertSubscription(sub)
            repository.insertAuditLog(
                AuditLog(actorName = current.name, action = "PAY_SUBSCRIPTION", details = "Submitted receipt for $planName (${price} DZD)")
            )
        }
    }

    fun approveSubscriptionAdmin(subId: Int, merchantId: Int) {
        val admin = _currentUser.value ?: return
        viewModelScope.launch {
            val sub = MerchantSubscription(
                id = subId,
                merchantId = merchantId,
                planName = "SMART_ENTERPRISE",
                status = "ACTIVE",
                price = 4500.0
            )
            repository.insertSubscription(sub)
            repository.insertAuditLog(
                AuditLog(actorName = admin.name, action = "APPROVE_SUBSCRIPTION", details = "Approved subscription for merchant #$merchantId")
            )
            repository.insertNotification(
                Notification(
                    userId = merchantId,
                    title = "تفعيل الاشتراك",
                    message = "تم المراجعة وتفعيل اشتراكك الذكي (Smart Enterprise). يمكنك الآن إضافة المنتجات اللامحدودة مفعمة بالذكاء الاصطناعي!"
                )
            )
        }
    }

    fun addProduct(name: String, description: String, price: Double, category: String, stock: Int) {
        val currentStore = activeMerchantStore.value ?: return
        viewModelScope.launch {
            val prod = Product(
                storeId = currentStore.id,
                name = name,
                description = description,
                price = price,
                category = category,
                stock = stock
            )
            repository.insertProduct(prod)
            repository.insertAuditLog(
                AuditLog(actorName = "Merchant Store ${currentStore.name}", action = "ADD_PRODUCT", details = "Added product: $name, price: $price DZD")
            )
        }
    }

    fun deleteProduct(prod: Product) {
        viewModelScope.launch {
            repository.deleteProduct(prod)
        }
    }

    // --- Order Tracking Actions ---
    fun updateOrderStatus(orderId: Int, newStatus: String) {
        val actor = _currentUser.value ?: return
        viewModelScope.launch {
            repository.updateOrderStatus(orderId, newStatus, actor.name)
        }
    }

    // --- Reviews & Complaints ---
    fun addReview(productId: Int, rating: Int, comment: String) {
        val current = _currentUser.value ?: return
        viewModelScope.launch {
            val rev = Review(
                productId = productId,
                userId = current.id,
                userName = current.name,
                rating = rating,
                comment = comment
            )
            repository.insertReview(rev)
        }
    }

    fun addComplaint(orderId: Int, message: String) {
        val current = _currentUser.value ?: return
        viewModelScope.launch {
            val comp = Complaint(
                orderId = orderId,
                userId = current.id,
                userName = current.name,
                message = message
            )
            repository.insertComplaint(comp)
            repository.insertNotification(
                Notification(
                    userId = current.id,
                    title = "تم رفع الشكوى",
                    message = "شكواك لطلب رقم #$orderId وصلت لقسم الدعم الفني الجزائري وسنتواصل معك خلال 24 ساعة."
                )
            )
            repository.insertAuditLog(
                AuditLog(actorName = current.name, action = "SUBMIT_COMPLAINT", details = "Raised dispute for Order #$orderId")
            )
        }
    }

    fun resolveComplaintAdmin(complaintId: Int, message: String) {
        val admin = _currentUser.value ?: return
        viewModelScope.launch {
            val allComp = repository.allComplaints.firstOrNull() ?: return@launch
            val comp = allComp.find { it.id == complaintId } ?: return@launch
            val updated = comp.copy(status = "RESOLVED")
            repository.updateComplaint(updated)
            repository.insertAuditLog(
                AuditLog(actorName = admin.name, action = "RESOLVE_COMPLAINT", details = "Resolved complaint #$complaintId")
            )
            repository.insertNotification(
                Notification(
                    userId = comp.userId,
                    title = "حل النزاع",
                    message = "تمت معالجة شكواك بنجاح من قبل مشرفي المنصة: $message"
                )
            )
        }
    }

    fun suspendUserAdmin(userId: Int) {
        val admin = _currentUser.value ?: return
        viewModelScope.launch {
            val user = allUsers.value.find { it.id == userId } ?: return@launch
            val updated = user.copy(status = "SUSPENDED")
            repository.updateUser(updated)
            repository.insertAuditLog(
                AuditLog(actorName = admin.name, action = "SUSPEND_USER", details = "Suspended user ${user.name} (#$userId)")
            )
        }
    }

    // --- Server-Side Gemini AI Engine Client ---
    fun generateAiRecommendations() {
        val user = _currentUser.value ?: return
        val prods = allProducts.value
        if (prods.isEmpty()) return

        _isGeneratingRecommendations.value = true
        viewModelScope.launch(Dispatchers.IO) {
            val apiKey = BuildConfig.GEMINI_API_KEY
            if (apiKey.isEmpty() || apiKey == "MY_GEMINI_API_KEY_DEFAULT_VALUE") {
                // Fallback simulation in case API key is missing or not provided in AI Studio
                val suggestions = listOf(
                    "بناءً على موقعك في *${user.wilaya}*، نقترح عليك زيارة متجر *تيك_مارشيه* لشراء *سماعات لاسلكية* ذات جودة صوت نقية (DZD 8,200).",
                    "عرض خاص لأصحاب الولاية *${user.wilaya}*: *سلة خضار طازجة* (DZD 2,500) من متجر *أخضر بازار* مع توصيل فوري بـ DZD 400 فقط."
                )
                withContext(Dispatchers.Main) {
                    _aiRecommendation.value = suggestions.random()
                    _isGeneratingRecommendations.value = false
                }
                return@launch
            }

            // Create context prompt for Gemini
            val prodOverview = prods.joinToString { "- ${it.name} (${it.price} DZD)" }
            val prompt = """
                You are the AI personalization engine for "ZaLo Multi-vendor Marketplace Smart" in Algeria.
                Given the user: Name ${user.name}, Wilaya ${user.wilaya}, Commune ${user.commune}.
                Available system catalog:
                $prodOverview
                
                Write a brief, beautifully crafted and highly contextual shopping recommendation or promotion in Arabic (RTL support).
                Reference specifically their Algerian Wilaya ${user.wilaya} and recommend one or two suitable items from the catalog. Keep the response to 2 key bullet points in highly elegant modern copywriting.
            """.trimIndent()

            try {
                val apiResponse = callGeminiRestApi(apiKey, prompt)
                withContext(Dispatchers.Main) {
                    _aiRecommendation.value = apiResponse
                    _isGeneratingRecommendations.value = false
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    _aiRecommendation.value = "فشل تحميل توصيات AI المخصصة."
                    _isGeneratingRecommendations.value = false
                }
            }
        }
    }

    fun sendMessageToAiAssistant(userMsg: String) {
        val currentHistory = _aiChatHistory.value.toMutableList()
        currentHistory.add("user" to userMsg)
        _aiChatHistory.value = currentHistory
        _isChatLoading.value = true

        val mSub = activeMerchantSub.value
        val mStore = activeMerchantStore.value
        val prods = allProducts.value.filter { it.storeId == (mStore?.id ?: 0) }

        viewModelScope.launch(Dispatchers.IO) {
            val apiKey = BuildConfig.GEMINI_API_KEY
            if (apiKey.isEmpty() || apiKey == "MY_GEMINI_API_KEY_DEFAULT_VALUE") {
                withContext(Dispatchers.Main) {
                    val storeName = mStore?.name ?: "جديد"
                    val fallbackResponse = when {
                        userMsg.contains("سعر") || userMsg.contains("مبيعات") -> 
                            "نظام تحليلات ZaLo يتنبأ بارتفاع المبيعات بنسبة 18% في ولايتك الأسبوع القادم! ننصحك بتقديم كود تخفيض مخصص."
                        userMsg.contains("منتج") || userMsg.contains("وصف") -> 
                            "إليك فكرة وصف ذكي: 'اكتشف الأداء الاحترافي والتصميم المتين المصنع ليدوم طويلاً بأسعار مثالية للمستهلك الجزائري.'"
                        else -> "أنا هنا لمساعدتك بحسابك الذكي! للأسف لم يتم العثور على مفتاح API، لكن حساب متجرك ($storeName) مبرمج بأفضل أدوات التقرير المالي والحلول السريعة."
                    }
                    _aiChatHistory.value = _aiChatHistory.value + ("assistant" to fallbackResponse)
                    _isChatLoading.value = false
                }
                return@launch
            }

            // Create context for merchant
            val merchantContext = """
                You are "ZaLo Smart Assistant" helping a merchant inside ZaLo Marketplace Smart ecosystems in Algeria.
                Store Name: ${mStore?.name ?: "غير مسجل بعد"}
                Subscription Plan: ${mSub?.planName ?: "مجاني"}
                Merchant Products: ${prods.joinToString { "${it.name} (${it.price} DZD)" }}
                
                Please reply professionally in solid Arabic, offering fintech, marketing, pricing advice, product writeups, or business insights tailored for Algerian markets (CCP payments, BaridiMob, local delivery optimization). Keep responses snappy, useful and friendly.
            """.trimIndent()

            try {
                val fullConversation = _aiChatHistory.value.joinToString("\n") { "${it.first}: ${it.second}" }
                val prompt = "$merchantContext\n\nConversation history:\n$fullConversation\nassistant:"

                val apiResponse = callGeminiRestApi(apiKey, prompt)
                withContext(Dispatchers.Main) {
                    _aiChatHistory.value = _aiChatHistory.value + ("assistant" to apiResponse)
                    _isChatLoading.value = false
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    _aiChatHistory.value = _aiChatHistory.value + ("assistant" to "عذراً، حدث عطل أثناء الاتصال بمحرك الذكاء الاصطناعي.")
                    _isChatLoading.value = false
                }
            }
        }
    }

    private suspend fun callGeminiRestApi(apiKey: String, prompt: String): String = withContext(Dispatchers.IO) {
        val url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=$apiKey"
        val requestJson = JSONObject().apply {
            put("contents", org.json.JSONArray().apply {
                put(JSONObject().apply {
                    put("parts", org.json.JSONArray().apply {
                        put(JSONObject().apply {
                            put("text", prompt)
                        })
                    })
                })
            })
        }

        val mediaType = "application/json; charset=utf-8".toMediaType()
        val requestBody = requestJson.toString().toRequestBody(mediaType)
        val request = Request.Builder()
            .url(url)
            .post(requestBody)
            .build()

        httpClient.newCall(request).execute().use { response ->
            if (!response.isSuccessful) {
                Log.e("GeminiAPI", "Failed call: ${response.code} ${response.message}")
                throw Exception("Response unsuccessful: ${response.code}")
            }
            val body = response.body?.string() ?: throw Exception("Empty body")
            val jsonObject = JSONObject(body)
            val candidates = jsonObject.getJSONArray("candidates")
            val firstCandidate = candidates.getJSONObject(0)
            val content = firstCandidate.getJSONObject("content")
            val parts = content.getJSONArray("parts")
            parts.getJSONObject(0).getString("text")
        }
    }
}
