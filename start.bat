@echo off
title DocuSupport AI - RAG Customer Support Server
echo ========================================================
echo   Starting DocuSupport AI RAG Customer Support Chatbot
echo ========================================================
echo.

:: Check Python installation
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH.
    pause
    exit /b
)

:: Install backend requirements if needed
echo [*] Checking dependencies...
python -m pip install -q -r backend\requirements.txt

:: Build frontend if dist doesn't exist
if not exist "frontend\dist" (
    echo [*] Building frontend static assets...
    cd frontend
    call npm install
    call npm run build
    cd ..
)

echo.
echo [*] Launching unified DocuSupport server on http://localhost:5000
echo [*] Press Ctrl+C in this terminal window to stop the server.
echo.

:: Launch browser in 3 seconds
start "" cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:5000"

:: Start Flask server
python backend\app.py
pause
