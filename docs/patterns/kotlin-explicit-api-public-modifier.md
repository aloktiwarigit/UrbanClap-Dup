# Pattern: Kotlin Explicit API Mode — Public Modifier Required
**Stack:** Android / Kotlin / `-Xexplicit-api=strict`
**Story source:** E01-S03 + E02-S01 (enforced across all Android stories)
**Last updated:** 2026-04-19
**Recurrence risk:** Medium — affects every story adding new Kotlin files with public declarations

## The Trap

This project uses `-Xexplicit-api=strict` in all Android Gradle modules. In this mode, every declaration that is intended to be accessible outside its file **must carry an explicit `public` modifier**. Kotlin's default visibility is public, but the compiler will emit an error — treated as `-Werror` — if you rely on that implicit default.

Common symptoms:
- `Visibility must be specified in explicit API mode` compile error
- ktlint `MissingExplicitModifiers` warning (promoted to error by `-Werror`)
- Test classes fail with the same error: JUnit 5 test methods and the class itself need `public`

## The Solution

Always add `public` to:
- `class`, `data class`, `sealed class`, `interface`, `object`, `enum class`
- `fun` declarations in non-private classes
- `val`/`var` properties accessed by other classes
- Test classes and their `@Test` methods

```kotlin
// ✅ Correct
public data class AuthResult(val userId: String)

public sealed class OtpSendResult {
    public data class CodeSent(val verificationId: String) : OtpSendResult()
    public object AutoVerified : OtpSendResult()
}

// ✅ Correct test class
public class SessionManagerTest {
    @Test
    public fun `session is persisted across restarts`() { /* ... */ }
}

// ❌ Wrong — will fail with "Visibility must be specified"
data class AuthResult(val userId: String)
class SessionManagerTest {
    @Test
    fun `session is persisted across restarts`() { /* ... */ }
}
```

## Pre-commit Check

Add explicit modifiers before running `ktlintCheck`:
```bash
./gradlew ktlintFormat  # auto-fix most formatting issues
./gradlew ktlintCheck   # verify clean
```

ktlint's `trailing-comma-on-call-site` and `MissingExplicitModifiers` rules surface these before CI.

## CI Gate

`ktlintCheck` task in `pre-codex-smoke.sh` [step 2] and in `customer-ship.yml` — fails with `MissingExplicitModifiers` if any public declaration lacks an explicit modifier.

## Do Not

- Do not rely on Kotlin's implicit `public` visibility — the compiler will reject it under `-Xexplicit-api=strict`.
- Do not add `@Suppress("MissingExplicitModifiers")` to new files — fix the modifier instead.
- Do not confuse this with Java's `public` requirement — Kotlin normally doesn't require it, but this project does.
