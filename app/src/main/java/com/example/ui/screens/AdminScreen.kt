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
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.*
import com.example.ui.theme.*
import com.example.viewmodel.EcomViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminScreen(
    viewModel: EcomViewModel
) {
    val currentUser by viewModel.currentUser.collectAsState()
    val allUsers by viewModel.allUsers.collectAsState()
    val allStores by viewModel.allStores.collectAsState()
    val allOrders by viewModel.allOrders.collectAsState()
    val allComplaints by viewModel.allComplaints.collectAsState()
    val allAuditLogs by viewModel.allAuditLogs.collectAsState()

    // Sub-sections: "summary", "merchants", "payments", "complaints", "users", "audits"
    var adminTab by remember { mutableStateOf("summary") }

    // Dialog state
    var showResolveDialog by remember { mutableStateOf<Complaint?>(null) }
    var resolveResponseMsg by remember { mutableStateOf("") }

    Scaffold(
        modifier = Modifier
            .fillMaxSize()
            .windowInsetsPadding(WindowInsets.safeDrawing),
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = "مركز التحكم الإداري الشامل",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Black,
                            color = ZaLoEmerald
                        )
                        Text(
                            text = "إدارة الأسواق، مراقبة الالتزامات ومحاربة الاحتيال",
                            fontSize = 11.sp,
                            color = ZaLoTextSecondary
                        )
                    }
                },
                actions = {
                    TextButton(onClick = { viewModel.switchRole("CUSTOMER") }) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.ExitToApp, contentDescription = "Exit", modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("الخروج للعميل", color = ZaLoEmerald, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = ZaLoCardBG)
            )
        }
    ) { innerPadding ->

        Row(
            modifier = Modifier
                .fillMaxSize()
                .background(ZaLoBackground)
                .padding(innerPadding)
        ) {
            
            // --- Custom Left Navigation Rails for Tablet / Desktop / Wide design rules ---
            Column(
                modifier = Modifier
                    .width(140.dp)
                    .fillMaxHeight()
                    .background(ZaLoNavy)
                    .padding(vertical = 12.dp, horizontal = 4.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                AdminRailItem(icon = Icons.Default.Dashboard, label = "لوحة ملخص", isActive = adminTab == "summary", onClick = { adminTab = "summary" })
                AdminRailItem(icon = Icons.Default.Storefront, label = "التجار والمحلات", isActive = adminTab == "merchants", onClick = { adminTab = "merchants" })
                AdminRailItem(icon = Icons.Default.Feedback, label = "الشكاوى", isActive = adminTab == "complaints", onClick = { adminTab = "complaints" })
                AdminRailItem(icon = Icons.Default.People, label = "المستخدمون", isActive = adminTab == "users", onClick = { adminTab = "users" })
                AdminRailItem(icon = Icons.Default.History, label = "سجل النشاط", isActive = adminTab == "audits", onClick = { adminTab = "audits" })
            }

            // --- Primary Admin Operations Section ---
            Box(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxHeight()
                    .padding(16.dp)
            ) {
                when (adminTab) {
                    "summary" -> {
                        // --- Global Dashboard Overview ---
                        LazyColumn(
                            verticalArrangement = Arrangement.spacedBy(16.dp),
                            modifier = Modifier.fillMaxSize()
                        ) {
                            item {
                                Card(
                                    colors = CardDefaults.cardColors(containerColor = ZaLoNavy)
                                ) {
                                    Column(modifier = Modifier.padding(16.dp)) {
                                        Text("مرحباً بك يا مسؤول المنصة! 👋", color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                                        Spacer(modifier = Modifier.height(4.dp))
                                        Text("أنت الآن تتحكم بكامل النظام الجزائري: مراجعة طلبات التسجيل الجغرافية، تفعيل الاشتراكات واستقبال الشكاوى وحلها.", color = Color.White.copy(alpha = 0.7f), fontSize = 11.sp, lineHeight = 16.sp)
                                    }
                                }
                            }

                            item {
                                Text("مؤشرات نمو المنصة الحالية", fontSize = 14.sp, fontWeight = FontWeight.Bold)
                            }

                            item {
                                val totalRevenue = allOrders.filter { it.status == "COMPLETED" }.sumOf { it.totalAmount }
                                val totalCommission = totalRevenue * 0.05 // 5% platform standard commission

                                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                    // Total Platform Revenue Card
                                    Card(
                                        modifier = Modifier.fillMaxWidth(),
                                        colors = CardDefaults.cardColors(containerColor = ZaLoCardBG)
                                    ) {
                                        Column(modifier = Modifier.padding(16.dp)) {
                                            Text("إيرادات المنصة العامة (عائدات)", fontSize = 11.sp, color = ZaLoTextSecondary)
                                            Text("${totalCommission.toInt()} DZD", fontSize = 24.sp, fontWeight = FontWeight.Black, color = ZaLoEmerald)
                                            Text("العمولة المحصلة من المبيعات (5%) بالإضافة للاشتراكات الذكية.", fontSize = 9.sp, color = ZaLoTextSecondary, modifier = Modifier.padding(top = 4.dp))
                                        }
                                    }

                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                                    ) {
                                        Card(
                                            modifier = Modifier.weight(1f),
                                            colors = CardDefaults.cardColors(containerColor = ZaLoCardBG)
                                        ) {
                                            Column(modifier = Modifier.padding(12.dp)) {
                                                Text("إجمالي المتاجر المحققة", fontSize = 11.sp, color = ZaLoTextSecondary)
                                                Text("${allStores.size}", fontSize = 18.sp, fontWeight = FontWeight.Black)
                                                Text("${allStores.filter { it.status == "PENDING" }.size} طلب معلق", fontSize = 9.sp, color = ZaLoPending, fontWeight = FontWeight.Bold)
                                            }
                                        }

                                        Card(
                                            modifier = Modifier.weight(1f),
                                            colors = CardDefaults.cardColors(containerColor = ZaLoCardBG)
                                        ) {
                                            Column(modifier = Modifier.padding(12.dp)) {
                                                Text("إجمالي الطلبات المستلمة", fontSize = 11.sp, color = ZaLoTextSecondary)
                                                Text("${allOrders.size}", fontSize = 18.sp, fontWeight = FontWeight.Black)
                                                Text("عبر الدفع المتعدد", fontSize = 9.sp, color = ZaLoTextSecondary)
                                            }
                                        }
                                    }
                                }
                            }

                            item {
                                Text("التراخيص والاشتراكات المعلقة للحوالة", fontSize = 14.sp, fontWeight = FontWeight.Bold)
                            }
                            
                            // Mock showing of CCP receipts
                            item {
                                Card(
                                    colors = CardDefaults.cardColors(containerColor = ZaLoCardBG)
                                ) {
                                    Column(modifier = Modifier.padding(16.dp)) {
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween,
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Column {
                                                Text("حوالة CCP باقة Smart", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                                                Text("مقدمة من: متجر تيك مارشيه (4,500 DZD)", fontSize = 11.sp, color = ZaLoTextSecondary)
                                            }
                                            Button(
                                                onClick = {
                                                    viewModel.approveSubscriptionAdmin(subId = 1, merchantId = 2)
                                                },
                                                colors = ButtonDefaults.buttonColors(containerColor = ZaLoApproved),
                                                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 2.dp),
                                                modifier = Modifier.height(30.dp)
                                            ) {
                                                Text("قبول وتفعيل", fontSize = 10.sp)
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    "merchants" -> {
                        // --- Store Approval Center ---
                        Column(modifier = Modifier.fillMaxSize()) {
                            Text("فحص وتراخيص المحلات الجغرافية", fontSize = 16.sp, fontWeight = FontWeight.Bold)
                            Text("مراجعة السجل التجاري والوقوف على النشاط قبل قبول النشر", fontSize = 11.sp, color = ZaLoTextSecondary)

                            Spacer(modifier = Modifier.height(16.dp))

                            val pendingStores = allStores.filter { it.status == "PENDING" }
                            if (pendingStores.isEmpty()) {
                                Box(modifier = Modifier.fillMaxWidth().weight(1f), contentAlignment = Alignment.Center) {
                                    Text("لا توجد طلبات جديدة معلقة حالياً.", fontSize = 13.sp, color = ZaLoTextSecondary)
                                }
                            } else {
                                LazyColumn(
                                    verticalArrangement = Arrangement.spacedBy(10.dp),
                                    modifier = Modifier.weight(1f)
                                ) {
                                    items(pendingStores) { pendingStore ->
                                        Card(
                                            colors = CardDefaults.cardColors(containerColor = ZaLoCardBG)
                                        ) {
                                            Column(modifier = Modifier.padding(14.dp)) {
                                                Text(pendingStore.name, fontSize = 15.sp, fontWeight = FontWeight.Bold, color = ZaLoTextPrimary)
                                                Text("الوصف: ${pendingStore.description}", fontSize = 12.sp, color = ZaLoTextSecondary)
                                                Text("البلدية: ${pendingStore.commune} | الولاية: ${pendingStore.wilaya} | الفئة: ${pendingStore.category}", fontSize = 11.sp, color = ZaLoTextSecondary, modifier = Modifier.padding(top = 4.dp))

                                                Spacer(modifier = Modifier.height(12.dp))

                                                Row(
                                                    modifier = Modifier.fillMaxWidth(),
                                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                                ) {
                                                    Button(
                                                        onClick = { viewModel.updateStoreStatusAdmin(pendingStore.id, "APPROVED") },
                                                        colors = ButtonDefaults.buttonColors(containerColor = ZaLoApproved),
                                                        modifier = Modifier.weight(1f)
                                                    ) {
                                                        Text("قبول وترخيص", fontSize = 11.sp)
                                                    }

                                                    Button(
                                                        onClick = { viewModel.updateStoreStatusAdmin(pendingStore.id, "REJECTED") },
                                                        colors = ButtonDefaults.buttonColors(containerColor = ZaLoSuspended),
                                                        modifier = Modifier.weight(1f)
                                                    ) {
                                                        Text("رفض وطرد", fontSize = 11.sp)
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    "complaints" -> {
                        // --- complaints Resolution Tickets ---
                        Column(modifier = Modifier.fillMaxSize()) {
                            Text("قسم تسوية النزاعات والشكاوى", fontSize = 16.sp, fontWeight = FontWeight.Bold)
                            Text("استقبل شكاوى العملاء تبياناً للحق وحلها لضمان المعاملة الآمنة", fontSize = 11.sp, color = ZaLoTextSecondary)

                            Spacer(modifier = Modifier.height(16.dp))

                            val pendingComplaints = allComplaints.filter { it.status == "PENDING" }
                            if (pendingComplaints.isEmpty()) {
                                Box(modifier = Modifier.fillMaxWidth().weight(1f), contentAlignment = Alignment.Center) {
                                    Text("كل النزاعات والشكاوى مسواة بالكامل! 👍", fontSize = 13.sp, color = ZaLoTextSecondary)
                                }
                            } else {
                                LazyColumn(
                                    verticalArrangement = Arrangement.spacedBy(10.dp),
                                    modifier = Modifier.weight(1f)
                                ) {
                                    items(pendingComplaints) { comp ->
                                        Card(
                                            colors = CardDefaults.cardColors(containerColor = ZaLoCardBG)
                                        ) {
                                            Column(modifier = Modifier.padding(14.dp)) {
                                                Row(
                                                    modifier = Modifier.fillMaxWidth(),
                                                    horizontalArrangement = Arrangement.SpaceBetween,
                                                    verticalAlignment = Alignment.CenterVertically
                                                ) {
                                                    Text("الشاكي: ${comp.userName}", fontWeight = FontWeight.Bold)
                                                    Text("النزاع لطلب #${comp.orderId}", fontSize = 11.sp, color = ZaLoTextSecondary)
                                                }
                                                Spacer(modifier = Modifier.height(6.dp))
                                                Text("نص الشكوى: '${comp.message}'", fontSize = 13.sp, color = ZaLoTextPrimary)

                                                Spacer(modifier = Modifier.height(10.dp))

                                                Button(
                                                    onClick = { showResolveDialog = comp },
                                                    colors = ButtonDefaults.buttonColors(containerColor = ZaLoEmerald),
                                                    modifier = Modifier.fillMaxWidth()
                                                ) {
                                                    Text("حل النزاع وإصدار القرار", fontSize = 11.sp)
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    "users" -> {
                        // --- Users Directory Direct Moderations ---
                        Column(modifier = Modifier.fillMaxSize()) {
                            Text("إدارة مستخدمي نظام ZaLo", fontSize = 16.sp, fontWeight = FontWeight.Bold)
                            Text("تحكم في حسابات العملاء، البائعين المعتمدين والمستودعات والوقوف على العضويات الشاذة", fontSize = 11.sp, color = ZaLoTextSecondary)

                            Spacer(modifier = Modifier.height(16.dp))

                            LazyColumn(
                                verticalArrangement = Arrangement.spacedBy(10.dp),
                                modifier = Modifier.weight(1f)
                            ) {
                                items(allUsers) { appUser ->
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
                                                Text(appUser.name, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = ZaLoTextPrimary)
                                                Text(appUser.email, fontSize = 11.sp, color = ZaLoTextSecondary)
                                                Text("المجال: ${appUser.role} | النقاط ${appUser.loyaltyPoints}", fontSize = 11.sp, color = ZaLoEmeraldDark, fontWeight = FontWeight.Bold)
                                            }

                                            // Ban / penalty button
                                            if (appUser.role != "SUPER_ADMIN") {
                                                Button(
                                                    onClick = {
                                                        viewModel.suspendUserAdmin(appUser.id)
                                                    },
                                                    colors = ButtonDefaults.buttonColors(containerColor = ZaLoSuspended),
                                                    modifier = Modifier.height(30.dp),
                                                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 2.dp)
                                                ) {
                                                    Text("حظر العضوية", fontSize = 10.sp)
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    "audits" -> {
                        // --- Live Audit Trail Records Console ---
                        Column(modifier = Modifier.fillMaxSize()) {
                            Text("جداول مراجعة العمليات ونشاطات النظام", fontSize = 16.sp, fontWeight = FontWeight.Bold)
                            Text("سجلات مراجعة دقيقة لتدقيق الإجراءات ومعاملات التجار", fontSize = 11.sp, color = ZaLoTextSecondary)

                            Spacer(modifier = Modifier.height(16.dp))

                            LazyColumn(
                                verticalArrangement = Arrangement.spacedBy(8.dp),
                                modifier = Modifier.weight(1f)
                            ) {
                                items(allAuditLogs) { log ->
                                    Card(
                                        colors = CardDefaults.cardColors(containerColor = ZaLoCardBG)
                                    ) {
                                        Column(modifier = Modifier.padding(12.dp)) {
                                            Row(
                                                modifier = Modifier.fillMaxWidth(),
                                                horizontalArrangement = Arrangement.SpaceBetween
                                            ) {
                                                Text(log.actorName, fontWeight = FontWeight.Bold, fontSize = 12.sp, color = ZaLoNavy)
                                                Box(
                                                    modifier = Modifier
                                                        .clip(RoundedCornerShape(4.dp))
                                                        .background(ZaLoBackground)
                                                        .padding(horizontal = 6.dp, vertical = 2.dp)
                                                ) {
                                                    Text(log.action, fontSize = 9.sp, fontWeight = FontWeight.Bold)
                                                }
                                            }
                                            Text(log.details, fontSize = 12.sp, color = ZaLoTextPrimary, modifier = Modifier.padding(top = 4.dp))
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Resolve dispute dialogue overlay
    if (showResolveDialog != null) {
        val complaint = showResolveDialog!!
        AlertDialog(
            onDismissRequest = { showResolveDialog = null },
            title = { Text("حل نزاع لطلب رقم #${complaint.orderId}", fontSize = 14.sp, fontWeight = FontWeight.Bold) },
            text = {
                Column {
                    Text("رفع القرار أو الحل للإرسال النهائي للعميل الشاكي:", fontSize = 12.sp, color = ZaLoTextSecondary)
                    Spacer(modifier = Modifier.height(10.dp))
                    OutlinedTextField(
                        value = resolveResponseMsg,
                        onValueChange = { resolveResponseMsg = it },
                        modifier = Modifier.fillMaxWidth(),
                        placeholder = { Text("مثال: تم مراجعة الحوالة وتعويضك بالنقاط والمال المستحق...") }
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        viewModel.resolveComplaintAdmin(complaint.id, resolveResponseMsg)
                        showResolveDialog = null
                        resolveResponseMsg = ""
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = ZaLoApproved)
                ) {
                    Text("مسواة الشكوى وإرسال الإشعار")
                }
            },
            dismissButton = {
                TextButton(onClick = { showResolveDialog = null }) {
                    Text("إلغاء")
                }
            }
        )
    }
}

@Composable
fun AdminRailItem(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    label: String,
    isActive: Boolean,
    onClick: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(if (isActive) ZaLoEmerald else Color.Transparent)
            .clickable { onClick() }
            .padding(vertical = 12.dp, horizontal = 4.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(
            imageVector = icon,
            contentDescription = label,
            tint = if (isActive) Color.White else Color.White.copy(alpha = 0.5f),
            modifier = Modifier.size(22.dp)
        )
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = label,
            fontSize = 11.sp,
            color = if (isActive) Color.White else Color.White.copy(alpha = 0.5f),
            fontWeight = if (isActive) FontWeight.Bold else FontWeight.Normal,
            textAlign = TextAlign.Center,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
        )
    }
}
