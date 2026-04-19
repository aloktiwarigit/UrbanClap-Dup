# Migration from placeholder (delete by 2026-07-17 OR first human contributor onboarding, whichever first)

E01-S03 shipped both Android apps with a placeholder `BrandBlue Color(0xFF0B5FEE)` Material 3 theme — deliberately NOT the UX §5.1 deep-teal `#0E4F47` brand primary. Reason: E01-S03's scope was "prove the Compose theming path works"; the real tokens were left to E01-S04 (this story).

This module replaces the placeholder. The apps' `ui/theme/{Color,Theme,Type}.kt` files were deleted in this same PR; both apps now consume `com.homeservices.designsystem.theme.HomeservicesTheme` directly. Paparazzi goldens for both apps were re-recorded once and pixel-locked thereafter.

This file exists to onboard a future human contributor confused by the colour shift commit. Once 90 days have passed (2026-07-17) or a real human dev has been onboarded, `git rm` this file.
