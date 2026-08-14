@echo off
echo.
echo  ========================================
echo   GenCopilot — Deploy to Cloudflare
echo  ========================================
echo.

:: Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo  ERROR: Node.js not found. Install from https://nodejs.org
    pause
    exit /b 1
)

:: Install if needed
if not exist "node_modules" (
    echo  Installing dependencies...
    call npm install
    echo.
)

:: Build
echo  Building...
call npm run build
echo.

:: Login check + deploy
echo  Deploying to Cloudflare...
call npx wrangler deploy
echo.
echo  ========================================
echo   DONE! Your site should be live.
echo  ========================================
echo.
pause
