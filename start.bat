@echo off
echo Starting Customer Management System...
echo.

echo Starting backend server...
start "Backend Server" cmd /k "cd server && npm start"

timeout /t 3 /nobreak >nul

echo Starting frontend client...
start "Frontend Client" cmd /k "cd client && npm start"

echo.
echo Both servers are starting...
echo Backend will be available at: http://localhost:5000
echo Frontend will be available at: http://localhost:3000
echo.
echo Press any key to exit...
pause >nul
