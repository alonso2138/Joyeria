@echo off
REM Script de despliegue para Windows

echo 🚀 Desplegando Joyeria Aurora...

REM Detener contenedores existentes
echo ⏹️ Deteniendo contenedores existentes...
docker-compose down

REM Construir y levantar servicios
echo 🔨 Construyendo y levantando servicios...
docker-compose up --build -d

REM Esperar a que MongoDB este listo
echo ⏳ Esperando a que MongoDB este listo...
timeout /t 10 /nobreak >nul

REM Verificar estado de los servicios
echo ✅ Verificando estado de los servicios...
docker-compose ps

echo.
echo 🎉 ¡Despliegue completado!
echo.
echo 📱 Frontend: http://localhost
echo 🔧 Backend API: http://localhost:5000
echo 🗄️ MongoDB: localhost:27017
echo.
echo 📋 Para ver los logs:
echo    docker-compose logs -f
echo.
echo 🛑 Para detener:
echo    docker-compose down

pause
