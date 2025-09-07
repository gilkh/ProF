@echo off
echo ===============================================
echo       ProF - Vercel Global Deployment
echo ===============================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if npm is available
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm is not available
    pause
    exit /b 1
)

echo Step 1: Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo Step 2: Running type check...
call npm run typecheck
if %errorlevel% neq 0 (
    echo WARNING: TypeScript errors found, but continuing with deployment...
    echo You may want to fix these before deploying to production
)

echo.
echo Step 3: Testing build locally...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build failed! Please fix the errors before deploying.
    pause
    exit /b 1
)

echo.
echo Step 4: Checking if Vercel CLI is installed...
vercel --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Vercel CLI not found. Installing globally...
    call npm install -g vercel
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install Vercel CLI
        pause
        exit /b 1
    )
)

echo.
echo Step 5: Deploying to Vercel...
echo Note: If this is your first time, you'll need to:
echo - Login to Vercel (will open browser)
echo - Link this project to your Vercel account
echo - Configure environment variables if needed
echo.

call vercel --prod
if %errorlevel% neq 0 (
    echo ERROR: Deployment failed
    pause
    exit /b 1
)

echo.
echo ===============================================
echo     Deployment completed successfully!
echo ===============================================
echo.
echo Your app should now be live on Vercel.
echo Check your Vercel dashboard for the live URL.
echo.
pause