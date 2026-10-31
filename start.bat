@echo off
title Oversized T-Shirt 3D Mockup Studio - Offline Launcher
cd /d "%~dp0"

echo ====================================================================
echo   OVERSIZED T-SHIRT 3D MOCKUP STUDIO - OFFLINE LAUNCHER
echo ====================================================================
echo Starting offline studio...
echo.

:: 1. Check if Python is installed
python --version >nul 2>&1
if %errorlevel% == 0 (
    echo Python detected. Starting offline server...
    start "" http://localhost:8080
    python offline_server.py
    goto :done
)

:: 2. Fallback to Windows PowerShell built-in server (zero install required)
echo Launching via built-in Windows PowerShell HTTP server...
powershell -ExecutionPolicy Bypass -NoProfile -File "%~dp0server.ps1"

:done
pause
