@echo off
chcp 65001 >nul
title Cue Deep Unveil Restore Tool
echo ====================================================
echo        Cue Deep Unveil Restore Utility
echo ====================================================
echo.

where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not found in PATH!
    pause
    exit /b 1
)

node "%~dp0restore.js" %*

echo.
pause
