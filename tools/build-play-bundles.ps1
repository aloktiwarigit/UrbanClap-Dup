param(
    [switch]$Clean
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot

$apps = @(
    @{
        Name = "customer"
        Prefix = "CUSTOMER"
        Directory = Join-Path $repoRoot "customer-app"
        Bundle = "app\build\outputs\bundle\release\app-release.aab"
    },
    @{
        Name = "technician"
        Prefix = "TECHNICIAN"
        Directory = Join-Path $repoRoot "technician-app"
        Bundle = "app\build\outputs\bundle\release\app-release.aab"
    }
)

function Read-LocalProperties($path) {
    $properties = @{}
    if (-not (Test-Path -LiteralPath $path)) {
        return $properties
    }

    foreach ($line in Get-Content -LiteralPath $path) {
        $trimmed = $line.Trim()
        if ($trimmed.Length -eq 0 -or $trimmed.StartsWith("#")) {
            continue
        }

        $parts = $trimmed -split "=", 2
        if ($parts.Count -eq 2 -and $parts[0].Trim().Length -gt 0) {
            $properties[$parts[0].Trim()] = $parts[1].Trim()
        }
    }

    return $properties
}

function Get-ReleaseProperty($properties, $prefix, $name) {
    $prefixedName = "${prefix}_${name}"
    $prefixedEnv = [Environment]::GetEnvironmentVariable($prefixedName)
    if (-not [string]::IsNullOrWhiteSpace($prefixedEnv)) {
        return $prefixedEnv
    }

    $env = [Environment]::GetEnvironmentVariable($name)
    if (-not [string]::IsNullOrWhiteSpace($env)) {
        return $env
    }

    if ($properties.ContainsKey($prefixedName) -and -not [string]::IsNullOrWhiteSpace($properties[$prefixedName])) {
        return $properties[$prefixedName]
    }

    if ($properties.ContainsKey($name) -and -not [string]::IsNullOrWhiteSpace($properties[$name])) {
        return $properties[$name]
    }

    return $null
}

function Assert-SigningConfig($app) {
    $propertiesPath = Join-Path $app.Directory "local.properties"
    $properties = Read-LocalProperties $propertiesPath
    $required = @(
        "RELEASE_STORE_FILE",
        "RELEASE_STORE_PASSWORD",
        "RELEASE_KEY_ALIAS",
        "RELEASE_KEY_PASSWORD"
    )

    $missing = @()
    foreach ($name in $required) {
        $value = Get-ReleaseProperty $properties $app.Prefix $name
        if ([string]::IsNullOrWhiteSpace($value)) {
            $missing += $name
        }
    }

    if ($missing.Count -gt 0) {
        throw "Missing release signing values for $($app.Name)-app: $($missing -join ', '). Add them to $propertiesPath or set $($app.Prefix)_* env vars."
    }

    $storeFile = Get-ReleaseProperty $properties $app.Prefix "RELEASE_STORE_FILE"
    if ([IO.Path]::IsPathRooted($storeFile)) {
        $storePath = $storeFile
    } else {
        $storePath = Join-Path $app.Directory $storeFile
    }

    if (-not (Test-Path -LiteralPath $storePath -PathType Leaf)) {
        throw "Release keystore for $($app.Name)-app was not found at $storePath."
    }
}

foreach ($app in $apps) {
    Assert-SigningConfig $app

    $tasks = @()
    if ($Clean) {
        $tasks += "clean"
    }
    $tasks += ":app:bundleRelease"

    Push-Location $app.Directory
    try {
        Write-Host "Building $($app.Name)-app release bundle..."
        & ".\gradlew.bat" @tasks
        if ($LASTEXITCODE -ne 0) {
            throw "$($app.Name)-app Gradle build failed with exit code $LASTEXITCODE."
        }
    } finally {
        Pop-Location
    }

    $bundlePath = Join-Path $app.Directory $app.Bundle
    if (-not (Test-Path -LiteralPath $bundlePath -PathType Leaf)) {
        throw "$($app.Name)-app bundle was not created at $bundlePath."
    }

    Write-Host "$($app.Name)-app AAB: $bundlePath"
}
