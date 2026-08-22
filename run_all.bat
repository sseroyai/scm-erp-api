@echo off
REM ========================================================
REM  SCM ERP System (V5) - Launcher
REM  This batch file launches the PowerShell startup script
REM ========================================================

echo ========================================================
echo   SCM ERP System (V5) - Starting...
echo ========================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0run_all.ps1"
