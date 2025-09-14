@echo off
echo Starting MeZoom Video Conferencing Application...
echo.

echo Installing dependencies...
call npm run install-all

echo.
echo Starting the application...
call npm run dev

pause
