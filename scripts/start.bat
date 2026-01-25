@echo off
REM ==================================
REM SCRIPT DE INICIO RÁPIDO - WINDOWS
REM Newbie System
REM ==================================

echo.
echo 🚀 Iniciando Newbie System...
echo.

REM Verificar Docker
where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Docker no está instalado. Por favor instálalo primero.
    pause
    exit /b 1
)

REM Crear archivo .env si no existe
if not exist ".env" (
    echo 📝 Creando archivo .env desde .env.example...
    copy .env.example .env
    echo.
    echo ⚠️  Por favor, edita el archivo .env con tus configuraciones.
    echo    Especialmente: DB_PASSWORD y JWT_SECRET
    echo.
    set /p CONTINUE="¿Deseas continuar con valores por defecto? (S/N): "
    if /i not "%CONTINUE%"=="S" (
        echo Edita .env y vuelve a ejecutar este script.
        pause
        exit /b 0
    )
)

echo.
echo 📦 Construyendo imágenes Docker...
docker-compose build

echo.
echo 🔄 Iniciando servicios...
docker-compose up -d

echo.
echo ⏳ Esperando a que los servicios estén listos...
timeout /t 30 /nobreak

echo.
echo ============================================
echo 🎉 ¡Newbie System está iniciando!
echo ============================================
echo.
echo 📍 URL del sistema:     http://localhost:3000
echo 📍 API Backend:         http://localhost:8080
echo.
echo 🔐 Credenciales iniciales:
echo    Email:      admin@newbie.com
echo    Contraseña: Admin123!
echo.
echo ⚠️  IMPORTANTE: Cambia la contraseña después del primer login
echo.
echo 📋 Comandos útiles:
echo    docker-compose logs -f      # Ver logs
echo    docker-compose stop         # Detener servicios
echo    docker-compose down         # Detener y eliminar contenedores
echo ============================================
echo.
pause
