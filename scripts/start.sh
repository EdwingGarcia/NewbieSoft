#!/bin/bash
# ==================================
# SCRIPT DE INICIO RÁPIDO
# Newbie System
# ==================================

set -e

echo "🚀 Iniciando Newbie System..."
echo ""

# Verificar Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker no está instalado. Por favor instálalo primero."
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose no está instalado."
    exit 1
fi

# Crear archivo .env si no existe
if [ ! -f ".env" ]; then
    echo "📝 Creando archivo .env desde .env.example..."
    cp .env.example .env
    echo "⚠️  Por favor, edita el archivo .env con tus configuraciones antes de continuar."
    echo "   Especialmente: DB_PASSWORD y JWT_SECRET"
    echo ""
    read -p "¿Deseas continuar con valores por defecto? (s/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        echo "Edita .env y vuelve a ejecutar este script."
        exit 0
    fi
fi

echo ""
echo "📦 Construyendo imágenes Docker..."
docker-compose build

echo ""
echo "🔄 Iniciando servicios..."
docker-compose up -d

echo ""
echo "⏳ Esperando a que los servicios estén listos..."
sleep 10

# Verificar salud de servicios
echo ""
echo "🔍 Verificando servicios..."

# Check postgres
if docker-compose exec -T postgres pg_isready -U newbie_user -d newbie_db > /dev/null 2>&1; then
    echo "✅ PostgreSQL: OK"
else
    echo "⚠️  PostgreSQL: Iniciando..."
fi

# Check backend
echo "   Esperando al backend (puede tomar 60 segundos)..."
for i in {1..12}; do
    if curl -s http://localhost:8080/actuator/health > /dev/null 2>&1; then
        echo "✅ Backend: OK"
        break
    fi
    sleep 5
done

# Check frontend
echo "   Verificando frontend..."
sleep 5
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend: OK"
else
    echo "⚠️  Frontend: Puede tomar unos segundos más..."
fi

echo ""
echo "============================================"
echo "🎉 ¡Newbie System está listo!"
echo "============================================"
echo ""
echo "📍 URL del sistema:     http://localhost:3000"
echo "📍 API Backend:         http://localhost:8080"
echo ""
echo "🔐 Credenciales iniciales:"
echo "   Email:      admin@newbie.com"
echo "   Contraseña: Admin123!"
echo ""
echo "⚠️  IMPORTANTE: Cambia la contraseña después del primer login"
echo ""
echo "📋 Comandos útiles:"
echo "   docker-compose logs -f      # Ver logs"
echo "   docker-compose stop         # Detener servicios"
echo "   docker-compose down         # Detener y eliminar contenedores"
echo "============================================"
