@echo off
setlocal
set PORT=9002
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
