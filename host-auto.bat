@echo off
title ProF Auto Host
echo ========================================
echo    ProF Automatic Global Hosting
echo ========================================
echo.

echo [1/5] Checking setup...
if not exist "package.json" echo ERROR: Wrong folder! && goto end
if not exist "ngrok.exe" echo ERROR: Run setup-ngrok.bat first! && goto end
echo ✅ Setup OK

echo.
echo [2/5] Cleaning up old processes...
taskkill /f /im ngrok.exe >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :9002 2^>nul') do taskkill /PID %%a /F >nul 2>&1
echo ✅ Cleanup done

echo.
echo [3/5] Testing ngrok...
.\ngrok.exe version > ngrok-test.txt 2>&1
if exist "ngrok-test.txt" (
    type ngrok-test.txt
    del ngrok-test.txt
    echo ✅ Ngrok works
) else (
    echo ❌ Ngrok test failed
    goto end
)

echo.
echo [4/5] Starting development server...
start /min "Dev-Server" cmd /c "npm run dev > server.log 2>&1"
echo ✅ Server starting (check server.log for details)

echo.
echo [5/5] Starting ngrok tunnel...
start "Ngrok-Tunnel" cmd /k ".\ngrok.exe http 9002"
echo ✅ Ngrok starting

echo.
echo ========================================
echo   🌍 GLOBAL HOSTING IN PROGRESS!
echo ========================================
echo.
echo Two windows should be opening:
echo 1. Development server (minimized) - running your app
echo 2. Ngrok tunnel - shows your public URL
echo.
echo Your public URL will be in the ngrok window
echo Format: https://xxxxx.ngrok-free.app
echo.
echo Local URL: http://localhost:9002
echo.
start http://localhost:9002
echo Opening local app in browser...
echo.

:end
echo Press any key to exit...
pause >nul