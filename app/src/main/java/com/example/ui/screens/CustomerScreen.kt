package com.example.ui.screens

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.Order
import com.example.data.Product
import com.example.data.Store
import com.example.ui.theme.*
import com.example.viewmodel.EcomViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CustomerScreen(
    viewModel: EcomViewModel,
    onNavigateToAiAssistant: () -> Unit
) {
    val currentUser by viewModel.currentUser.collectAsState()
    val allStores by viewModel.allStores.collectAsState()
    val allProducts by viewModel.allProducts.collectAsState()
    val allOrders by viewModel.allOrders.collectAsState()

    val aiRecommendation by viewModel.aiRecommendation.collectAsState()
    val isGeneratingRecs by viewModel.isGeneratingRecommendations.collectAsState()

    val wrFilter by viewModel.selectedWilaya.collectAsState()
    val cmFilter by viewModel.selectedCommune.collectAsState()
    
    val cart by viewModel.cart.collectAsState()
    val cartTotal by viewModel.cartTotal.collectAsState()
    val cartCount by viewModel.cartCount.collectAsState()

    val activeNotifications by viewModel.activeNotifications.collectAsState()

    // Sub-screens Navigation state
    var currentSubTab by remember { mutableStateOf("home") } // "home", "cart", "checkout", "profile"
    
    // Dialog / Sheet states
    var showNotificationSheet by remember { mutableStateOf(false) }
    var selectedProductForDetail by remember { mutableStateOf<Product?>(null) }
    var selectedStoreForDetail by remember { mutableStateOf<Store?>(null) }
    var userAddress by remember { mutableStateOf("المرسى، ولاية الجزائر") }
    var selectedPaymentMethod by remember { mutableStateOf("COD") } // "COD", "BARIDIMOB"
    
    var showComplaintDialog by remember { mutableStateOf<Order?>(null) }
    var complaintText by remember { mutableStateOf("") }

    var showReviewDialog by remember { mutableStateOf<Product?>(null) }
    var reviewRating by remember { mutableStateOf(5) }
    var reviewComment by remember { mutableStateOf("") }

    Scaffold(
        modifier = Modifier
            .fillMaxSize()
            .windowInsetsPadding(WindowInsets.safeDrawing),
        topBar = {
            TopAppBar(
                title = {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column {
                            Text(
                                text = "ZaLo Marketplace Smart",
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Black,
                                color = ZaLoEmerald
                            )
                            Text(
                                text = "سوق الجزائر الذكي متعدد البائعين",
                                fontSize = 11.sp,
                                color = ZaLoTextSecondary
                            )
                        }
                    }
                },
                actions = {
                    // Notification Icon
                    Box(modifier = Modifier.padding(end = 12.dp)) {
                        IconButton(onClick = { showNotificationSheet = true }) {
                            Icon(Icons.Outlined.Notifications, contentDescription = "Alerts", tint = ZaLoNavy)
                        }
                        if (activeNotifications.any { !it.isRead }) {
                            Box(
                                modifier = Modifier
                                    .size(8.dp)
                                    .clip(CircleShape)
                                    .background(ZaLoSuspended)
                                    .align(Alignment.TopEnd)
                                    .offset(x = (-4).dp, y = 4.dp)
                            )
                        }
                    }

                    // Role Switch Button
                    TextButton(
                        onClick = { viewModel.switchRole("MERCHANT") },
                        modifier = Modifier.padding(end = 8.dp)
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Storefront, contentDescription = "Seller Panel", tint = ZaLoEmerald, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("لوحة التاجر", color = ZaLoEmerald, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = ZaLoCardBG)
            )
        },
        bottomBar = {
            // Floating Navigation Bar
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 12.dp)
                    .clip(RoundedCornerShape(24.dp))
                    .border(1.dp, Color.White.copy(alpha = 0.2f), RoundedCornerShape(24.dp)),
                tonalElevation = 8.dp,
                color = ZaLoNavy
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 8.dp, horizontal = 16.dp),
                    horizontalArrangement = Arrangement.SpaceAround,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Home
                    BottomNavItem(
                        icon = Icons.Default.Home,
                        label = "الرئيسية",
                        isActive = currentSubTab == "home",
                        onClick = {
                            selectedStoreForDetail = null
                            currentSubTab = "home"
                        }
                    )
                    
                    // Cart
                    BottomNavItem(
                        icon = Icons.Default.ShoppingCart,
                        label = "السلة",
                        badgeCount = cartCount,
                        isActive = currentSubTab == "cart",
                        onClick = { currentSubTab = "cart" }
                    )
                    
                    // Chatbot / Assistant
                    BottomNavItem(
                        icon = Icons.Default.SmartToy,
                        label = "AI المساعد",
                        isActive = false,
                        onClick = onNavigateToAiAssistant
                    )

                    // Profile / History
                    BottomNavItem(
                        icon = Icons.Default.Person,
                        label = "حسابي",
                        isActive = currentSubTab == "profile",
                        onClick = { currentSubTab = "profile" }
                    )
                }
            }
        }
    ) { innerPadding ->
        
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(ZaLoBackground)
                .padding(innerPadding)
        ) {
            
            when (currentSubTab) {
                "home" -> {
                    LazyColumn(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(horizontal = 16.dp),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        
                        // --- Hero Dynamic Banner ---
                        item {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 8.dp)
                                    .clip(RoundedCornerShape(24.dp))
                                    .background(
                                        Brush.linearGradient(
                                            colors = listOf(ZaLoNavy, ZaLoNavyLight)
                                        )
                                    )
                                    .padding(20.dp)
                            ) {
                                Column(horizontalAlignment = Alignment.Start) {
                                    Text(
                                        text = "منصة التجارة\nالذكية الجزائرية\nمتعددة البائعين",
                                        fontSize = 24.sp,
                                        fontWeight = FontWeight.Black,
                                        color = Color.White,
                                        lineHeight = 32.sp,
                                        modifier = Modifier.fillMaxWidth(),
                                        textAlign = TextAlign.Start
                                    )
                                    
                                    Spacer(modifier = Modifier.height(6.dp))
                                    Text(
                                        text = "تسوق، أدر متجرك، وتتبع الطلبات في نظام واحد ذكي، جاهز للمستثمرين والتوسع السحابي.",
                                        fontSize = 11.sp,
                                        color = Color.White.copy(alpha = 0.7f),
                                        modifier = Modifier.fillMaxWidth(0.9f),
                                        textAlign = TextAlign.Start
                                    )

                                    Spacer(modifier = Modifier.height(16.dp))

                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                                    ) {
                                        // Quick buttons mimicking mock setup
                                        Box(
                                            modifier = Modifier
                                                .clip(RoundedCornerShape(12.dp))
                                                .background(ZaLoEmerald)
                                                .clickable { selectedStoreForDetail = null }
                                                .padding(horizontal = 16.dp, vertical = 8.dp)
                                        ) {
                                            Text("تصفح المتاجر", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                        }

                                        Box(
                                            modifier = Modifier
                                                .clip(RoundedCornerShape(12.dp))
                                                .border(1.dp, Color.White.copy(alpha = 0.3f), RoundedCornerShape(12.dp))
                                                .background(Color.White.copy(alpha = 0.05f))
                                                .clickable { viewModel.switchRole("MERCHANT") }
                                                .padding(horizontal = 16.dp, vertical = 8.dp)
                                        ) {
                                            Text("لوحة التاجر", color = Color.White, fontSize = 11.sp)
                                        }
                                    }
                                }
                            }
                        }

                        // --- UI Screenshot replica highlight elements ---
                        item {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                // AI Insights quickcard
                                Card(
                                    modifier = Modifier.weight(1f),
                                    shape = RoundedCornerShape(16.dp),
                                    colors = CardDefaults.cardColors(containerColor = ZaLoCardBG)
                                ) {
                                    Column(modifier = Modifier.padding(12.dp)) {
                                        Text("AI تحليلات", color = ZaLoEmerald, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                        Spacer(modifier = Modifier.height(4.dp))
                                        Text("توصيات مخصصة وزيادة المبيعات", color = ZaLoTextPrimary, fontSize = 13.sp, fontWeight = FontWeight.Bold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                                        Spacer(modifier = Modifier.height(4.dp))
                                        Text("توصيات ZaLo تعتمد على السلوك والنمو الجغرافي الجزائري.", color = ZaLoTextSecondary, fontSize = 10.sp, maxLines = 2, overflow = TextOverflow.Ellipsis)
                                    }
                                }

                                // Payments details card
                                Card(
                                    modifier = Modifier.weight(1f),
                                    shape = RoundedCornerShape(16.dp),
                                    colors = CardDefaults.cardColors(containerColor = ZaLoCardBG)
                                ) {
                                    Column(modifier = Modifier.padding(12.dp)) {
                                        Text("نظام الدفع", color = ZaLoGold, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                        Spacer(modifier = Modifier.height(4.dp))
                                        Text("BaridiMob و CCP والدفع عند التسليم", color = ZaLoTextPrimary, fontSize = 13.sp, fontWeight = FontWeight.Bold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                                        Spacer(modifier = Modifier.height(4.dp))
                                        Text("مدفوعات محلية متكاملة تضمن راحة وسهولة في التعامل.", color = ZaLoTextSecondary, fontSize = 10.sp, maxLines = 2, overflow = TextOverflow.Ellipsis)
                                    }
                                }
                            }
                        }

                        // --- Generative AI Recommendation Widget ---
                        item {
                            Card(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .border(
                                        width = 1.dp,
                                        brush = Brush.horizontalGradient(colors = listOf(ZaLoEmerald, ZaLoGold)),
                                        shape = RoundedCornerShape(20.dp)
                                    ),
                                shape = RoundedCornerShape(20.dp),
                                colors = CardDefaults.cardColors(
                                    containerColor = ZaLoEmerald.copy(alpha = 0.05f)
                                )
                            ) {
                                Column(
                                    modifier = Modifier.padding(16.dp)
                                ) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Icon(Icons.Default.AutoAwesome, contentDescription = "AI", tint = ZaLoGold, modifier = Modifier.size(18.dp))
                                            Spacer(modifier = Modifier.width(6.dp))
                                            Text(
                                                text = "AI منتجات مقترحة بواسطة",
                                                fontWeight = FontWeight.Bold,
                                                fontSize = 14.sp,
                                                color = ZaLoNavy
                                            )
                                        }

                                        IconButton(
                                            onClick = { viewModel.generateAiRecommendations() },
                                            modifier = Modifier.size(24.dp)
                                        ) {
                                            if (isGeneratingRecs) {
                                                CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp, color = ZaLoEmerald)
                                            } else {
                                                Icon(Icons.Default.Refresh, contentDescription = "Refresh", tint = ZaLoEmerald, modifier = Modifier.size(16.dp))
                                            }
                                        }
                                    }

                                    Spacer(modifier = Modifier.height(10.dp))

                                    Text(
                                        text = if (aiRecommendation.isNotEmpty()) aiRecommendation else "جاري تحميل أفضل الاقتراحات والمقالات الذكية المخصصة لك في ولاية ${currentUser?.wilaya ?: "الجزائر"}...",
                                        fontSize = 12.sp,
                                        color = ZaLoTextPrimary,
                                        lineHeight = 18.sp,
                                        textAlign = TextAlign.Start,
                                        modifier = Modifier.fillMaxWidth()
                                    )
                                    
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(
                                        text = "تعلّم الآلة يربطك مباشرة بجهات البيع ذات الموثوقية.",
                                        fontSize = 10.sp,
                                        color = ZaLoTextSecondary,
                                        textAlign = TextAlign.Start
                                    )
                                }
                            }
                        }

                        // --- Location Picker Area ---
                        item {
                            Column(modifier = Modifier.fillMaxWidth()) {
                                Text(
                                    text = "اختر متجرًا محليًا حسب ولايتك",
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = ZaLoTextPrimary,
                                    modifier = Modifier.fillMaxWidth(),
                                    textAlign = TextAlign.Start
                                )
                                Spacer(modifier = Modifier.height(8.dp))

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    // Wilaya filter chips
                                    listOf("الجزائر", "وهران", "قسنطينة").forEach { wil ->
                                        Box(
                                            modifier = Modifier
                                                .clip(RoundedCornerShape(12.dp))
                                                .background(if (wrFilter == wil) ZaLoEmerald else ZaLoCardBG)
                                                .border(1.dp, if (wrFilter == wil) ZaLoEmerald else ZaLoTextSecondary.copy(alpha = 0.2f), RoundedCornerShape(12.dp))
                                                .clickable { viewModel.selectedWilaya.value = wil }
                                                .padding(horizontal = 14.dp, vertical = 8.dp)
                                        ) {
                                            Text(wil, color = if (wrFilter == wil) Color.White else ZaLoTextSecondary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                        }
                                    }
                                }
                            }
                        }

                        // --- Stores grid selection ---
                        item {
                            val filteredStores = allStores.filter { it.wilaya == wrFilter && it.status == "APPROVED" }
                            if (filteredStores.isEmpty()) {
                                Card(
                                    modifier = Modifier.fillMaxWidth(),
                                    colors = CardDefaults.cardColors(containerColor = ZaLoCardBG)
                                ) {
                                    Box(modifier = Modifier.padding(24.dp).fillMaxWidth(), contentAlignment = Alignment.Center) {
                                        Text("لا توجد متاجر معتمدة حالياً في هذه الولاية.", fontSize = 12.sp, color = ZaLoTextSecondary)
                                    }
                                }
                            } else {
                                LazyRow(
                                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    items(filteredStores) { store ->
                                        Card(
                                            modifier = Modifier
                                                .width(260.dp)
                                                .clickable { selectedStoreForDetail = store },
                                            colors = CardDefaults.cardColors(containerColor = ZaLoCardBG),
                                            shape = RoundedCornerShape(16.dp)
                                        ) {
                                            Column(modifier = Modifier.padding(16.dp)) {
                                                Row(
                                                    modifier = Modifier.fillMaxWidth(),
                                                    horizontalArrangement = Arrangement.SpaceBetween,
                                                    verticalAlignment = Alignment.CenterVertically
                                                ) {
                                                    // Approved badge
                                                    Box(
                                                        modifier = Modifier
                                                            .clip(RoundedCornerShape(8.dp))
                                                            .background(ZaLoEmeraldLight)
                                                            .padding(horizontal = 8.dp, vertical = 2.dp)
                                                    ) {
                                                        Text("approved", color = ZaLoEmeraldDark, fontSize = 9.sp, fontWeight = FontWeight.Bold)
                                                    }

                                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                                        Icon(Icons.Default.Star, contentDescription = "rating", tint = ZaLoGold, modifier = Modifier.size(14.dp))
                                                        Spacer(modifier = Modifier.width(2.dp))
                                                        Text("${store.rating}", color = ZaLoTextPrimary, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                                    }
                                                }

                                                Spacer(modifier = Modifier.height(10.dp))

                                                Text(store.name, fontSize = 15.sp, fontWeight = FontWeight.Bold, color = ZaLoTextPrimary)
                                                Text(store.description, fontSize = 11.sp, color = ZaLoTextSecondary, maxLines = 2, overflow = TextOverflow.Ellipsis, modifier = Modifier.padding(top = 4.dp))

                                                Spacer(modifier = Modifier.height(12.dp))

                                                Divider(color = ZaLoBackground)

                                                Spacer(modifier = Modifier.height(8.dp))

                                                Row(
                                                    modifier = Modifier.fillMaxWidth(),
                                                    horizontalArrangement = Arrangement.SpaceBetween,
                                                    verticalAlignment = Alignment.CenterVertically
                                                ) {
                                                    Text("الفئة: ${store.category}", fontSize = 10.sp, color = ZaLoEmeraldDark, fontWeight = FontWeight.Bold)
                                                    Text("بلدية: ${store.commune}", fontSize = 10.sp, color = ZaLoTextSecondary)
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        // --- Product Marketplace Grid ---
                        item {
                            Text(
                                text = "اكتشف أسرع العروض والمستجدات",
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold,
                                color = ZaLoTextPrimary,
                                modifier = Modifier.fillMaxWidth(),
                                textAlign = TextAlign.Start
                            )
                        }

                        val visibleProducts = if (selectedStoreForDetail != null) {
                            allProducts.filter { it.storeId == selectedStoreForDetail!!.id }
                        } else {
                            // Show all products from approved stores in region or globally
                            val approvedStoreIds = allStores.filter { it.wilaya == wrFilter && it.status == "APPROVED" }.map { it.id }
                            allProducts.filter { it.storeId in approvedStoreIds }
                        }

                        if (visibleProducts.isEmpty()) {
                            item {
                                Card(
                                    modifier = Modifier.fillMaxWidth(),
                                    colors = CardDefaults.cardColors(containerColor = ZaLoCardBG)
                                ) {
                                    Box(modifier = Modifier.padding(32.dp).fillMaxWidth(), contentAlignment = Alignment.Center) {
                                        Text("لا تتوفر منتجات حالياً للخيارات المحددة.", fontSize = 12.sp, color = ZaLoTextSecondary)
                                    }
                                }
                            }
                        } else {
                            items(visibleProducts) { product ->
                                val store = allStores.find { it.id == product.storeId }
                                Card(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clickable { selectedProductForDetail = product },
                                    colors = CardDefaults.cardColors(containerColor = ZaLoCardBG),
                                    shape = RoundedCornerShape(16.dp)
                                ) {
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(12.dp),
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        // Product Text detail
                                        Column(
                                            modifier = Modifier.weight(1f).padding(end = 12.dp)
                                        ) {
                                            Text(product.name, fontSize = 15.sp, fontWeight = FontWeight.Bold, color = ZaLoTextPrimary)
                                            Text(product.description, fontSize = 11.sp, color = ZaLoTextSecondary, maxLines = 1, overflow = TextOverflow.Ellipsis)
                                            
                                            Spacer(modifier = Modifier.height(6.dp))

                                            Row(verticalAlignment = Alignment.CenterVertically) {
                                                Box(
                                                    modifier = Modifier
                                                        .clip(RoundedCornerShape(6.dp))
                                                        .background(ZaLoBackground)
                                                        .padding(horizontal = 8.dp, vertical = 2.dp)
                                                ) {
                                                    Text("المخزون: ${product.stock}", fontSize = 9.sp, color = ZaLoTextSecondary)
                                                }
                                                if (store != null) {
                                                    Spacer(modifier = Modifier.width(8.dp))
                                                    Text("المتجر: ${store.name}", fontSize = 9.sp, color = ZaLoEmeraldDark, fontWeight = FontWeight.Bold)
                                                }
                                            }
                                        }

                                        // Product Price & Buy Actions
                                        Column(
                                            horizontalAlignment = Alignment.End
                                        ) {
                                            Text(
                                                text = "${product.price.toInt()} DZD",
                                                fontSize = 15.sp,
                                                fontWeight = FontWeight.Black,
                                                color = ZaLoEmerald
                                            )
                                            
                                            Spacer(modifier = Modifier.height(4.dp))

                                            Button(
                                                onClick = { viewModel.addToCart(product) },
                                                
                                                shape = RoundedCornerShape(10.dp),
                                                colors = ButtonDefaults.buttonColors(containerColor = ZaLoEmerald),
                                                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 2.dp),
                                                modifier = Modifier.height(32.dp)
                                            ) {
                                                Icon(Icons.Default.Add, contentDescription = "Add", tint = Color.White, modifier = Modifier.size(14.dp))
                                                Spacer(modifier = Modifier.width(4.dp))
                                                Text("شراء", fontSize = 11.sp, color = Color.White, fontWeight = FontWeight.Bold)
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        // Bottom Margin
                        item { Spacer(modifier = Modifier.height(72.dp)) }
                    }
                }

                "cart" -> {
                    // --- Shopping Cart Interface ---
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(16.dp)
                    ) {
                        Text("سلة التسوق الذكية", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = ZaLoTextPrimary)
                        Text("تحتوي على منتجات مختارة بضمان المنصة المباشر", fontSize = 11.sp, color = ZaLoTextSecondary)

                        Spacer(modifier = Modifier.height(16.dp))

                        if (cart.isEmpty()) {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .weight(1f),
                                contentAlignment = Alignment.Center
                            ) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Icon(Icons.Default.ShoppingCart, contentDescription = "Empty", tint = ZaLoTextSecondary.copy(alpha = 0.3f), modifier = Modifier.size(64.dp))
                                    Spacer(modifier = Modifier.height(12.dp))
                                    Text("سلة التسوق فارغة حالياً.", color = ZaLoTextSecondary, fontSize = 14.sp)
                                }
                            }
                        } else {
                            LazyColumn(
                                modifier = Modifier.weight(1f),
                                verticalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                items(cart.values.toList()) { (product, qty) ->
                                    Card(
                                        colors = CardDefaults.cardColors(containerColor = ZaLoCardBG),
                                        shape = RoundedCornerShape(16.dp)
                                    ) {
                                        Row(
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .padding(16.dp),
                                            verticalAlignment = Alignment.CenterVertically,
                                            horizontalArrangement = Arrangement.SpaceBetween
                                        ) {
                                            Column(modifier = Modifier.weight(1f)) {
                                                Text(product.name, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = ZaLoTextPrimary)
                                                Text("${product.price.toInt()} DZD", fontSize = 12.sp, color = ZaLoEmerald, fontWeight = FontWeight.Bold)
                                            }

                                            // Qty editors
                                            Row(
                                                verticalAlignment = Alignment.CenterVertically,
                                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                                            ) {
                                                IconButton(
                                                    onClick = { viewModel.updateCartQty(product.id, qty - 1) },
                                                    modifier = Modifier.size(30.dp)
                                                ) {
                                                    Icon(Icons.Default.Remove, contentDescription = "-", tint = ZaLoTextPrimary)
                                                }

                                                Text("$qty", fontSize = 14.sp, fontWeight = FontWeight.Bold)

                                                IconButton(
                                                    onClick = { viewModel.updateCartQty(product.id, qty + 1) },
                                                    modifier = Modifier.size(30.dp)
                                                ) {
                                                    Icon(Icons.Default.Add, contentDescription = "+", tint = ZaLoEmerald)
                                                }
                                            }
                                        }
                                    }
                                }
                            }

                            // Pricing aggregate area
                            Card(
                                colors = CardDefaults.cardColors(containerColor = ZaLoCardBG),
                                shape = RoundedCornerShape(16.dp),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 12.dp)
                            ) {
                                Column(modifier = Modifier.padding(16.dp)) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Text("المجموع الفرعي", color = ZaLoTextSecondary, fontSize = 12.sp)
                                        Text("${cartTotal.toInt()} DZD", color = ZaLoTextPrimary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                    }
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Text("توصيل الولاية (Wilaya)", color = ZaLoTextSecondary, fontSize = 12.sp)
                                        Text("400 DZD", color = ZaLoTextPrimary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                    }
                                    Divider(modifier = Modifier.padding(vertical = 8.dp), color = ZaLoBackground)
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Text("المبلغ الإجمالي", color = ZaLoTextPrimary, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                                        Text("${(cartTotal + 400).toInt()} DZD", color = ZaLoEmerald, fontSize = 16.sp, fontWeight = FontWeight.Black)
                                    }
                                    
                                    Spacer(modifier = Modifier.height(12.dp))

                                    Button(
                                        onClick = { currentSubTab = "checkout" },
                                        shape = RoundedCornerShape(14.dp),
                                        colors = ButtonDefaults.buttonColors(containerColor = ZaLoEmerald),
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Text("متابعة الدفع الآمن", color = Color.White, fontWeight = FontWeight.Bold)
                                    }
                                }
                            }
                        }
                    }
                }

                "checkout" -> {
                    // --- Checkout Screen ---
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(16.dp)
                    ) {
                        Text("إتمام الطلب والدفع", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = ZaLoTextPrimary)
                        Text("اختر وسيلة الدفع وأدخل تفاصيل التسليم لإكمال المعاملة.", fontSize = 11.sp, color = ZaLoTextSecondary)

                        Spacer(modifier = Modifier.height(16.dp))

                        Card(
                            colors = CardDefaults.cardColors(containerColor = ZaLoCardBG),
                            shape = RoundedCornerShape(16.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(bottom = 12.dp)
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Text("عنوان التوصيل الجزائري", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                                Spacer(modifier = Modifier.height(8.dp))
                                OutlinedTextField(
                                    value = userAddress,
                                    onValueChange = { userAddress = it },
                                    modifier = Modifier.fillMaxWidth(),
                                    colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = ZaLoEmerald)
                                )
                            }
                        }

                        Card(
                            colors = CardDefaults.cardColors(containerColor = ZaLoCardBG),
                            shape = RoundedCornerShape(16.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Text("طريقة الدفع المتوفرة", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                                Spacer(modifier = Modifier.height(8.dp))

                                // COD Method
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clip(RoundedCornerShape(12.dp))
                                        .background(if (selectedPaymentMethod == "COD") ZaLoEmerald.copy(alpha = 0.05f) else Color.Transparent)
                                        .border(1.dp, if (selectedPaymentMethod == "COD") ZaLoEmerald else ZaLoBackground, RoundedCornerShape(12.dp))
                                        .clickable { selectedPaymentMethod = "COD" }
                                        .padding(12.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    RadioButton(selected = selectedPaymentMethod == "COD", onClick = { selectedPaymentMethod = "COD" }, colors = RadioButtonDefaults.colors(selectedColor = ZaLoEmerald))
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Column {
                                        Text("الدفع عند التسليم (COD)", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = ZaLoTextPrimary)
                                        Text("ادفع ثمن الشراء عند استلام سلتك مباشرة من السائق.", fontSize = 10.sp, color = ZaLoTextSecondary)
                                    }
                                }

                                Spacer(modifier = Modifier.height(8.dp))

                                // BaridiMob Method
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clip(RoundedCornerShape(12.dp))
                                        .background(if (selectedPaymentMethod == "BARIDIMOB") ZaLoEmerald.copy(alpha = 0.05f) else Color.Transparent)
                                        .border(1.dp, if (selectedPaymentMethod == "BARIDIMOB") ZaLoEmerald else ZaLoBackground, RoundedCornerShape(12.dp))
                                        .clickable { selectedPaymentMethod = "BARIDIMOB" }
                                        .padding(12.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    RadioButton(selected = selectedPaymentMethod == "BARIDIMOB", onClick = { selectedPaymentMethod = "BARIDIMOB" }, colors = RadioButtonDefaults.colors(selectedColor = ZaLoEmerald))
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Column {
                                        Text("الدفع السريع BaridiMob", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = ZaLoTextPrimary)
                                        Text("قم بالدفع عبر تطبيق بريديموب وأرفع الوصل لإكمال التجهيز.", fontSize = 10.sp, color = ZaLoTextSecondary)
                                    }
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(24.dp))

                        Button(
                            onClick = {
                                viewModel.placeOrder(userAddress, selectedPaymentMethod)
                                currentSubTab = "profile"
                            },
                            shape = RoundedCornerShape(14.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = ZaLoEmerald),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(50.dp)
                        ) {
                            Text("تأكيد إرسال الطلب", color = Color.White, fontWeight = FontWeight.Bold)
                        }
                    }
                }

                "profile" -> {
                    // --- Profile & History Interface ---
                    LazyColumn(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(14.dp)
                    ) {
                        item {
                            Card(
                                colors = CardDefaults.cardColors(containerColor = ZaLoNavy),
                                shape = RoundedCornerShape(20.dp)
                            ) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(16.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Column {
                                        Text(currentUser?.name ?: "العميل", color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                                        Text("نقاط ولاء ZaLo:", color = ZaLoGold, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                        Text("${currentUser?.loyaltyPoints ?: 1250} نقطة", color = ZaLoGoldLight, fontSize = 24.sp, fontWeight = FontWeight.Black)
                                        Text("استخدمها في الخصومات والدفع مستبقلاً.", color = Color.White.copy(alpha = 0.5f), fontSize = 9.sp)
                                    }

                                    // Display badge points circular
                                    Box(
                                        modifier = Modifier
                                            .size(60.dp)
                                            .clip(CircleShape)
                                            .background(ZaLoEmerald.copy(alpha = 0.15f))
                                            .border(1.dp, ZaLoEmerald, CircleShape),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Icon(Icons.Default.Loyalty, contentDescription = "badge", tint = ZaLoGold, modifier = Modifier.size(24.dp))
                                    }
                                }
                            }
                        }

                        item {
                            Text("طلباتي السابقة والنشطة", fontSize = 16.sp, fontWeight = FontWeight.Bold)
                        }

                        val customerOrders = allOrders.filter { it.customerId == (currentUser?.id ?: 0) }

                        if (customerOrders.isEmpty()) {
                            item {
                                Card(
                                    modifier = Modifier.fillMaxWidth(),
                                    colors = CardDefaults.cardColors(containerColor = ZaLoCardBG)
                                ) {
                                    Box(modifier = Modifier.padding(20.dp).fillMaxWidth(), contentAlignment = Alignment.Center) {
                                        Text("لا توجد طلبات جارية حالياً.", fontSize = 12.sp, color = ZaLoTextSecondary)
                                    }
                                }
                            }
                        } else {
                            items(customerOrders) { idxOrder ->
                                Card(
                                    colors = CardDefaults.cardColors(containerColor = ZaLoCardBG),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Column(modifier = Modifier.padding(14.dp)) {
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween,
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Text("طلب #${idxOrder.id}", fontWeight = FontWeight.Bold)
                                            // Dynamic Status Badge
                                            val color = when (idxOrder.status) {
                                                "PENDING" -> ZaLoPending
                                                "CONFIRMED" -> ZaLoEmeraldDark
                                                "PREPARING" -> ZaLoGold
                                                "SHIPPING" -> ZaLoEmerald
                                                "DELIVERED" -> ZaLoApproved
                                                else -> ZaLoTextSecondary
                                            }
                                            Box(
                                                modifier = Modifier
                                                    .clip(RoundedCornerShape(8.dp))
                                                    .background(color.copy(alpha = 0.1f))
                                                    .padding(horizontal = 10.dp, vertical = 2.dp)
                                            ) {
                                                Text(idxOrder.status, color = color, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                            }
                                        }

                                        Spacer(modifier = Modifier.height(4.dp))
                                        Text("المتجر: ${idxOrder.storeName}", fontSize = 11.sp, color = ZaLoTextSecondary)
                                        Text("الإجمالي: ${(idxOrder.totalAmount + idxOrder.deliveryFee).toInt()} DZD (${idxOrder.paymentMethod})", fontSize = 11.sp, color = ZaLoEmerald, fontWeight = FontWeight.Bold)

                                        Spacer(modifier = Modifier.height(8.dp))

                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.End,
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            // Dispute complain button
                                            TextButton(
                                                onClick = { showComplaintDialog = idxOrder }
                                            ) {
                                                Icon(Icons.Default.Feedback, contentDescription = "complain", modifier = Modifier.size(14.dp), tint = ZaLoSuspended)
                                                Spacer(modifier = Modifier.width(4.dp))
                                                Text("رفع شكوى لدعم المنصة", color = ZaLoSuspended, fontSize = 11.sp)
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        item { Spacer(modifier = Modifier.height(80.dp)) }
                    }
                }
            }
        }
    }

    // --- Bottom Sheet / Dialog overlays ---
    if (showNotificationSheet) {
        AlertDialog(
            onDismissRequest = { showNotificationSheet = false },
            title = { Text("مركز الإشعارات الذكي (ZaLo Alerts)", fontSize = 16.sp, fontWeight = FontWeight.Bold) },
            text = {
                LazyColumn(
                    modifier = Modifier.heightIn(max = 300.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    if (activeNotifications.isEmpty()) {
                        item { Text("لا توجد إشعارات حالياً.", fontSize = 12.sp, color = ZaLoTextSecondary) }
                    } else {
                        items(activeNotifications) { alert ->
                            Card(
                                colors = CardDefaults.cardColors(containerColor = ZaLoBackground)
                            ) {
                                Column(modifier = Modifier.padding(10.dp)) {
                                    Text(alert.title, fontWeight = FontWeight.Bold, fontSize = 12.sp, color = ZaLoEmeraldDark)
                                    Text(alert.message, fontSize = 11.sp, color = ZaLoTextPrimary, modifier = Modifier.padding(top = 2.dp))
                                }
                            }
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = {
                    viewModel.clearNotifications()
                    showNotificationSheet = false
                }) {
                    Text("تمت القراءة", color = ZaLoEmerald)
                }
            }
        )
    }

    // Product detailed sheet overlay with rating
    if (selectedProductForDetail != null) {
        val prod = selectedProductForDetail!!
        AlertDialog(
            onDismissRequest = { selectedProductForDetail = null },
            title = { Text(prod.name, fontSize = 18.sp, fontWeight = FontWeight.Bold) },
            text = {
                Column {
                    Text(prod.description, fontSize = 13.sp, color = ZaLoTextSecondary)
                    Spacer(modifier = Modifier.height(10.dp))
                    Text("السعر: ${prod.price.toInt()} DZD", fontWeight = FontWeight.Bold, color = ZaLoEmerald, fontSize = 16.sp)
                    Text("المخزون المتوفر: ${prod.stock} وحدة", fontSize = 11.sp, color = ZaLoTextSecondary)
                    
                    Spacer(modifier = Modifier.height(14.dp))
                    Text("التقييمات والآراء:", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    Spacer(modifier = Modifier.height(4.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("قم بتقييم هذا المنتج:", fontSize = 11.sp)
                        Row {
                            (1..5).forEach { star ->
                                Icon(
                                    imageVector = if (reviewRating >= star) Icons.Default.Star else Icons.Outlined.Star,
                                    contentDescription = "$star",
                                    tint = ZaLoGold,
                                    modifier = Modifier
                                        .size(20.dp)
                                        .clickable { reviewRating = star }
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(6.dp))

                    OutlinedTextField(
                        value = reviewComment,
                        onValueChange = { reviewComment = it },
                        modifier = Modifier.fillMaxWidth(),
                        placeholder = { Text("اكتب تعليقك هنا...", fontSize = 11.sp) }
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        viewModel.addReview(prod.id, reviewRating, reviewComment)
                        viewModel.addToCart(prod)
                        selectedProductForDetail = null
                        reviewComment = ""
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = ZaLoEmerald)
                ) {
                    Text("أضف للسلة")
                }
            },
            dismissButton = {
                TextButton(onClick = { selectedProductForDetail = null }) {
                    Text("إغلاق")
                }
            }
        )
    }

    // Raise Complaint Dialog overlay
    if (showComplaintDialog != null) {
        val order = showComplaintDialog!!
        AlertDialog(
            onDismissRequest = { showComplaintDialog = null },
            title = { Text("رفع نزاع لطلب رقم #${order.id}", fontSize = 14.sp, fontWeight = FontWeight.Bold) },
            text = {
                Column {
                    Text("اكتب الشكوى بالتفصيل (مثل: تأخر السائق، تلف السلعة، خطأ بالطلب):", fontSize = 12.sp, color = ZaLoTextSecondary)
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = complaintText,
                        onValueChange = { complaintText = it },
                        modifier = Modifier.fillMaxWidth(),
                        placeholder = { Text("مثال: السائق لم يحضر السلعة المتفق عليها...") }
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        viewModel.addComplaint(order.id, complaintText)
                        showComplaintDialog = null
                        complaintText = ""
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = ZaLoSuspended)
                ) {
                    Text("إرسال لفريق الدعم")
                }
            },
            dismissButton = {
                TextButton(onClick = { showComplaintDialog = null }) {
                    Text("إلغاء")
                }
            }
        )
    }
}

@Composable
fun BottomNavItem(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    label: String,
    badgeCount: Int = 0,
    isActive: Boolean,
    onClick: () -> Unit
) {
    Column(
        modifier = Modifier
            .clickable { onClick() }
            .padding(8.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Box {
            Icon(
                imageVector = icon,
                contentDescription = label,
                tint = if (isActive) ZaLoEmerald else Color.White.copy(alpha = 0.6f),
                modifier = Modifier.size(24.dp)
            )
            if (badgeCount > 0) {
                Box(
                    modifier = Modifier
                        .size(16.dp)
                        .clip(CircleShape)
                        .background(ZaLoSuspended)
                        .align(Alignment.TopEnd)
                        .offset(x = 6.dp, y = (-4).dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text("$badgeCount", color = Color.White, fontSize = 9.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
        Spacer(modifier = Modifier.height(2.dp))
        Text(
            text = label,
            fontSize = 9.sp,
            fontWeight = if (isActive) FontWeight.Bold else FontWeight.Normal,
            color = if (isActive) ZaLoEmerald else Color.White.copy(alpha = 0.6f)
        )
    }
}
