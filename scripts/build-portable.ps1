#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Builds the portable VideoGists.exe and deploys it to the programs folder.

.DESCRIPTION
    Runs a Tauri release build WITHOUT any installers (--no-bundle), producing a
    single portable executable. The previous build in the destination folder is
    removed first, then the fresh exe is copied over.

.PARAMETER Destination
    Target folder for the portable exe.
    Defaults to C:\Users\jjpfs\Meine Ablage\Daten\Informatik\Programme\VideoGists.

.EXAMPLE
    .\scripts\build-portable.ps1
#>

[CmdletBinding()]
param(
    [string]$Destination = 'C:\Users\jjpfs\Meine Ablage\Daten\Informatik\Programme\VideoGists'
)

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $repoRoot

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
