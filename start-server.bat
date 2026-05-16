@echo off
REM Running a local web server for testing PWA
REM Requirements: Python 3 installed

echo.
echo ========================================
echo  Local web server for Gantt Pro PWA
echo ========================================
echo.

REM Check Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python not installed or not added to PATH
    echo.
    echo Download Python from: https://www.python.org/downloads/
    echo .
    pause
    exit /b 1
)

echo Ok! Python found
echo.
echo Starting the server on http://localhost:8000
echo Press Ctrl+C to stop
echo.

cd /d "%~dp0"

REM Try Python 3
python -m http.server 8000

if %errorlevel% neq 0 (
    REM Try Python 2
    python -m SimpleHTTPServer 8000
)

if %errorlevel% neq 0 (
    echo ERROR: Failed to start server
    pause
    exit /b 1
)
