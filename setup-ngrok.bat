@echo off
title Setup Ngrok for ProF

echo ========================================
echo        Ngrok Setup for ProF
echo ========================================
echo.

REM Check if ngrok already exists
if exist "ngrok.exe" (
    echo ✅ ngrok.exe already exists in this folder
    goto test_ngrok
)

echo Downloading ngrok...
echo This will download ngrok directly to your ProF folder.
echo.

REM Download ngrok using PowerShell
echo Downloading from ngrok.com...
powershell -Command "& {Write-Host 'Downloading ngrok...'; try { Invoke-WebRequest -Uri 'https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-windows-amd64.zip' -OutFile 'ngrok.zip' -UserAgent 'Mozilla/5.0'; Write-Host 'Extracting...'; Expand-Archive -Path 'ngrok.zip' -DestinationPath '.' -Force; Remove-Item 'ngrok.zip'; Write-Host 'Download complete!' } catch { Write-Host 'Download failed:' $_.Exception.Message } }"

REM Check if download was successful
if exist "ngrok.exe" (
    echo ✅ Ngrok downloaded successfully!
) else (
    echo ❌ Automatic download failed.
    echo.
    echo MANUAL DOWNLOAD:
    echo 1. Go to: https://ngrok.com/download
    echo 2. Download "Windows (64-bit)"
    echo 3. Extract ngrok.exe to this folder: %~dp0
    echo.
    start https://ngrok.com/download
    echo Press any key after you've downloaded and extracted ngrok.exe...
    pause >nul
    
    if exist "ngrok.exe" (
        echo ✅ Found ngrok.exe!
    ) else (
        echo ❌ Still can't find ngrok.exe
        echo Make sure you extracted it to: %~dp0
        pause
        exit /b 1
    )
)

:test_ngrok
echo.
echo Testing ngrok...
ngrok.exe version
if ERRORLEVEL 1 (
    echo ❌ Ngrok test failed
    pause
    exit /b 1
)

echo.
echo ========================================
echo           🎉 SETUP COMPLETE!
echo ========================================
echo.
echo ✅ Ngrok is ready to use
echo.
echo NEXT STEPS:
echo 1. Sign up FREE at: https://ngrok.com
echo 2. Get your authtoken from the dashboard
echo 3. Run this command: ngrok.exe authtoken YOUR_TOKEN
echo 4. Then run: host-global-simple.bat
echo.
echo Opening ngrok signup page...
start https://ngrok.com
echo.
echo Press any key to exit...
pause >nul