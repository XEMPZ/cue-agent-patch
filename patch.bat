@echo off
chcp 65001 >nul
title Cue Deep Unveil Patch Installer
echo ====================================================
echo        Cue Deep Unveil Hotfix Installer
echo ====================================================
echo.

where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not found in PATH!
    echo Please install Node.js (v18+) to proceed.
    pause
    exit /b 1
)

node "%~dp0patch.js" %*

echo.
pause
