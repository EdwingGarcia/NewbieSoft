# 🚀 Guía de Despliegue - Newbie System

## 📋 Requisitos Previos

### Software
- **Java 21** (JDK)
- **Node.js 18+** y npm
- **PostgreSQL 15+**
- **Docker** (opcional, para contenedores)

### Hardware Mínimo
- CPU: 2 cores
- RAM: 4 GB
- Almacenamiento: 20 GB

---

## 🗄️ Configuración de Base de Datos

### 1. Crear la base de datos PostgreSQL

```sql
-- Conectar a PostgreSQL como superusuario
CREATE DATABASE newbie_db;
CREATE USER newbie_user WITH ENCRYPTED PASSWORD 'tu_contraseña_segura';
GRANT ALL PRIVILEGES ON DATABASE newbie_db TO newbie_user;
\c newbie_db
GRANT ALL ON SCHEMA public TO newbie_user;
```

### 2. Configurar variables de entorno

```bash
# Backend
export DATABASE_URL=jdbc:postgresql://localhost:5432/newbie_db
export DATABASE_USERNAME=newbie_user
export DATABASE_PASSWORD=tu_contraseña_segura
export JWT_SECRET=tu_clave_jwt_muy_segura_de_al_menos_32_caracteres

# Frontend
export NEXT_PUBLIC_API_URL=http://localhost:8080
```

### 3. Ejecutar script de inicialización

```bash
# Conectar a la base de datos y ejecutar
psql -U newbie_user -d newbie_db -f scripts/init-database.sql
```

---

## 🔧 Backend (Spring Boot)

### Configuración

1. **Editar `application.properties`** o usar variables de entorno:

```properties
# Base de datos
spring.datasource.url=${DATABASE_URL:jdbc:postgresql://localhost:5432/newbie_db}
spring.datasource.username=${DATABASE_USERNAME:postgres}
spring.datasource.password=${DATABASE_PASSWORD:postgres}

# JWT
jwt.secret=${JWT_SECRET:clave-secreta-cambiar-en-produccion}
jwt.expiration=86400000

# Email (configurar después desde la UI de admin)
spring.mail.host=smtp.gmail.com
spring.mail.port=587
```

2. **Crear archivo `application-prod.properties`**:

```properties
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=false
logging.level.root=WARN
logging.level.com.newbie=INFO
```

### Compilar y ejecutar

```bash
cd backend

# Compilar
./mvnw clean package -DskipTests

# Ejecutar
java -jar -Dspring.profiles.active=prod target/newbiecore-0.0.1-SNAPSHOT.jar
```

### Con Docker

```bash
cd backend
docker build -t newbie-backend .
docker run -d \
  --name newbie-backend \
  -p 8080:8080 \
  -e DATABASE_URL=jdbc:postgresql://host:5432/newbie_db \
  -e DATABASE_USERNAME=newbie_user \
  -e DATABASE_PASSWORD=tu_contraseña \
  -e JWT_SECRET=tu_clave_jwt \
  newbie-backend
```

---

## 🎨 Frontend (Next.js)

### Configuración

1. **Crear archivo `.env.production`**:

```env
NEXT_PUBLIC_API_URL=https://tu-dominio.com/api
```

### Compilar y ejecutar

```bash
cd frontend

# Instalar dependencias
npm install

# Compilar para producción
npm run build

# Ejecutar
npm start
```

### Con Docker

```bash
cd frontend
docker build -t newbie-frontend .
docker run -d \
  --name newbie-frontend \
  -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=https://tu-dominio.com/api \
  newbie-frontend
```

---

## 🐳 Docker Compose (Recomendado)

Crear archivo `docker-compose.yml` en la raíz:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    container_name: newbie-db
    environment:
      POSTGRES_DB: newbie_db
      POSTGRES_USER: newbie_user
      POSTGRES_PASSWORD: ${DB_PASSWORD:-postgres}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init-database.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U newbie_user -d newbie_db"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build: ./backend
    container_name: newbie-backend
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      DATABASE_URL: jdbc:postgresql://postgres:5432/newbie_db
      DATABASE_USERNAME: newbie_user
      DATABASE_PASSWORD: ${DB_PASSWORD:-postgres}
      JWT_SECRET: ${JWT_SECRET:-cambiar-esta-clave-en-produccion}
      SPRING_PROFILES_ACTIVE: prod
    ports:
      - "8080:8080"

  frontend:
    build: ./frontend
    container_name: newbie-frontend
    depends_on:
      - backend
    environment:
      NEXT_PUBLIC_API_URL: http://backend:8080
    ports:
      - "3000:3000"

volumes:
  postgres_data:
```

### Ejecutar con Docker Compose

```bash
# Crear archivo .env con las variables
echo "DB_PASSWORD=tu_contraseña_segura" > .env
echo "JWT_SECRET=tu_clave_jwt_muy_segura_de_al_menos_32_caracteres" >> .env

# Iniciar todos los servicios
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener
docker-compose down
```

---

## ☁️ Despliegue en la Nube

### AWS

1. **RDS PostgreSQL** para la base de datos
2. **ECS/EC2** para los contenedores
3. **ALB** para balanceo de carga
4. **Route 53** para DNS

### DigitalOcean

1. **Managed PostgreSQL** para DB
2. **App Platform** para backend y frontend
3. **Spaces** para almacenamiento de archivos

### Railway / Render

```bash
# Railway - Deploy directo desde GitHub
railway login
railway init
railway add postgres
railway up
```

---

## 🔐 Credenciales Iniciales

| Campo | Valor |
|-------|-------|
| **URL** | http://localhost:3000 |
| **Email** | admin@newbie.com |
| **Contraseña** | Admin123! |

⚠️ **IMPORTANTE**: Cambiar la contraseña del administrador inmediatamente después del primer login.

---

## ✅ Verificación Post-Despliegue

1. **Acceder al sistema**: http://tu-dominio:3000
2. **Login con credenciales de admin**
3. **Verificar dashboard carga correctamente**
4. **Configurar email** desde panel de administración
5. **Crear usuarios técnicos** según necesidad

---

## 🔧 Comandos Útiles

```bash
# Ver logs del backend
docker logs -f newbie-backend

# Conectar a la DB
docker exec -it newbie-db psql -U newbie_user -d newbie_db

# Reiniciar servicios
docker-compose restart

# Actualizar a nueva versión
git pull
docker-compose build
docker-compose up -d
```

---

## 📞 Soporte

Para soporte técnico contactar a: soporte@newbie.com
