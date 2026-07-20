package com.zalo.marketplace

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.webkit.WebViewAssetLoader
import androidx.webkit.WebViewAssetLoader.AssetsPathHandler
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.viewinterop.AndroidView
import com.zalo.marketplace.ui.theme.MyApplicationTheme
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInClient
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.common.api.ApiException

class MainActivity : ComponentActivity() {

    private var filePathCallback: ValueCallback<Array<Uri>>? = null
    var currentWebView: WebView? = null
    private var googleSignInClient: GoogleSignInClient? = null

    private val fileChooserLauncher = registerForActivityResult(
        androidx.activity.result.contract.ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            val data: Intent? = result.data
            val results = if (data != null) {
                if (data.dataString != null) {
                    arrayOf(Uri.parse(data.dataString))
                } else if (data.clipData != null) {
                    val clipData = data.clipData!!
                    Array(clipData.itemCount) { i -> clipData.getItemAt(i).uri }
                } else {
                    null
                }
            } else {
                null
            }
            filePathCallback?.onReceiveValue(results)
        } else {
            filePathCallback?.onReceiveValue(null)
        }
        filePathCallback = null
    }

    private val googleSignInLauncher = registerForActivityResult(
        androidx.activity.result.contract.ActivityResultContracts.StartActivityForResult()
    ) { result ->
        val web = currentWebView
        if (result.resultCode == Activity.RESULT_OK) {
            val task = GoogleSignIn.getSignedInAccountFromIntent(result.data)
            try {
                val account = task.getResult(ApiException::class.java)
                val idToken = account?.idToken
                if (idToken != null) {
                    web?.post {
                        web.evaluateJavascript("javascript:if(typeof window.onGoogleIdTokenReceived === 'function') { window.onGoogleIdTokenReceived('$idToken'); } else { console.log('onGoogleIdTokenReceived not found on window'); }", null)
                    }
                } else {
                    Toast.makeText(this, "فشل الحصول على رمز تعريف جوجل الآمن", Toast.LENGTH_LONG).show()
                    web?.post {
                        web.evaluateJavascript("javascript:if(typeof window.onGoogleIdTokenFailed === 'function') { window.onGoogleIdTokenFailed('id_token_null'); }", null)
                    }
                }
            } catch (e: ApiException) {
                Toast.makeText(this, "حدث خطأ في مصادقة جوجل: " + e.statusCode, Toast.LENGTH_LONG).show()
                val code = e.statusCode.toString()
                web?.post {
                    web.evaluateJavascript("javascript:if(typeof window.onGoogleIdTokenFailed === 'function') { window.onGoogleIdTokenFailed('$code'); }", null)
                }
            }
        } else {
            web?.post {
                web.evaluateJavascript("javascript:if(typeof window.onGoogleIdTokenFailed === 'function') { window.onGoogleIdTokenFailed('cancelled'); }", null)
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Clear webview console log file for a fresh start
        try {
            val logFile = java.io.File(cacheDir, "webview_console.log")
            if (logFile.exists()) {
                logFile.delete()
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        
        // Pre-create the WebView Code Cache directories to prevent Chromium opendir error logs
        try {
            val codeCacheJsDir = java.io.File(cacheDir, "WebView/Default/HTTP Cache/Code Cache/js")
            if (!codeCacheJsDir.exists()) {
                codeCacheJsDir.mkdirs()
            }
            val codeCacheWasmDir = java.io.File(cacheDir, "WebView/Default/HTTP Cache/Code Cache/wasm")
            if (!codeCacheWasmDir.exists()) {
                codeCacheWasmDir.mkdirs()
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }

        enableEdgeToEdge()
        setContent {
            MyApplicationTheme {
                PureWebContainerScreen(
                    activity = this,
                    onOpenFileChooser = { callback, params ->
                        filePathCallback?.onReceiveValue(null)
                        filePathCallback = callback
                        try {
                            val intent = params?.createIntent() ?: Intent(Intent.ACTION_GET_CONTENT).apply {
                                type = "image/*"
                                addCategory(Intent.CATEGORY_OPENABLE)
                            }
                            fileChooserLauncher.launch(intent)
                        } catch (e: Exception) {
                            filePathCallback?.onReceiveValue(null)
                            filePathCallback = null
                        }
                    }
                )
            }
        }
    }

    fun startNativeGoogleSignIn() {
        var clientId = getString(R.string.google_web_client_id)
        if (clientId == "YOUR_WEB_CLIENT_ID_HERE" || clientId.isEmpty() || clientId.contains("dummy")) {
            // Fallback for zalo-marketplace-smart-final if dummy default is there, to allow elegant dev test
            clientId = "393402903971-7c521e8cb7b823d306be16.apps.googleusercontent.com"
        }

        val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestIdToken(clientId)
            .requestEmail()
            .build()

        googleSignInClient = GoogleSignIn.getClient(this, gso)
        googleSignInClient?.signOut()?.addOnCompleteListener {
            try {
                val signInIntent = googleSignInClient?.signInIntent
                if (signInIntent != null) {
                    googleSignInLauncher.launch(signInIntent)
                }
            } catch (e: Exception) {
                Toast.makeText(this, "فشل تهيئة واجهة الدخول لجوجل: ${e.message}", Toast.LENGTH_LONG).show()
            }
        }
    }
}

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun PureWebContainerScreen(
    activity: MainActivity,
    onOpenFileChooser: (ValueCallback<Array<Uri>>?, WebChromeClient.FileChooserParams?) -> Unit
) {
    var webView: WebView? by remember { mutableStateOf(null) }

    val assetLoader = remember {
        WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", AssetsPathHandler(activity))
            .build()
    }

    // Handle back button clicks to navigate backward in the WebView instead of exiting the app
    BackHandler(enabled = webView?.canGoBack() == true) {
        webView?.goBack()
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF080E0A)) // Matches ZaLo rich deep dark background #080e0a
            .systemBarsPadding()
    ) {
        AndroidView(
            modifier = Modifier.fillMaxSize(),
            factory = { context ->
                WebView(context).apply {
                    webViewClient = object : WebViewClient() {
                        override fun shouldOverrideUrlLoading(view: WebView?, url: String?): Boolean {
                            // Keep navigation internal to the WebView
                            return false
                        }

                        override fun shouldInterceptRequest(
                            view: WebView?,
                            request: android.webkit.WebResourceRequest?
                        ): android.webkit.WebResourceResponse? {
                            if (request != null) {
                                return assetLoader.shouldInterceptRequest(request.url)
                            }
                            return null
                        }

                        override fun onPageStarted(view: WebView?, url: String?, favicon: android.graphics.Bitmap?) {
                            super.onPageStarted(view, url, favicon)
                            // Let the page start loading so we can capture the full URL with hash fragment in onPageFinished
                        }

                        override fun onPageFinished(view: WebView?, url: String?) {
                            super.onPageFinished(view, url)
                            if (url != null) {
                                if (url.startsWith("http://") || url.startsWith("https://")) {
                                    if (!url.contains("appassets.androidplatform.net")) {
                                        val targetDomains = arrayOf(
                                            "hadi47hadi58-cmyk.github.io/ZaLo-marketplace-smart-/web/",
                                            "hadi47hadi58-cmyk.github.io/ZaLo-marketplace-smart-/",
                                            "hadi47hadi58-cmyk.github.io/"
                                        )
                                        var matchesDomain = false
                                        for (domain in targetDomains) {
                                            if (url.contains(domain)) {
                                                matchesDomain = true
                                                break
                                            }
                                        }
                                        if (matchesDomain) {
                                            // Query the full URL from JS to preserve hash fragment
                                            view?.evaluateJavascript("window.location.href") { fullUrl ->
                                                val cleanUrl = fullUrl?.removePrefix("\"")?.removeSuffix("\"")
                                                if (cleanUrl != null && cleanUrl.isNotEmpty() && cleanUrl != "null") {
                                                    val filename = when {
                                                        cleanUrl.contains("register-step1.html") -> "register-step1.html"
                                                        cleanUrl.contains("login-customer.html") -> "login-customer.html"
                                                        cleanUrl.contains("login.html") -> "login.html"
                                                        cleanUrl.contains("index.html") -> "index.html"
                                                        else -> "index.html" // Default callback target
                                                    }
                                                    val extraParams = when {
                                                        cleanUrl.contains("#") -> "#" + cleanUrl.substringAfter("#")
                                                        cleanUrl.contains("?") -> "?" + cleanUrl.substringAfter("?")
                                                        else -> ""
                                                    }
                                                    val localUrl = "https://appassets.androidplatform.net/assets/web/$filename$extraParams"
                                                    view?.stopLoading()
                                                    view?.loadUrl(localUrl)
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        override fun onReceivedError(
                            view: WebView?,
                            request: android.webkit.WebResourceRequest?,
                            error: android.webkit.WebResourceError?
                        ) {
                            super.onReceivedError(view, request, error)
                            val description = error?.description ?: "Unknown error"
                            val errorCode = error?.errorCode ?: 0
                            val urlStr = request?.url?.toString() ?: ""
                            android.util.Log.e("WebViewError", "Error loading URL $urlStr: $description ($errorCode)")
                        }
                    }
                    webChromeClient = object : WebChromeClient() {
                        override fun onShowFileChooser(
                            webView: WebView?,
                            filePathCallback: ValueCallback<Array<Uri>>?,
                            fileChooserParams: FileChooserParams?
                        ): Boolean {
                            onOpenFileChooser(filePathCallback, fileChooserParams)
                            return true
                        }

                        override fun onConsoleMessage(consoleMessage: android.webkit.ConsoleMessage?): Boolean {
                            consoleMessage?.let {
                                val logMsg = "[${it.messageLevel()}] ${it.message()} -- From ${it.sourceId()}:${it.lineNumber()}\n"
                                try {
                                    val logFile = java.io.File(activity.cacheDir, "webview_console.log")
                                    java.io.FileWriter(logFile, true).use { writer ->
                                        writer.write(logMsg)
                                    }
                                } catch (e: Exception) {
                                    e.printStackTrace()
                                }
                            }
                            return super.onConsoleMessage(consoleMessage)
                        }
                    }
                    clearCache(true)
                    try {
                        val jsDir = java.io.File(activity.cacheDir, "WebView/Default/HTTP Cache/Code Cache/js")
                        if (!jsDir.exists()) {
                            jsDir.mkdirs()
                        }
                        val wasmDir = java.io.File(activity.cacheDir, "WebView/Default/HTTP Cache/Code Cache/wasm")
                        if (!wasmDir.exists()) {
                            wasmDir.mkdirs()
                        }
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                    settings.apply {
                        javaScriptEnabled = true
                        domStorageEnabled = true
                        allowFileAccess = true
                        allowContentAccess = true
                        allowFileAccessFromFileURLs = true
                        allowUniversalAccessFromFileURLs = true
                        databaseEnabled = true
                        loadWithOverviewMode = true
                        useWideViewPort = true
                        mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                        cacheMode = WebSettings.LOAD_NO_CACHE
                    }
                    addJavascriptInterface(WebAppInterface(activity, this), "AndroidInterface")
                    loadUrl("https://appassets.androidplatform.net/assets/web/splash.html")
                    webView = this
                    activity.currentWebView = this
                }
            },
            update = {
                webView = it
                activity.currentWebView = it
            }
        )
    }
}

class WebAppInterface(
    private val activity: MainActivity,
    private val webView: WebView
) {
    @android.webkit.JavascriptInterface
    fun requestGoogleSignIn() {
        activity.runOnUiThread {
            activity.startNativeGoogleSignIn()
        }
    }
}
