@echo off
echo ========================================
echo   AI Stock Market Analyzer
echo   Starting Backend + Frontend...
echo ========================================

:: Start Backend
echo.
echo [1/2] Starting Backend (FastAPI) on port 8000...
cd /d "%~dp0backend"
start "Backend - FastAPI" cmd /k "pip install -r requirements.txt >NUL 2>NUL && python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"

:: Start Frontend
echo [2/2] Starting Frontend (React) on port 5173...
cd /d "%~dp0frontend"
start "Frontend - React" cmd /k "npm run dev"

echo.
echo ========================================
echo   Backend:  http://localhost:8000
echo   API Docs: http://localhost:8000/docs
echo   Frontend: http://localhost:5173
echo ========================================
echo.
echo Close this window when done.
pause
