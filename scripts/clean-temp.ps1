#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Deletes all disposable VideoGists build/cache directories.

.DESCRIPTION
    Removes only artifacts that are regenerated automatically on the next
    `npm install` / `npm run tauri dev|build`:
      - src-tauri\target\   (Rust build output)
      - dist\               (Vite frontend build output)
      - node_modules\       (npm dependencies)

    Use -KeepNodeModules to skip deleting node_modules (faster next build).

    Your data (gists.json) lives in the configured data folder, NOT in the
    repo, so it is never touched by this script.
#>

[CmdletBinding(SupportsShouldProcess)]
param(
    [switch]$KeepNodeModules
)

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path

$paths = @(
    (Join-Path $repoRoot 'src-tauri\target'),
    (Join-Path $repoRoot 'dist')
)
if (-not $KeepNodeModules) {
    $paths += (Join-Path $repoRoot 'node_modules')
}

foreach ($path in $paths) {
    if (-not (Test-Path $path)) {
        Write-Host "skip $path" -ForegroundColor DarkGray
        continue
    }
    if ($PSCmdlet.ShouldProcess($path, 'Remove disposable directory')) {
        Write-Host "rm   $path" -ForegroundColor Yellow
        Remove-Item -Recurse -Force $path
    }
}

Write-Host 'Done.' -ForegroundColor Green
