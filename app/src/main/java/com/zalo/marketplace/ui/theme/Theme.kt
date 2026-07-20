package com.zalo.marketplace.ui.theme

import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalContext

private val DarkColorScheme =
  darkColorScheme(
    primary = ZaLoEmerald,
    secondary = ZaLoGold,
    tertiary = ZaLoEmeraldLight,
    background = ZaLoNavy,
    surface = ZaLoNavyLight,
    onPrimary = ZaLoTextWhite,
    onSecondary = ZaLoNavy,
    onBackground = ZaLoTextWhite,
    onSurface = ZaLoTextWhite
  )

private val LightColorScheme =
  lightColorScheme(
    primary = ZaLoEmerald,
    secondary = ZaLoGold,
    tertiary = ZaLoEmeraldDark,
    background = ZaLoBackground,
    surface = ZaLoCardBG,
    onPrimary = ZaLoTextWhite,
    onSecondary = ZaLoTextPrimary,
    onBackground = ZaLoTextPrimary,
    onSurface = ZaLoTextPrimary
  )

@Composable
fun MyApplicationTheme(
  darkTheme: Boolean = isSystemInDarkTheme(),
  // Set default dynamicColor to false to keep ZaLo emerald/navy brand consistent
  dynamicColor: Boolean = false,
  content: @Composable () -> Unit,
) {
  val colorScheme =
    when {
      dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
        val context = LocalContext.current
        if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
      }

      darkTheme -> DarkColorScheme
      else -> LightColorScheme
    }

  MaterialTheme(colorScheme = colorScheme, typography = Typography, content = content)
}
