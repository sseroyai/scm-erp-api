# ========================================================
# SCM ERP System - Startup Script (PowerShell)
# Automatically detects Python and Node.js install paths
# ========================================================

$ErrorActionPreference = "Continue"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  SCM ERP System (V5) - Starting All Services" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

# ----------------------------------------------------------------
# Auto-detect Python / pip
# ----------------------------------------------------------------
$pythonDirs = @()

# 1) Check current PATH
$pythonInPath = Get-Command python -ErrorAction SilentlyContinue
if ($pythonInPath) {
    $pythonDirs += Split-Path $pythonInPath.Source
    $scriptsDir = Join-Path (Split-Path $pythonInPath.Source) "Scripts"
    if (Test-Path $scriptsDir) { $pythonDirs += $scriptsDir }
    Write-Host "[OK] Python found in PATH: $($pythonInPath.Source)" -ForegroundColor Green
}

# 2) Check py launcher
if (-not $pythonInPath) {
    $pyLauncher = Get-Command py -ErrorAction SilentlyContinue
    if ($pyLauncher) {
        # Use py launcher to find actual python path
        try {
            $pyPath = & py -c "import sys; print(sys.executable)" 2>$null
            if ($pyPath -and (Test-Path $pyPath)) {
                $pythonDirs += Split-Path $pyPath
                $scriptsDir = Join-Path (Split-Path $pyPath) "Scripts"
                if (Test-Path $scriptsDir) { $pythonDirs += $scriptsDir }
                Write-Host "[OK] Python found via py launcher: $pyPath" -ForegroundColor Green
            }
        } catch {}
    }
}

# 3) Search common install locations
if ($pythonDirs.Count -eq 0) {
    $pythonSearchPaths = @(
        "$env:LOCALAPPDATA\Programs\Python\Python*",
        "C:\Python*",
        "$env:USERPROFILE\anaconda3",
        "$env:USERPROFILE\miniconda3",
        "$env:LOCALAPPDATA\anaconda3",
        "$env:LOCALAPPDATA\miniconda3",
        "C:\ProgramData\anaconda3",
        "C:\ProgramData\miniconda3",
        "$env:USERPROFILE\AppData\Local\Microsoft\WindowsApps"
    )
    foreach ($searchPath in $pythonSearchPaths) {
        $found = Get-ChildItem -Path $searchPath -ErrorAction SilentlyContinue | Sort-Object Name -Descending | Select-Object -First 1
        if ($found) {
            $testExe = if ($found.PSIsContainer) { Join-Path $found.FullName "python.exe" } else { $found.FullName }
            $testDir = if ($found.PSIsContainer) { $found.FullName } else { Split-Path $found.FullName }
            if (Test-Path $testExe) {
                $pythonDirs += $testDir
                $scriptsDir = Join-Path $testDir "Scripts"
                if (Test-Path $scriptsDir) { $pythonDirs += $scriptsDir }
                Write-Host "[OK] Python found at: $testDir" -ForegroundColor Green
                break
            }
        }
    }
}

if ($pythonDirs.Count -eq 0) {
    Write-Host "[ERROR] Python not found! Please install Python and add to PATH." -ForegroundColor Red
    Write-Host "        Download: https://www.python.org/downloads/" -ForegroundColor Red
    Write-Host ""
}

# ----------------------------------------------------------------
# Auto-detect Node.js / npm
# ----------------------------------------------------------------
$nodeDirs = @()

# 1) Check current PATH
$npmInPath = Get-Command npm -ErrorAction SilentlyContinue
if ($npmInPath) {
    $nodeDirs += Split-Path $npmInPath.Source
    Write-Host "[OK] npm found in PATH: $($npmInPath.Source)" -ForegroundColor Green
} else {
    $nodeInPath = Get-Command node -ErrorAction SilentlyContinue
    if ($nodeInPath) {
        $nodeDirs += Split-Path $nodeInPath.Source
        Write-Host "[OK] Node.js found in PATH: $($nodeInPath.Source)" -ForegroundColor Green
    }
}

# 2) Search common install locations
if ($nodeDirs.Count -eq 0) {
    $nodeSearchPaths = @(
        "C:\Program Files\nodejs",
        "C:\Program Files (x86)\nodejs",
        "$env:APPDATA\nvm\v*",
        "$env:LOCALAPPDATA\fnm_multishells\*",
        "$env:APPDATA\npm"
    )
    foreach ($searchPath in $nodeSearchPaths) {
        $candidates = Get-ChildItem -Path $searchPath -ErrorAction SilentlyContinue | Sort-Object Name -Descending
        if ($candidates) {
            foreach ($c in $candidates) {
                $testDir = if ($c.PSIsContainer) { $c.FullName } else { Split-Path $c.FullName }
                $npmCmd = Join-Path $testDir "npm.cmd"
                $npmExe = Join-Path $testDir "npm"
                if ((Test-Path $npmCmd) -or (Test-Path $npmExe)) {
                    $nodeDirs += $testDir
                    Write-Host "[OK] npm found at: $testDir" -ForegroundColor Green
                    break
                }
            }
        } elseif (Test-Path $searchPath) {
            $npmCmd = Join-Path $searchPath "npm.cmd"
            if (Test-Path $npmCmd) {
                $nodeDirs += $searchPath
                Write-Host "[OK] npm found at: $searchPath" -ForegroundColor Green
            }
        }
        if ($nodeDirs.Count -gt 0) { break }
    }
}

# Also add npm global path
$npmGlobal = "$env:APPDATA\npm"
if (Test-Path $npmGlobal) { $nodeDirs += $npmGlobal }

if ($nodeDirs.Count -eq 0) {
    Write-Host "[ERROR] Node.js/npm not found! Please install Node.js and add to PATH." -ForegroundColor Red
    Write-Host "        Download: https://nodejs.org/" -ForegroundColor Red
    Write-Host ""
}

# ----------------------------------------------------------------
# Build extended PATH for child processes
# ----------------------------------------------------------------
$allExtraDirs = ($pythonDirs + $nodeDirs) | Select-Object -Unique
$extraPathStr = ($allExtraDirs -join ";")

if ($extraPathStr) {
    $setPathCmd = "set `"PATH=$extraPathStr;%PATH%`" && "
} else {
    $setPathCmd = ""
}

Write-Host ""

# Stop if critical tools are missing
if ($pythonDirs.Count -eq 0 -or $nodeDirs.Count -eq 0) {
    Write-Host "========================================================" -ForegroundColor Red
    Write-Host "  Cannot start: Missing required tools (see above)" -ForegroundColor Red
    Write-Host "========================================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Press any key to exit..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

# ----------------------------------------------------------------
# [1/3] Backend - FastAPI (Port 8000)
# ----------------------------------------------------------------
Write-Host "[1/3] Starting Backend API Server (Port 8000)..." -ForegroundColor Yellow
$backendDir = Join-Path $scriptDir "backend"
$backendCmd = "${setPathCmd}cd /d `"$backendDir`" && pip install -r requirements.txt && python seed.py && python -m uvicorn main:app --reload --port 8000"
Start-Process cmd.exe -ArgumentList "/k $backendCmd"

# ----------------------------------------------------------------
# [2/3] Frontend - Vite React (Port 3000)
# ----------------------------------------------------------------
Write-Host "[2/3] Starting Frontend Dev Server (Port 3000)..." -ForegroundColor Yellow
$frontendDir = Join-Path $scriptDir "frontend"
$frontendCmd = "${setPathCmd}cd /d `"$frontendDir`" && npm install && npm run dev -- --port 3000"
Start-Process cmd.exe -ArgumentList "/k $frontendCmd"

# ----------------------------------------------------------------
# [3/3] Wait and open browser
# ----------------------------------------------------------------
Write-Host "[3/3] Waiting 10 seconds before opening browser..." -ForegroundColor Yellow
Write-Host "      (npm install may take longer on first run)" -ForegroundColor DarkGray
Start-Sleep -Seconds 10
Start-Process "http://localhost:3000"

Write-Host ""
Write-Host "========================================================" -ForegroundColor Green
Write-Host "  System started successfully!" -ForegroundColor Green
Write-Host "  Backend API Docs : http://localhost:8000/docs" -ForegroundColor Green
Write-Host "  Frontend Web App : http://localhost:3000" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
Write-Host ""
Write-Host "If the browser shows an error, wait a moment and refresh." -ForegroundColor DarkGray
Write-Host "Press any key to close this window..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
