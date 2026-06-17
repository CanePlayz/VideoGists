#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Template for the portable-build script.

.DESCRIPTION
    Copy this file to `build-portable.ps1` and adjust the default $Destination to
    your personal deploy path (e.g. a cloud-synced programs folder).
    `build-portable.ps1` is intentionally gitignored so personal paths aren't
    committed.

    Runs a Tauri release build WITHOUT any installers (--no-bundle), producing a
    single portable executable, then copies it to the destination folder
    (replacing the previous build).

.PARAMETER Destination
    Target folder for the portable exe. Defaults to .\dist-portable

.EXAMPLE
    .\scripts\build-portable.ps1
    .\scripts\build-portable.ps1 -Destination 'D:\Apps\VideoGists'
#>

[CmdletBinding()]
param(
    [string]$Destination = (Join-Path $PSScriptRoot '..\dist-portable')
)

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $repoRoot

# Ensure dependencies are present. `clean-temp.ps1` (or Drive sync) can remove
# node_modules / the tauri CLI, which would make the build fail with
# "Der Befehl 'tauri' konnte nicht gefunden werden". Install them if missing.
$tauriCli = Join-Path $repoRoot 'node_modules\.bin\tauri.cmd'
if (-not (Test-Path $tauriCli)) {
    Write-Host '==> node_modules missing or incomplete; running npm install...' -ForegroundColor Cyan
    & npm install
    if ($LASTEXITCODE -ne 0) { throw 'npm install failed' }
}

Write-Host '==> Building portable VideoGists.exe (no installer)...' -ForegroundColor Cyan
& npm run tauri build -- --no-bundle
if ($LASTEXITCODE -ne 0) { throw 'tauri build failed' }

$exeName = 'VideoGists.exe'
$builtExe = Join-Path $repoRoot "src-tauri\target\release\$exeName"
if (-not (Test-Path $builtExe)) {
    throw "Build finished but $builtExe was not found."
}

Write-Host "==> Deploying to $Destination" -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path $Destination | Out-Null

$targetExe = Join-Path $Destination $exeName
if (Test-Path $targetExe) {
    Write-Host "    rm  $targetExe" -ForegroundColor Yellow
    Remove-Item -Force $targetExe
}

Copy-Item -Path $builtExe -Destination $targetExe -Force
$size = (Get-Item $targetExe).Length
Write-Host ("    -> {0} ({1:N1} MiB)" -f $targetExe, ($size / 1MB)) -ForegroundColor Green
Write-Host 'Done.' -ForegroundColor Green
