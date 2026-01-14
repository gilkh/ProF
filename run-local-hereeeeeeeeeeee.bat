@echo off
setlocal
set PORT=9002

REM ============================================
REM Check if Node.js is installed
REM ============================================
echo Checking for Node.js installation...
where node >nul 2>&1
if %ERRORLEVEL% EQU 0 (
	for /f "tokens=*" %%v in ('node --version') do set NODE_VERSION=%%v
	echo Node.js is already installed: !NODE_VERSION!
	goto :node_ready
)

REM Node.js not found - check for local portable version
set NODE_DIR=%~dp0node
set NODE_EXE=%NODE_DIR%\node.exe
if exist "%NODE_EXE%" (
	echo Found local portable Node.js installation.
	set PATH=%NODE_DIR%;%PATH%
	goto :node_ready
)

REM Download portable Node.js
echo Node.js not found. Downloading portable Node.js LTS...
set NODE_VERSION=v20.11.0
set NODE_ZIP=node-%NODE_VERSION%-win-x64.zip
set NODE_URL=https://nodejs.org/dist/%NODE_VERSION%/%NODE_ZIP%

echo Downloading from %NODE_URL%...
powershell -Command "Invoke-WebRequest -Uri '%NODE_URL%' -OutFile '%~dp0%NODE_ZIP%'" 2>nul
if ERRORLEVEL 1 (
	echo Failed to download Node.js. Please install Node.js manually from https://nodejs.org/
	pause
	endlocal
	exit /b 1
)

echo Extracting Node.js...
powershell -Command "Expand-Archive -Path '%~dp0%NODE_ZIP%' -DestinationPath '%~dp0' -Force" 2>nul
if ERRORLEVEL 1 (
	echo Failed to extract Node.js.
	pause
	endlocal
	exit /b 1
)

REM Rename extracted folder to "node"
if exist "%~dp0node-%NODE_VERSION%-win-x64" (
	rename "%~dp0node-%NODE_VERSION%-win-x64" node
)

REM Clean up zip file
del "%~dp0%NODE_ZIP%" 2>nul

REM Add to PATH for this session
set PATH=%NODE_DIR%;%PATH%
echo Node.js installed successfully!

:node_ready
setlocal enabledelayedexpansion
for /f "tokens=*" %%v in ('node --version') do echo Using Node.js %%v
endlocal

echo.
echo Checking for processes listening on port %PORT%...
set FOUND=0
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :%PORT%') do (
	set FOUND=1
	echo Found process using port %PORT% with PID %%a - terminating...
	taskkill /PID %%a /F >nul 2>&1
	if %%ERRORLEVEL%% EQU 0 (
		echo Process %%a terminated.
	) else (
		echo Failed to terminate PID %%a or it already exited.
	)
)
if "%FOUND%"=="0" (
	echo No process found on port %PORT%.
)

echo.
echo Installing dependencies, this may take a moment...
call npm install
if ERRORLEVEL 1 (
	echo.
	echo npm install failed. Please review the output above.
	pause
	endlocal
	exit /b 1
)

echo.
echo Starting the development server in a new window...
echo Your app will be available at http://localhost:%PORT%
echo.
REM Open a new cmd window and keep it open with /k so logs stay visible
start "ProF Dev" cmd /k "npm run dev > dev.log 2>&1 || echo npm run dev exited with an error & echo. & echo --- Full log (dev.log) --- & type dev.log & echo. & echo Press any key to close this window... & pause"
endlocal
