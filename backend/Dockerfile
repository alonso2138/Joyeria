# Dockerfile para el backend
FROM node:18-alpine

WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production

# Copiar el código fuente
COPY . .

# Compilar TypeScript
RUN npm run build

# Crear directorio para uploads
RUN mkdir -p uploads/jewelry

# Exponer el puerto
EXPOSE 5000

# Comando para iniciar la aplicación
CMD ["npm", "start"]
