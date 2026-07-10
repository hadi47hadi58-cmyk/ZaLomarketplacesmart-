package com.example.ui.screens

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
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
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.theme.*
import com.example.viewmodel.EcomViewModel
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AiCompanionScreen(
    viewModel: EcomViewModel,
    onBack: () -> Unit
) {
    val chatHistory by viewModel.aiChatHistory.collectAsState()
    val isChatLoading by viewModel.isChatLoading.collectAsState()
    val activeStore by viewModel.activeMerchantStore.collectAsState()
    
    var userMessage by remember { mutableStateOf("") }
    val listState = rememberLazyListState()
    val coroutineScope = rememberCoroutineScope()

    // Scroll to the bottom of the chat list whenever history changes
    LaunchedEffect(chatHistory.size) {
        if (chatHistory.isNotEmpty()) {
            listState.animateScrollToItem(chatHistory.size - 1)
        }
    }

    Scaffold(
        modifier = Modifier
            .fillMaxSize()
            .windowInsetsPadding(WindowInsets.safeDrawing),
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(34.dp)
                                .clip(RoundedCornerShape(8.dp))
                                .background(ZaLoEmerald),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Default.AutoAwesome, contentDescription = "AI", tint = ZaLoGold, modifier = Modifier.size(18.dp))
                        }
                        Spacer(modifier = Modifier.width(10.dp))
                        Column {
                            Text(
                                text = "مساعد ZaLo الذكي المتقدم",
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Black,
                                color = ZaLoEmerald
                            )
                            Text(
                                text = "تحليلات، تسويق، كتابة محتوى وعلاقات الزبائن",
                                fontSize = 10.sp,
                                color = ZaLoTextSecondary
                            )
                        }
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = ZaLoCardBG)
            )
        }
    ) { innerPadding ->

        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(ZaLoBackground)
                .padding(innerPadding)
        ) {
            
            // Helpful Quick Suggestion Topics
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(8.dp),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                // Quick prompt pills to assist
                val prompts = listOf(
                    "اكتب لي وصف هاتف ذكي",
                    "كيف أزيد مبيعاتي بالجزائر؟"
                )
                prompts.forEach { text ->
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(12.dp))
                            .background(ZaLoCardBG)
                            .border(1.dp, ZaLoEmerald.copy(alpha = 0.15f), RoundedCornerShape(12.dp))
                            .clickable {
                                viewModel.sendMessageToAiAssistant(text)
                            }
                            .padding(horizontal = 12.dp, vertical = 8.dp)
                    ) {
                        Text(text = text, fontSize = 10.sp, color = ZaLoEmeraldDark, fontWeight = FontWeight.Bold)
                    }
                }
            }

            // Message Bubble list scrollable
            LazyColumn(
                state = listState,
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(chatHistory) { (sender, msg) ->
                    val isUser = sender == "user"
                    Box(
                        modifier = Modifier.fillMaxWidth(),
                        contentAlignment = if (isUser) Alignment.CenterEnd else Alignment.CenterStart
                    ) {
                        Column(
                            horizontalAlignment = if (isUser) Alignment.End else Alignment.Start,
                            modifier = Modifier.fillMaxWidth(0.85f)
                        ) {
                            // Bubble
                            Box(
                                modifier = Modifier
                                    .clip(
                                        RoundedCornerShape(
                                            topStart = 16.dp,
                                            topEnd = 16.dp,
                                            bottomStart = if (isUser) 16.dp else 4.dp,
                                            bottomEnd = if (isUser) 4.dp else 16.dp
                                        )
                                    )
                                    .background(
                                        if (isUser) {
                                            Brush.linearGradient(colors = listOf(ZaLoEmerald, ZaLoEmeraldDark))
                                        } else {
                                            Brush.linearGradient(colors = listOf(ZaLoNavy, ZaLoNavyLight))
                                        }
                                    )
                                    .padding(14.dp)
                            ) {
                                Text(
                                    text = msg,
                                    fontSize = 13.sp,
                                    color = Color.White,
                                    lineHeight = 18.sp,
                                    textAlign = TextAlign.Start,
                                    modifier = Modifier.fillMaxWidth()
                                )
                            }
                            
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = if (isUser) "أنت" else "مساعد ZaLo Smart",
                                fontSize = 9.sp,
                                color = ZaLoTextSecondary,
                                modifier = Modifier.padding(horizontal = 4.dp)
                            )
                        }
                    }
                }

                if (isChatLoading) {
                    item {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.padding(8.dp)
                        ) {
                            CircularProgressIndicator(modifier = Modifier.size(16.dp), color = ZaLoEmerald, strokeWidth = 2.dp)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("جاري تفكير الذكاء الاصطناعي وبناء الاقتراحات الفعالة...", fontSize = 11.sp, color = ZaLoTextSecondary)
                        }
                    }
                }
            }

            // Input panel bottom bar
            Surface(
                tonalElevation = 8.dp,
                color = ZaLoCardBG,
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedTextField(
                        value = userMessage,
                        onValueChange = { userMessage = it },
                        modifier = Modifier
                            .weight(1f)
                            .testTag("ai_chat_input"),
                        placeholder = { Text("اطرح أي سؤال للمساعد المالي والوصفي...", fontSize = 12.sp) },
                        maxLines = 3,
                        colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = ZaLoEmerald)
                    )

                    IconButton(
                        onClick = {
                            if (userMessage.isNotBlank()) {
                                viewModel.sendMessageToAiAssistant(userMessage)
                                userMessage = ""
                            }
                        },
                        modifier = Modifier
                            .size(48.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .background(ZaLoEmerald)
                    ) {
                        Icon(Icons.Default.Send, contentDescription = "Send", tint = Color.White, modifier = Modifier.size(20.dp))
                    }
                }
            }
        }
    }
}
