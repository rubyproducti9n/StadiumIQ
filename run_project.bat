@echo off
title StadiumIQ Launcher
echo ==========================================================
echo               StadiumIQ Development Launcher
echo ==========================================================
echo.
echo [1/3] Checking Node.js dependencies...
call npm install --legacy-peer-deps
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] npm install failed. Please check your Node/npm setup.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/3] Launching your web browser to http://localhost:5173...
:: Launch browser after a brief delay to let the dev server bind
start "" "http://localhost:5173"

echo.
echo [3/3] Starting Vite development server...
echo.
echo [INFO] Press Ctrl+C in this console to stop the server at any time.
echo.
call npm run dev
