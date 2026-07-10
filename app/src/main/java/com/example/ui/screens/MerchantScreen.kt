package com.example.ui.screens

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.Order
import com.example.data.Product
import com.example.data.Store
import com.example.ui.theme.*
import com.example.viewmodel.EcomViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MerchantScreen(
    viewModel: EcomViewModel,
    onNavigateToAiAssistant: () -> Unit
) {
    val currentUser by viewModel.currentUser.collectAsState()
    val activeStore by viewModel.activeMerchantStore.collectAsState()
    val activeSub by viewModel.activeMerchantSub.collectAsState()
    val allProducts by viewModel.allProducts.collectAsState()
    val allOrders by viewModel.allOrders.collectAsState()

    // Screen sections: "dashboard", "products", "subscription"
    var merchantSection by remember { mutableStateOf("dashboard") }

    // Dialog & Form states
    var showAddProductDialog by remember { mutableStateOf(false) }
    var prodName by remember { mutableStateOf("") }
    var prodDesc by remember { mutableStateOf("") }
    var prodPrice by remember { mutableStateOf("") }
    var prodStock by remember { mutableStateOf("") }
    var prodCat by remember { mutableStateOf("إلكترونيات") }

    // Onboarding Form
    var regStoreName by remember { mutableStateOf("") }
    var regStoreDesc by remember { mutableStateOf("") }
    var regStorePhone by remember { mutableStateOf("+213 ") }
    var regStoreWhatsapp by remember { mutableStateOf("+213 ") }
    var regStoreWilaya by remember { mutableStateOf("الجزائر") }
    var regStoreCommune by remember { mutableStateOf("المرسى") }
    var regStoreCat by remember { mutableStateOf("إلكترونيات") }
    var uploadedDocs by remember { mutableStateOf(false) }

    Scaffold(
        modifier = Modifier
            .fillMaxSize()
            .windowInsetsPadding(WindowInsets.safeDrawing),
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = "بوابة التاجر اللامحدودة (ZaLo SaaS)",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Black,
                            color = ZaLoEmerald
                        )
                        Text(
                            text = "نظام الفوترة والتسويق الرقمي الجزائري",
                            fontSize = 11.sp,
                            color = ZaLoTextSecondary
                        )
                    }
                },
                actions = {
                    // Back to Customer view
                    TextButton(onClick = { viewModel.switchRole("CUSTOMER") }) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.ShoppingBag, contentDescription = "Shop", modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("منصة التسوق", fontWeight = FontWeight.Bold, color = ZaLoEmerald, fontSize = 13.sp)
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = ZaLoCardBG)
            )
        },
        bottomBar = {
            // Floating Tab layout for merchant functions
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
                    BottomNavItem(icon = Icons.Default.TrendingUp, label = "رئيسية", isActive = merchantSection == "dashboard", onClick = { merchantSection = "dashboard" })
                    BottomNavItem(icon = Icons.Default.Inventory, label = "المنتجات", isActive = merchantSection == "products", onClick = { merchantSection = "products" })
                    BottomNavItem(icon = Icons.Default.CardMembership, label = "اشتراكي", isActive = merchantSection == "subscription", onClick = { merchantSection = "subscription" })
                    BottomNavItem(icon = Icons.Default.SmartToy, label = "AI كاتب", isActive = false, onClick = onNavigateToAiAssistant)
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

            if (activeStore == null) {
                // --- Store Onboarding Setup ---
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    item {
                        Card(
                            colors = CardDefaults.cardColors(containerColor = ZaLoNavy)
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Text("سجل كتاجر وارفع مبيعاتك اليوم! 🚀", color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                                Spacer(modifier = Modifier.height(4.dp))
                                Text("اربط خدماتك الإلكترونية بمئات العملاء في ولايتك وسهّل المعاملات باستخدام BaridiMob والدفع الكاش.", color = Color.White.copy(alpha = 0.7f), fontSize = 11.sp, lineHeight = 16.sp)
                            }
                        }
                    }

                    item {
                        Card(
                            colors = CardDefaults.cardColors(containerColor = ZaLoCardBG)
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Text("تفاصيل المتجر المقترح والخدمات", fontSize = 14.sp, fontWeight = FontWeight.Bold)
                                Spacer(modifier = Modifier.height(12.dp))

                                OutlinedTextField(value = regStoreName, onValueChange = { regStoreName = it }, label = { Text("اسم المحل / العلامة التجارية") }, modifier = Modifier.fillMaxWidth())
                                Spacer(modifier = Modifier.height(8.dp))
                                OutlinedTextField(value = regStoreDesc, onValueChange = { regStoreDesc = it }, label = { Text("وصف النشاط بالتفصيل") }, modifier = Modifier.fillMaxWidth())
                                Spacer(modifier = Modifier.height(8.dp))
                                OutlinedTextField(value = regStorePhone, onValueChange = { regStorePhone = it }, label = { Text("رقم الهاتف للتواصل") }, modifier = Modifier.fillMaxWidth())
                                Spacer(modifier = Modifier.height(8.dp))
                                OutlinedTextField(value = regStoreWhatsapp, onValueChange = { regStoreWhatsapp = it }, label = { Text("رابط الواتساب (WhatsApp)") }, modifier = Modifier.fillMaxWidth())
                                Spacer(modifier = Modifier.height(12.dp))

                                Text("الموقع الجغرافي للمحل:", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = ZaLoEmerald)
                                Spacer(modifier = Modifier.height(4.dp))
                                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    OutlinedTextField(value = regStoreWilaya, onValueChange = { regStoreWilaya = it }, label = { Text("الولاية") }, modifier = Modifier.weight(1f))
                                    OutlinedTextField(value = regStoreCommune, onValueChange = { regStoreCommune = it }, label = { Text("البلدية") }, modifier = Modifier.weight(1f))
                                }

                                Spacer(modifier = Modifier.height(8.dp))
                                Text("فئة المنتجات الرئيسية:", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                Spacer(modifier = Modifier.height(8.dp))
                                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    listOf("إلكترونيات", "خضروات وفواكه", "ملابس وموضة").forEach { cat ->
                                        Box(
                                            modifier = Modifier
                                                .clip(RoundedCornerShape(10.dp))
                                                .background(if (regStoreCat == cat) ZaLoEmerald else ZaLoBackground)
                                                .clickable { regStoreCat = cat }
                                                .padding(horizontal = 14.dp, vertical = 8.dp)
                                        ) {
                                            Text(cat, color = if (regStoreCat == cat) Color.White else ZaLoTextSecondary, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                        }
                                    }
                                }
                            }
                        }
                    }

                    item {
                        Card(
                            colors = CardDefaults.cardColors(containerColor = ZaLoCardBG)
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Text("الملفات والثبوتيات القانونية (المرسل للإدارة)", fontSize = 14.sp, fontWeight = FontWeight.Bold)
                                Spacer(modifier = Modifier.height(10.dp))

                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clip(RoundedCornerShape(12.dp))
                                        .background(ZaLoBackground)
                                        .clickable { uploadedDocs = !uploadedDocs }
                                        .padding(16.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(
                                        imageVector = if (uploadedDocs) Icons.Default.CheckCircle else Icons.Default.UploadFile,
                                        contentDescription = "Upload",
                                        tint = if (uploadedDocs) ZaLoEmerald else ZaLoTextSecondary
                                    )
                                    Spacer(modifier = Modifier.width(12.dp))
                                    Column {
                                        Text("رخصة السجل التجاري والبطاقة الوطنية", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                        Text(if (uploadedDocs) "تم تحميل الوصل وتجريب الملفات بنجاح!" else "اضغط هنا للمحاكاة وتحميل الملفات المطلوبة PDF/Image.", fontSize = 10.sp, color = ZaLoTextSecondary)
                                    }
                                }

                                Spacer(modifier = Modifier.height(16.dp))

                                Button(
                                    onClick = {
                                        if (regStoreName.isNotEmpty() && uploadedDocs) {
                                            viewModel.registerStore(
                                                name = regStoreName,
                                                description = regStoreDesc,
                                                phone = regStorePhone,
                                                whatsapp = regStoreWhatsapp,
                                                wilaya = regStoreWilaya,
                                                commune = regStoreCommune,
                                                category = regStoreCat
                                            )
                                        }
                                    },
                                    modifier = Modifier.fillMaxWidth(),
                                    enabled = regStoreName.isNotEmpty() && uploadedDocs,
                                    colors = ButtonDefaults.buttonColors(containerColor = ZaLoEmerald)
                                ) {
                                    Text("أرسل طلب التسجيل للإدارة العامة")
                                }
                            }
                        }
                    }
                    
                    item { Spacer(modifier = Modifier.height(72.dp)) }
                }
            } else {
                // --- Store Registered Panel ---
                val store = activeStore!!
                
                when (merchantSection) {
                    "dashboard" -> {
                        LazyColumn(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(16.dp),
                            verticalArrangement = Arrangement.spacedBy(14.dp)
                        ) {
                            // Onboarding state feedback
                            item {
                                Card(
                                    colors = CardDefaults.cardColors(containerColor = ZaLoNavy)
                                ) {
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(16.dp),
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Column {
                                            Text(store.name, fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color.White)
                                            Text("بلدية: ${store.commune} | ولاية: ${store.wilaya}", fontSize = 11.sp, color = Color.White.copy(alpha = 0.7f))
                                        }
                                        
                                        // Approved status badge
                                        val color = when (store.status) {
                                            "APPROVED" -> ZaLoApproved
                                            "PENDING" -> ZaLoPending
                                            else -> ZaLoSuspended
                                        }
                                        Box(
                                            modifier = Modifier
                                                .clip(RoundedCornerShape(8.dp))
                                                .background(color.copy(alpha = 0.2f))
                                                .border(1.dp, color, RoundedCornerShape(8.dp))
                                                .padding(horizontal = 12.dp, vertical = 4.dp)
                                        ) {
                                            Text(store.status, color = color, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                        }
                                    }
                                }
                            }

                            // Interactive Analytics panel
                            if (store.status == "APPROVED") {
                                item {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                                    ) {
                                        val storeOrders = allOrders.filter { it.storeId == store.id }
                                        val completedOrders = storeOrders.filter { it.status == "COMPLETED" || it.status == "SHIPPING" || it.status == "DELIVERED" }
                                        val revenueSum = completedOrders.sumOf { it.totalAmount }

                                        Card(
                                            modifier = Modifier.weight(1.0f),
                                            colors = CardDefaults.cardColors(containerColor = ZaLoCardBG)
                                        ) {
                                            Column(modifier = Modifier.padding(14.dp)) {
                                                Text("إجمالي المبيعات", fontSize = 11.sp, color = ZaLoTextSecondary)
                                                Text("${revenueSum.toInt()} DZD", fontSize = 20.sp, fontWeight = FontWeight.Black, color = ZaLoEmerald)
                                                Text("عائدات مكتملة ونشطة", fontSize = 9.sp, color = ZaLoTextSecondary)
                                            }
                                        }

                                        Card(
                                            modifier = Modifier.weight(1.0f),
                                            colors = CardDefaults.cardColors(containerColor = ZaLoCardBG)
                                        ) {
                                            Column(modifier = Modifier.padding(14.dp)) {
                                                Text("مجموع الطلبات", fontSize = 11.sp, color = ZaLoTextSecondary)
                                                Text("${storeOrders.size}", fontSize = 20.sp, fontWeight = FontWeight.Black, color = ZaLoNavy)
                                                Text("أمر تتبع نشط", fontSize = 9.sp, color = ZaLoTextSecondary)
                                            }
                                        }
                                    }
                                }

                                item {
                                    Text("تتبع وتأكيد طلبات الزبائن", fontSize = 16.sp, fontWeight = FontWeight.Bold)
                                }

                                val storeOrders = allOrders.filter { it.storeId == store.id }
                                if (storeOrders.isEmpty()) {
                                    item {
                                        Card(
                                            modifier = Modifier.fillMaxWidth(),
                                            colors = CardDefaults.cardColors(containerColor = ZaLoCardBG)
                                        ) {
                                            Box(modifier = Modifier.padding(20.dp).fillMaxWidth(), contentAlignment = Alignment.Center) {
                                                Text("لا تتوفر طلبات لمحلك حالياً.", fontSize = 12.sp, color = ZaLoTextSecondary)
                                            }
                                        }
                                    }
                                } else {
                                    items(storeOrders) { order ->
                                        Card(
                                            colors = CardDefaults.cardColors(containerColor = ZaLoCardBG)
                                        ) {
                                            Column(modifier = Modifier.padding(14.dp)) {
                                                Row(
                                                    modifier = Modifier.fillMaxWidth(),
                                                    horizontalArrangement = Arrangement.SpaceBetween,
                                                    verticalAlignment = Alignment.CenterVertically
                                                ) {
                                                    Text("طلب #${order.id}", fontWeight = FontWeight.Bold)
                                                    Text(order.status, color = ZaLoEmerald, fontSize = 11.sp, fontWeight = FontWeight.Black)
                                                }
                                                Spacer(modifier = Modifier.height(4.dp))
                                                Text("التسليم إلى: ${order.address}", fontSize = 11.sp, color = ZaLoTextSecondary)
                                                Text("الإجمالي المستحقّ: ${(order.totalAmount + order.deliveryFee).toInt()} DZD (${order.paymentMethod})", fontSize = 11.sp, color = ZaLoTextPrimary, fontWeight = FontWeight.Bold)

                                                Spacer(modifier = Modifier.height(8.dp))
                                                Divider(color = ZaLoBackground)
                                                Spacer(modifier = Modifier.height(8.dp))

                                                // Order Status trigger controls (Shop lifecyle tracker)
                                                Row(
                                                    modifier = Modifier.fillMaxWidth(),
                                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                                ) {
                                                    if (order.status == "PENDING") {
                                                        Button(
                                                            onClick = { viewModel.updateOrderStatus(order.id, "CONFIRMED") },
                                                            colors = ButtonDefaults.buttonColors(containerColor = ZaLoEmerald),
                                                            modifier = Modifier.weight(1f)
                                                        ) {
                                                            Text("قبول الطلب", fontSize = 10.sp, color = Color.White)
                                                        }
                                                        Button(
                                                            onClick = { viewModel.updateOrderStatus(order.id, "REJECTED") },
                                                            colors = ButtonDefaults.buttonColors(containerColor = ZaLoSuspended),
                                                            modifier = Modifier.weight(1f)
                                                        ) {
                                                            Text("رفض", fontSize = 10.sp, color = Color.White)
                                                        }
                                                    }
                                                    if (order.status == "CONFIRMED") {
                                                        Button(
                                                            onClick = { viewModel.updateOrderStatus(order.id, "PREPARING") },
                                                            colors = ButtonDefaults.buttonColors(containerColor = ZaLoGold),
                                                            modifier = Modifier.fillMaxWidth()
                                                        ) {
                                                            Text("البدء بالتحضير والتغليف", fontSize = 11.sp, color = Color.White)
                                                        }
                                                    }
                                                    if (order.status == "PREPARING") {
                                                        Button(
                                                            onClick = { viewModel.updateOrderStatus(order.id, "SHIPPING") },
                                                            colors = ButtonDefaults.buttonColors(containerColor = ZaLoEmerald),
                                                            modifier = Modifier.fillMaxWidth()
                                                        ) {
                                                            Text("تسليم لسائق الشحن التابع لـ ZaLo", fontSize = 11.sp, color = Color.White)
                                                        }
                                                    }
                                                    if (order.status == "SHIPPING") {
                                                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                                                            Button(
                                                                onClick = { viewModel.updateOrderStatus(order.id, "DELIVERED") },
                                                                colors = ButtonDefaults.buttonColors(containerColor = ZaLoApproved),
                                                                modifier = Modifier.weight(1f)
                                                            ) {
                                                                Text("تم التوصيل بنجاح", fontSize = 10.sp)
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            } else {
                                item {
                                    Card(
                                        colors = CardDefaults.cardColors(containerColor = ZaLoCardBG)
                                    ) {
                                        Box(modifier = Modifier.padding(32.dp).fillMaxWidth(), contentAlignment = Alignment.Center) {
                                            Text("حسابك مسجل وقيد المراجعة الفنية من قبل مشرفي النظام الجزائري حالياً.", fontSize = 12.sp, color = ZaLoTextSecondary, textAlign = TextAlign.Center)
                                        }
                                    }
                                }
                            }
                            
                            item { Spacer(modifier = Modifier.height(72.dp)) }
                        }
                    }

                    "products" -> {
                        // --- Core Product Registry ---
                        Column(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(16.dp)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column {
                                    Text("مخزن المنتجات المعروضة", fontSize = 18.sp, fontWeight = FontWeight.Bold)
                                    Text("أضف وعدل منتجاتك في المتاجر المفتوحة", fontSize = 11.sp, color = ZaLoTextSecondary)
                                }

                                Button(
                                    onClick = { showAddProductDialog = true },
                                    colors = ButtonDefaults.buttonColors(containerColor = ZaLoEmerald)
                                ) {
                                    Icon(Icons.Default.Add, contentDescription = "Add")
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text("إضافة منتج", fontSize = 11.sp)
                                }
                            }

                            Spacer(modifier = Modifier.height(16.dp))

                            val storeProducts = allProducts.filter { it.storeId == store.id }

                            if (storeProducts.isEmpty()) {
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .weight(1f),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text("لم تقم بإضافة منتجات للمخزن بعد.", fontSize = 12.sp, color = ZaLoTextSecondary)
                                }
                            } else {
                                LazyColumn(
                                    modifier = Modifier.weight(1f),
                                    verticalArrangement = Arrangement.spacedBy(10.dp)
                                ) {
                                    items(storeProducts) { product ->
                                        Card(
                                            colors = CardDefaults.cardColors(containerColor = ZaLoCardBG)
                                        ) {
                                            Row(
                                                modifier = Modifier
                                                    .fillMaxWidth()
                                                    .padding(14.dp),
                                                verticalAlignment = Alignment.CenterVertically,
                                                horizontalArrangement = Arrangement.SpaceBetween
                                            ) {
                                                Column(modifier = Modifier.weight(1f)) {
                                                    Text(product.name, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = ZaLoTextPrimary)
                                                    Text("السعر: ${product.price.toInt()} DZD | المخزون: ${product.stock}", fontSize = 12.sp, color = ZaLoTextSecondary)
                                                }

                                                IconButton(onClick = { viewModel.deleteProduct(product) }) {
                                                    Icon(Icons.Default.Delete, contentDescription = "Delete", tint = ZaLoSuspended)
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    "subscription" -> {
                        // --- Subscription Monetization Tab ---
                        LazyColumn(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(16.dp),
                            verticalArrangement = Arrangement.spacedBy(16.dp)
                        ) {
                            item {
                                Card(
                                    colors = CardDefaults.cardColors(containerColor = ZaLoNavy)
                                ) {
                                    Column(modifier = Modifier.padding(16.dp)) {
                                        Text("خطط الاشتراكات المميزة للتاجر الـ Smart 💳", color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                                        Spacer(modifier = Modifier.height(4.dp))
                                        Text("تفعيل الاشتراك يتيح لك ميزات تسويقية بمساعدة الذكاء الاصطناعي وبطاقات عروض متميزة في ولايتك.", color = Color.White.copy(alpha = 0.7f), fontSize = 11.sp, lineHeight = 16.sp)
                                    }
                                }
                            }

                            item {
                                Card(
                                    colors = CardDefaults.cardColors(containerColor = ZaLoCardBG)
                                ) {
                                    Column(modifier = Modifier.padding(16.dp)) {
                                        Text("الاشتراك الحالي للمحل", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                                        Spacer(modifier = Modifier.height(8.dp))

                                        if (activeSub != null) {
                                            Row(
                                                modifier = Modifier.fillMaxWidth(),
                                                horizontalArrangement = Arrangement.SpaceBetween,
                                                verticalAlignment = Alignment.CenterVertically
                                            ) {
                                                Column {
                                                    Text(activeSub!!.planName, fontSize = 15.sp, fontWeight = FontWeight.Bold, color = ZaLoEmerald)
                                                    Text("الرسوم المدفوعة: ${activeSub!!.price.toInt()} DZD/شهر", fontSize = 11.sp, color = ZaLoTextSecondary)
                                                }

                                                Box(
                                                    modifier = Modifier
                                                        .clip(RoundedCornerShape(8.dp))
                                                        .background(ZaLoEmeraldLight)
                                                        .padding(horizontal = 10.dp, vertical = 2.dp)
                                                ) {
                                                    Text(activeSub!!.status, color = ZaLoEmeraldDark, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                                }
                                            }
                                        } else {
                                            Text("لا يوجد اشتراك نشط حالياً (الخطة المجانية المحدودة).", fontSize = 11.sp, color = ZaLoTextSecondary)
                                        }
                                    }
                                }
                            }

                            item {
                                Card(
                                    colors = CardDefaults.cardColors(containerColor = ZaLoCardBG)
                                ) {
                                    Column(modifier = Modifier.padding(16.dp)) {
                                        Text("ترقية الاشتراك عبر الحوالة البريدية الـ CCP", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                                        Text("خطوات التفعيل: \n1. تحويل مبلغ الخطة إلى رقم CCP التالي: 0019283748 مفتاح 92\n2. أو التحويل عبر BaridiMob إلى RIP المتجر.\n3. أرفع صورة الوصل والتحويل هنا للمراجعة الفورية.", fontSize = 11.sp, color = ZaLoTextSecondary, modifier = Modifier.padding(vertical = 10.dp), lineHeight = 16.sp)

                                        Button(
                                            onClick = {
                                                viewModel.paySubscription("SMART_ENTERPRISE", 4500.0)
                                            },
                                            colors = ButtonDefaults.buttonColors(containerColor = ZaLoEmerald),
                                            modifier = Modifier.fillMaxWidth()
                                        ) {
                                            Text("إرسال إثبات حوالة الباقة الذكية (4,500 DZD)")
                                        }
                                    }
                                }
                            }
                            
                            item { Spacer(modifier = Modifier.height(72.dp)) }
                        }
                    }
                }
            }
        }
    }

    // --- Product Add Overlay Dialog ---
    if (showAddProductDialog) {
        AlertDialog(
            onDismissRequest = { showAddProductDialog = false },
            title = { Text("أضف منتج جديد للمحل", fontSize = 16.sp, fontWeight = FontWeight.Bold) },
            text = {
                Column {
                    OutlinedTextField(
                        value = prodName,
                        onValueChange = { prodName = it },
                        modifier = Modifier.fillMaxWidth(),
                        label = { Text("اسم المنتج") }
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = prodDesc,
                        onValueChange = { prodDesc = it },
                        modifier = Modifier.fillMaxWidth(),
                        label = { Text("وصف المنتج الوجيز") }
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = prodPrice,
                        onValueChange = { prodPrice = it },
                        modifier = Modifier.fillMaxWidth(),
                        label = { Text("السعر (DZD)") }
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = prodStock,
                        onValueChange = { prodStock = it },
                        modifier = Modifier.fillMaxWidth(),
                        label = { Text("المخزون المتوفر") }
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text("الفئة المستهدفة:", fontSize = 11.sp)
                    Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                        listOf("إلكترونيات", "خضروات وفواكه", "ملابس وموضة").forEach { cat ->
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(if (prodCat == cat) ZaLoEmerald else ZaLoBackground)
                                    .clickable { prodCat = cat }
                                    .padding(horizontal = 10.dp, vertical = 6.dp)
                            ) {
                                Text(cat, color = if (prodCat == cat) Color.White else ZaLoTextSecondary, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val price = prodPrice.toDoubleOrNull() ?: 0.0
                        val stock = prodStock.toIntOrNull() ?: 0
                        if (prodName.isNotEmpty() && price > 0.0) {
                            viewModel.addProduct(prodName, prodDesc, price, prodCat, stock)
                            showAddProductDialog = false
                            prodName = ""
                            prodDesc = ""
                            prodPrice = ""
                            prodStock = ""
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = ZaLoEmerald)
                ) {
                    Text("إضافة")
                }
            },
            dismissButton = {
                TextButton(onClick = { showAddProductDialog = false }) {
                    Text("إلغاء")
                }
            }
        )
    }
}
