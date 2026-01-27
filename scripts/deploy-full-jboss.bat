@echo off
REM Script para construir y desplegar backend y frontend en JBoss 7.2.2 (puerto 8082)

REM Configura estas variables según tu entorno
set "JBOSS_HOME=C:\jboss-eap-7.2.2"
set "WAR_NAME=backend.war"
set "PROJECT_DIR=%CD%\..\backend"
set "FRONTEND_DIR=%CD%\..\frontend"
set "WEBAPP_DIR=%PROJECT_DIR%\src\main\webapp"
set "DEPLOY_DIR=%JBOSS_HOME%\standalone\deployments"

REM 1. Limpiar webapp (excepto WEB-INF si existe)
if exist "%WEBAPP_DIR%" (
    for /d %%i in ("%WEBAPP_DIR%\*") do if /i not "%%~nxi"=="WEB-INF" rmdir /s /q "%%i"
    for %%i in ("%WEBAPP_DIR%\*") do if /i not "%%~nxi"=="WEB-INF" del /q "%%i"
) else (
    mkdir "%WEBAPP_DIR%"
)

REM 2. Construir el frontend
cd /d "%FRONTEND_DIR%"
call npm install
call npm run build
if errorlevel 1 (
    echo Error en la construcción del frontend
    exit /b 1
)

REM 3. Copiar el build del frontend a webapp
xcopy /E /I /Y "%FRONTEND_DIR%\.next\static" "%WEBAPP_DIR%\static"
xcopy /E /I /Y "%FRONTEND_DIR%\public" "%WEBAPP_DIR%\public"
REM Puedes agregar más rutas si tu build genera otros directorios relevantes

REM 4. Construir el backend (genera el .war)
cd /d "%PROJECT_DIR%"
call mvnw clean package -DskipTests
if errorlevel 1 (
    echo Error en la construcción del backend
    exit /b 1
)

REM 5. Copiar el .war generado al directorio de despliegue de JBoss
copy /Y "%PROJECT_DIR%\target\*.war" "%DEPLOY_DIR%\%WAR_NAME%"
if errorlevel 1 (
    echo Error al copiar el archivo WAR
    exit /b 1
)

echo Despliegue completado. Si es necesario, reinicia JBoss manualmente o automatiza el reinicio.
REM Para reiniciar JBoss, descomenta la siguiente línea si usas el script standalone
REM call "%JBOSS_HOME%\bin\jboss-cli.bat" --connect command=:reload

REM NOTA: Asegúrate de que JBoss esté configurado para escuchar en el puerto 8082 (standalone.xml)
