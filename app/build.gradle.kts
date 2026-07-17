plugins {
  alias(libs.plugins.android.application)
  alias(libs.plugins.kotlin.compose)
  alias(libs.plugins.google.devtools.ksp)
  alias(libs.plugins.roborazzi)
  alias(libs.plugins.secrets)
}

android {
  namespace = "com.example"
  compileSdk { version = release(36) { minorApiLevel = 1 } }

  defaultConfig {
    applicationId = "com.zalo.marketplace"
    minSdk = 24
    targetSdk = 36
    versionCode = 1
    versionName = "1.0"

    testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"

    // Define GEMINI_API_KEY dynamically from environment variables
    val geminiKey = System.getenv("GEMINI_API_KEY") ?: ""
    buildConfigField("String", "GEMINI_API_KEY", "\"$geminiKey\"")
  }

  signingConfigs {
    create("release") {
      val keystorePath = System.getenv("KEYSTORE_PATH") ?: "${rootDir}/my-upload-key.jks"
      storeFile = file(keystorePath)
      storePassword = System.getenv("STORE_PASSWORD")
      keyAlias = "upload"
      keyPassword = System.getenv("KEY_PASSWORD")
    }
    create("debugConfig") {
      val keystoreFile = file("${rootDir}/debug.keystore")
      if (keystoreFile.exists()) {
        storeFile = keystoreFile
      } else {
        storeFile = file("${rootDir}/build.gradle.kts")
      }
      storePassword = "android"
      keyAlias = "androiddebugkey"
      keyPassword = "android"
    }
  }

  buildTypes {
    release {
      isCrunchPngs = false
      isMinifyEnabled = false
      proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
      if (System.getenv("GITHUB_ACTIONS") == "true") {
        signingConfig = null
      } else {
        signingConfig = signingConfigs.getByName("release")
      }
    }
    debug {
      if (System.getenv("GITHUB_ACTIONS") == "true") {
        signingConfig = null
      } else {
        signingConfig = signingConfigs.getByName("debugConfig")
      }
    }
  }
  compileOptions {
    sourceCompatibility = JavaVersion.VERSION_11
    targetCompatibility = JavaVersion.VERSION_11
  }
  buildFeatures {
    compose = true
    buildConfig = true
  }
  testOptions { unitTests { isIncludeAndroidResources = true } }
}

// Configure the Secrets Gradle Plugin to use .env
// to match the convention used in Web projects.
secrets {
  propertiesFileName = ".env"
}

// Some unused dependencies are commented out below instead of being removed.
// This makes it easy to add them back in the future if needed.
dependencies {
  implementation(libs.androidx.webkit)
  implementation(platform(libs.androidx.compose.bom))
  // implementation(libs.accompanist.permissions)
  implementation(libs.androidx.activity.compose)
  // implementation(libs.androidx.camera.camera2)
  // implementation(libs.androidx.camera.core)
  // implementation(libs.androidx.camera.lifecycle)
  // implementation(libs.androidx.camera.view)
  implementation(libs.androidx.compose.material.icons.core)
  implementation(libs.androidx.compose.material.icons.extended)
  implementation(libs.androidx.compose.material3)
  implementation(libs.androidx.compose.ui)
  implementation(libs.androidx.compose.ui.graphics)
  implementation(libs.androidx.compose.ui.tooling.preview)
  implementation(libs.androidx.core.ktx)
  // implementation(libs.androidx.datastore.preferences)
  implementation(libs.androidx.lifecycle.runtime.compose)
  // libs.androidx.lifecycle.runtime.ktx is usually imported
  implementation(libs.androidx.lifecycle.runtime.ktx)
  implementation(libs.androidx.lifecycle.viewmodel.compose)
  implementation(libs.androidx.navigation.compose)
  implementation(libs.androidx.room.ktx)
  implementation(libs.androidx.room.runtime)
  implementation(libs.coil.compose)
  implementation(libs.converter.moshi)
  implementation(libs.kotlinx.coroutines.android)
  implementation(libs.kotlinx.coroutines.core)
  implementation(libs.logging.interceptor)
  implementation(libs.moshi.kotlin)
  implementation(libs.okhttp)
  // implementation(libs.play.services.location)
  implementation(libs.play.services.auth)
  implementation(libs.retrofit)
  testImplementation(libs.androidx.compose.ui.test.junit4)
  testImplementation(libs.androidx.core)
  testImplementation(libs.androidx.junit)
  testImplementation(libs.junit)
  testImplementation(libs.kotlinx.coroutines.test)
  testImplementation(libs.robolectric)
  testImplementation(libs.roborazzi)
  testImplementation(libs.roborazzi.compose)
  testImplementation(libs.roborazzi.junit.rule)
  androidTestImplementation(platform(libs.androidx.compose.bom))
  androidTestImplementation(libs.androidx.compose.ui.test.junit4)
  androidTestImplementation(libs.androidx.espresso.core)
  androidTestImplementation(libs.androidx.junit)
  androidTestImplementation(libs.androidx.runner)
  debugImplementation(libs.androidx.compose.ui.test.manifest)
  debugImplementation(libs.androidx.compose.ui.tooling)
  "ksp"(libs.androidx.room.compiler)
  "ksp"(libs.moshi.kotlin.codegen)
}

// Capture final files outside of closure to prevent serialization issues with the Gradle Configuration Cache
val rootDirFile = rootDir
val projectDirFile = projectDir
val localConfigFile = file("${projectDirFile}/src/main/assets/web/js/supabase-config.js")
val localAdminFile = file("${projectDirFile}/src/main/assets/web/admin.html")
val localEnvFile = file("${rootDirFile}/.env")

// Automatically copy master web assets from root ./web directory to app/src/main/assets/web on every build
val copyWebAssets by tasks.registering(Sync::class) {
    notCompatibleWithConfigurationCache("Custom task uses dynamic script execution to inject secrets.")
    from(file("${rootDirFile}/web"))
    into(file("${projectDirFile}/src/main/assets/web"))

    doLast {
        var supabaseUrl = ""
        var supabaseKey = ""

        // Try reading from local .env file first
        if (localEnvFile.exists()) {
            localEnvFile.readLines().forEach { line ->
                val parts = line.split("=", limit = 2)
                if (parts.size == 2) {
                    val key = parts[0].trim()
                    val value = parts[1].trim().removeSurrounding("\"").removeSurrounding("'")
                    if (key == "SUPABASE_URL" && supabaseUrl.isEmpty()) {
                        supabaseUrl = value
                    } else if (key == "SUPABASE_KEY" && supabaseKey.isEmpty()) {
                        supabaseKey = value
                    }
                }
            }
        }

        // Fall back to system environment variables if not defined in .env
        if (supabaseUrl.isEmpty()) {
            supabaseUrl = System.getenv("SUPABASE_URL") ?: ""
        }
        if (supabaseKey.isEmpty()) {
            supabaseKey = System.getenv("SUPABASE_KEY") ?: ""
        }

        // Inject the actual credentials into the web asset copy for the Android build
        if (localConfigFile.exists()) {
            var content = localConfigFile.readText()
            if (supabaseUrl.isNotEmpty() && supabaseKey.isNotEmpty()) {
                content = content.replace("SUPABASE_URL_PLACEHOLDER", supabaseUrl)
                content = content.replace("SUPABASE_KEY_PLACEHOLDER", supabaseKey)
            }
            val geminiKey = System.getenv("GEMINI_API_KEY") ?: ""
            if (geminiKey.isNotEmpty()) {
                content = content.replace("GEMINI_API_KEY_PLACEHOLDER", geminiKey)
            }
            localConfigFile.writeText(content)
            println("🔒 [Security Audit] Successfully injected Supabase credentials and Gemini API Key into web assets.")
        }

        if (localAdminFile.exists() && supabaseUrl.isNotEmpty() && supabaseKey.isNotEmpty()) {
            var content = localAdminFile.readText()
            content = content.replace("SUPABASE_URL_PLACEHOLDER", supabaseUrl)
            content = content.replace("SUPABASE_KEY_PLACEHOLDER", supabaseKey)
            localAdminFile.writeText(content)
            println("🔒 [Security Audit] Successfully injected Supabase URL and Key into admin.html.")
        }
    }
}

tasks.matching { it.name.startsWith("preBuild") }.configureEach {
    dependsOn(copyWebAssets)
}

tasks.register<Sync>("syncWebAssets") {
    from("$projectDir/../web/")
    into("$projectDir/src/main/assets/web/")
    include("**/*.html", "**/*.js", "**/*.css", "**/*.json")
}
tasks.named("preBuild") { dependsOn("syncWebAssets") }



