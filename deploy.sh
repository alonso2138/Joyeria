#!/bin/bash

# Script de despliegue para Docker
echo "🚀 Desplegando..."

# Detener contenedores existentes
echo "⏹️ Deteniendo contenedores existentes..."
docker-compose down

# Construir y levantar servicios
echo "🔨 Construyendo y levantando servicios..."
docker-compose up --build -d

# Esperar a que MongoDB esté listo
echo "⏳ Esperando a que MongoDB esté listo..."
sleep 10

# Verificar estado de los servicios
echo "✅ Verificando estado de los servicios..."
docker-compose ps

echo ""
echo "🎉 ¡Despliegue completado!"
echo ""
echo "📱 Frontend: http://localhost"
echo "🔧 Backend API: http://localhost:5000"
echo "🗄️ MongoDB: localhost:27017"
echo ""
echo "📋 Para ver los logs:"
echo "   docker-compose logs -f"
echo ""
echo "🛑 Para detener:"
echo "   docker-compose down"
