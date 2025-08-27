@echo off
echo Installing dependencies, this may take a moment...
call npm install
echo.
echo Starting the development server...
echo Your app will be available at http://localhost:9002
echo.
call npm run dev
