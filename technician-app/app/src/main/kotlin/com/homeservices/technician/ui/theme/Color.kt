package com.homeservices.technician.ui.theme

import androidx.compose.material3.ColorScheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.ui.graphics.Color

public val BrandBlue: Color = Color(0xFF0B5FEE)
public val BrandBlueDark: Color = Color(0xFF4F87FF)

public val LightColors: ColorScheme =
    lightColorScheme(
        primary = BrandBlue,
        onPrimary = Color.White,
        background = Color(0xFFFDFDFD),
        onBackground = Color(0xFF1A1A1A),
        surface = Color.White,
        onSurface = Color(0xFF1A1A1A),
    )

public val DarkColors: ColorScheme =
    darkColorScheme(
        primary = BrandBlueDark,
        onPrimary = Color(0xFF001E4F),
        background = Color(0xFF101217),
        onBackground = Color(0xFFF2F2F2),
        surface = Color(0xFF1A1D24),
        onSurface = Color(0xFFF2F2F2),
    )
