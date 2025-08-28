@echo off
echo Running npm run dev, logging to dev.log
set LOGFILE=%~dp0dev.log
if exist "%LOGFILE%" del "%LOGFILE%"
echo Starting at %DATE% %TIME%>> "%LOGFILE%"
npm run dev > "%LOGFILE%" 2>&1
echo. >> "%LOGFILE%"
echo EXIT CODE: %ERRORLEVEL% >> "%LOGFILE%"
echo === END OF LOG === >> "%LOGFILE%"
echo.
type "%LOGFILE%"
echo.
pause
