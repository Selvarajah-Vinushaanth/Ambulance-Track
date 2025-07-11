@echo off
echo 🚑 Setting up Ambulance Booking App...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 16+ first.
    pause
    exit /b 1
)

REM Install dependencies
echo 📦 Installing dependencies...
npm install

cd server
npm install
cd ..

REM Copy environment file
if not exist server\.env (
    copy server\.env.example server\.env
    echo 📝 Created .env file. Please update with your configuration.
)

REM Create start script
echo @echo off > start.bat
echo echo 🚀 Starting Ambulance Booking App... >> start.bat
echo. >> start.bat
echo REM Start backend >> start.bat
echo start /b cmd /c "cd server && npm start" >> start.bat
echo. >> start.bat
echo REM Wait for server to start >> start.bat
echo timeout /t 5 /nobreak >> start.bat
echo. >> start.bat
echo REM Start frontend >> start.bat
echo start /b cmd /c "npm start" >> start.bat
echo. >> start.bat
echo echo ✅ Both servers are starting... >> start.bat
echo echo Frontend: http://localhost:3000 >> start.bat
echo echo Backend: http://localhost:5000 >> start.bat
echo echo. >> start.bat
echo echo Press Ctrl+C to stop both servers >> start.bat
echo pause >> start.bat

echo ✅ Setup complete!
echo.
echo 🎯 Next steps:
echo 1. Update server\.env with your configuration
echo 2. Make sure MongoDB is running: mongod
echo 3. Start the app: start.bat
echo    OR start manually:
echo    - Backend: cd server ^&^& npm start
echo    - Frontend: npm start
echo.
echo 📱 Access the app at:
echo    - Frontend: http://localhost:3000
echo    - Backend API: http://localhost:5000
echo.
echo 👥 Test accounts to create:
echo    - Patient: Register with role 'patient'
echo    - Driver: Register with role 'driver'
echo    - Admin: Register with role 'admin'
echo.
pause
