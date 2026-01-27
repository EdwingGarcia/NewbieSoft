# 🎟️ NewbieSoft - Plataforma Integral de Gestión de Tickets

---

## 🗂️ Tabla de Contenidos
- [Descripción General](#descripción-general)
- [Arquitectura](#arquitectura)
- [Tecnologías Principales](#tecnologías-principales)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Instalación y Configuración](#instalación-y-configuración)
- [Despliegue en JBoss](#despliegue-en-jboss)
- [Variables de Entorno](#variables-de-entorno)
- [Scripts Útiles](#scripts-útiles)
- [Testing](#testing)
- [CI/CD](#cicd)
- [Estrategia de Ramas](#estrategia-de-ramas)
- [Ejemplos de Endpoints](#ejemplos-de-endpoints)
- [Preguntas Frecuentes (FAQ)](#preguntas-frecuentes-faq)
- [Resolución de Problemas](#resolución-de-problemas)
- [Glosario](#glosario)
- [Contribución](#contribución)
- [Licencia](#licencia)
- [Contacto y Soporte](#contacto-y-soporte)

---

## 📝 Descripción General
**NewbieSoft** es una plataforma robusta para la gestión de tickets, órdenes de trabajo y soporte técnico, diseñada para empresas que requieren trazabilidad, seguridad y escalabilidad. Incluye autenticación, gestión de usuarios, catálogo de servicios/productos, y un panel administrativo avanzado.

---

## 🏗️ Arquitectura

```
[ Usuario ]
    │
    ▼
[ Frontend (Next.js) ]
    │   (rutas relativas /api)
    ▼
[ Backend (Spring Boot, WAR) ]
    │
    ▼
[ JBoss EAP 7.2.2 ]
    │
    ▼
[ PostgreSQL ]
```
- **Frontend**: React + Next.js, TailwindCSS, rutas relativas para máxima portabilidad.
- **Backend**: Spring Boot, empaquetado como WAR, seguro y desacoplado.
- **Infraestructura**: Despliegue en JBoss EAP 7.2.2, base de datos PostgreSQL.

---

## 🚀 Tecnologías Principales
- ☕ Java 21, Spring Boot, Spring Security, JWT
- 🐘 PostgreSQL
- ⚛️ React 19, Next.js 15, TailwindCSS
- 🦾 JBoss EAP 7.2.2
- 🐳 Docker (opcional)
- 🛠️ Git, GitHub Actions (CI/CD)

---

## 📁 Estructura del Proyecto

```
NewbieSoft/
├── backend/           # Backend Java Spring Boot (WAR)
│   ├── src/
│   ├── pom.xml
│   └── ...
├── frontend/          # Frontend Next.js
│   ├── app/
│   ├── package.json
│   └── ...
├── scripts/           # Scripts de despliegue y base de datos
│   ├── deploy-full-jboss.bat
│   ├── init-database.sql
│   └── ...
├── docker-compose.yml # (Opcional)
├── docs/              # Documentación, diagramas, imágenes
└── README.md
```

---

## ⚙️ Instalación y Configuración

### 1. Clonar el repositorio
```bash
git clone https://github.com/EdwingGarcia/NewbieSoft.git
cd NewbieSoft
```

### 2. Configurar el Backend
- Edita `backend/src/main/resources/application.properties`:
  - Configura la URL, usuario y contraseña de la base de datos.
  - Configura credenciales de correo y otros servicios.
- Asegúrate de que el packaging en `pom.xml` sea `war`.

### 3. Configurar el Frontend
- Las llamadas al backend usan rutas relativas (`/api/...`).
- Variables de entorno opcionales en `.env` para desarrollo.

### 4. Instalar dependencias
```bash
cd frontend
npm install
cd ../backend
./mvnw clean install
```

---

## 🏁 Despliegue en JBoss

### 1. Requisitos
- ☕ Java JDK 21
- 🟩 Node.js (LTS)
- 🦾 JBoss EAP 7.2.2 en el puerto 8082
- 🐘 PostgreSQL

### 2. Despliegue Automático
```bash
cd scripts
./deploy-full-jboss.bat
```
- El script construye frontend y backend, y despliega el WAR en JBoss.
- Accede a la app en: `http://localhost:8082` o `http://<ip-servidor>:8082`

### 3. Despliegue Manual (opcional)
- Construye el WAR:
  ```bash
  cd backend
  ./mvnw clean package -DskipTests
  ```
- Copia el WAR generado en `backend/target/` a la carpeta `standalone/deployments` de JBoss.
- Reinicia JBoss.

---

## 🌱 Variables de Entorno
- **Backend**: Configura en `application.properties`.
- **Frontend**: Usa `.env` para desarrollo, pero en producción todo es relativo.

---

## 🧰 Scripts Útiles
- `scripts/deploy-full-jboss.bat`: Despliega todo en JBoss.
- `scripts/init-database.sql`: Inicializa la base de datos.
- `scripts/clean-database.sql`: Limpia la base de datos.

---

## 🧪 Testing
- **Backend**: Ejecuta pruebas con Maven:
  ```bash
  cd backend
  ./mvnw test
  ```
- **Frontend**: Agrega y ejecuta tests con tu framework favorito (Jest, React Testing Library, etc).

---

## 🔄 CI/CD
- El proyecto puede integrarse con GitHub Actions para automatizar builds, tests y despliegues.
- Ejemplo de flujo:
  - Push a rama `main` o `despliegue-*` → build y test automáticos.
  - Despliegue automático en entorno de staging o producción.

---

## 🌳 Estrategia de Ramas
- `main`: Rama principal, estable.
- `develop`: Integración de features.
- `feature/*`: Nuevas funcionalidades.
- `fix/*`: Correcciones de bugs.
- `despliegue-*`: Preparativos y scripts de despliegue.

---

## 🔗 Ejemplos de Endpoints

### Autenticación
```http
POST /api/auth/login
{
  "username": "usuario",
  "password": "contraseña"
}
```

### Listar Catálogo
```http
GET /api/catalogo
```

### Crear Orden
```http
POST /api/ordenes
{
  "clienteId": 1,
  "items": [ ... ]
}
```

### Descargar Documentos
```http
GET /api/ordenes/{numeroOrden}/documentos
```

---
## 🔗 Endpoints REST

### /api/usuarios
- **GET /** – Listar usuarios
- **POST /** – Crear usuario
- **GET /{cedula}** – Obtener usuario por cédula
- **PUT /{cedula}** – Actualizar usuario
- **DELETE /{cedula}** – Eliminar usuario
- **Autenticación:** Requiere autenticación

### /uploads
- **GET /*** – Descargar archivo seguro
- **Autenticación:** Requiere autenticación

### /roles
- **POST /** – Crear rol
- **GET /** – Listar roles
- **GET /{id}** – Obtener rol por ID
- **PUT /{id}** – Actualizar rol
- **DELETE /{id}** – Eliminar rol
- **Autenticación:** Requiere autenticación

### /api/pdf
- **POST /ficha** – Generar PDF de ficha técnica
- **Autenticación:** Requiere autenticación

### /api/otp
- **POST /generar** – Generar OTP
- **POST /validar** – Validar OTP
- **Autenticación:** Público

### /api/ordenes/{ordenId}/costos
- **POST /** – Agregar costo a orden
- **GET /** – Listar costos de orden
- **GET /totales** – Obtener totales de costos
- **PUT /{costoId}/cantidad** – Actualizar cantidad de costo
- **DELETE /{costoId}** – Eliminar costo
- **Autenticación:** Requiere autenticación

### /api/ordenes
- **POST /** – Crear orden de trabajo
- **GET /{numeroOrden}/documentos** – Descargar documentos de orden
- **GET /{id}/ingreso** – Obtener ingreso de orden
- **PUT /{id}/entrega** – Actualizar entrega
- **GET /{id}/detalle** – Obtener detalle de orden
- **POST /{id}/imagenes** – Subir imágenes a orden
- **GET /** – Listar órdenes
- **GET /{id}/imagenes** – Listar imágenes de orden
- **GET /mis-ordenes** – Listar órdenes del usuario autenticado
- **Autenticación:** Requiere autenticación

### /api/notificaciones
- **POST /ot/{otId}** – Enviar notificación de orden de trabajo
- **Autenticación:** Requiere autenticación

### /api/firmas
- **GET /estado/{numeroOrden}** – Obtener estado de firmas de una orden
- **POST /confirmacion** – Confirmar firma
- **POST /conformidad** – Firma de conformidad
- **Autenticación:** Requiere autenticación

### /api/fichas
- **POST /** – Crear ficha técnica
- **GET /cliente/{cedula}** – Listar fichas por cliente
- **GET /** – Listar todas las fichas
- **GET /{id}** – Obtener ficha por ID
- **GET /equipo/{equipoId}** – Listar fichas por equipo
- **GET /tecnico/{cedulaTecnico}** – Listar fichas por técnico
- **GET /orden-trabajo/{ordenTrabajoId}** – Buscar fichas por orden de trabajo
- **PUT /{id}/observaciones** – Actualizar observaciones
- **PUT /{id}** – Actualizar ficha completa
- **POST /{id}/refrescar-hardware** – Refrescar datos desde hardware
- **DELETE /{id}** – Eliminar ficha
- **Autenticación:** Requiere autenticación

### /api/equipos
- **POST /** – Registrar equipo
- **GET /** – Listar todos los equipos
- **GET /cliente/{cedula}** – Listar equipos por cliente
- **POST /** – Subir archivo hwinfo.xml
- **GET /{id}** – Obtener equipo por ID
- **GET /mis-equipos** – Listar equipos del usuario autenticado
- **Autenticación:** Requiere autenticación

### /api/documentos
- **GET /{numeroOrden}/documentos/{nombreArchivo}** – Obtener documento de orden
- **GET /{numeroOrden}/imagenes/{categoria}/{nombreArchivo}** – Obtener imagen por categoría
- **GET /{numeroOrden}/imagenes/{nombreArchivo}** – Obtener imagen
- **GET /{numeroOrden}/listar** – Listar documentos de orden
- **Autenticación:** Requiere autenticación

### /api/dashboard
- **GET /resumen** – Obtener resumen de dashboard
- **Autenticación:** Requiere autenticación

### /api/public/consultas
- **POST /otp** – Solicitar OTP para consulta
- **POST /otp/validar** – Validar OTP de consulta
- **POST /procedimiento** – Consultar procedimiento
- **POST /historial** – Consultar historial
- **Autenticación:** Público

### /api/v1/configurations
- **GET /** – Listar configuraciones (Solo ADMIN)
- **GET /list** – Listar configuraciones como lista (Solo ADMIN)
- **GET /category/{category}** – Configuraciones por categoría (Solo ADMIN)
- **GET /categories** – Listar categorías (Solo ADMIN)
- **GET /{id}** – Obtener configuración por ID (Solo ADMIN)
- **GET /search** – Buscar configuraciones (Solo ADMIN)
- **PUT /{id}** – Actualizar configuración (Solo ADMIN)
- **PUT /bulk** – Actualización masiva (Solo ADMIN)
- **GET /value/{key}** – Obtener valor de configuración (Solo SUPER_ADMIN)

### /api/v1/configurations/admin
- **POST /refresh** – Refrescar propiedades (Solo ADMIN)
- **GET /status** – Estado de configuración (Solo ADMIN)
- **GET /verify/{key}** – Verificar propiedad (Solo ADMIN)
- **POST /test-email** – Probar envío de email (Solo ADMIN)

### /api/citas
- **POST /agendar** – Agendar cita
- **GET /cliente/{clienteId}** – Citas por cliente
- **GET /tecnico/{tecnicoId}** – Citas por técnico
- **GET /todas** – Listar todas las citas
- **POST /{citaId}/completar** – Completar cita
- **Autenticación:** Requiere autenticación

### /api/catalogo
- **GET /** – Listar ítems de catálogo
- **POST /** – Crear ítem
- **PUT /{id}** – Actualizar ítem
- **DELETE /{id}** – Eliminar ítem
- **Autenticación:** Requiere autenticación

### /api/auth
- **POST /login** – Login (Público)
- **POST /refresh** – Refrescar token (Público)
- **POST /logout** – Logout (Requiere autenticación)
- **GET /ping** – Ping de salud (Público)

### /api/auditoria
- **GET /** – Listar logs de auditoría (Solo ADMIN)
- **GET /entidad/{tipoEntidad}** – Logs por tipo de entidad (Solo ADMIN)
- **GET /usuario/{username}** – Logs por usuario (Solo ADMIN)
- **GET /clave/{entityKey}** – Logs por clave de entidad (Solo ADMIN)
- **GET /rango** – Logs por rango de fechas (Solo ADMIN)
- **GET /orden/{numeroOrden}** – Historial de orden (ADMIN o TECNICO)
- **GET /estadisticas** – Estadísticas de auditoría (Solo ADMIN)
- **GET /configuracion** – Cambios de configuración (Solo ADMIN)
- **GET /accesos** – Registros de acceso (Solo ADMIN)

---
## ❓ Preguntas Frecuentes (FAQ)

**¿Por qué no se genera el .war?**
- Verifica que el packaging en pom.xml sea `war` y la clase principal extienda `SpringBootServletInitializer`.

**¿Cómo cambio el puerto de JBoss?**
- Edita `standalone.xml` y busca `<socket-binding name="http" port="8082"/>`.

**¿Cómo conecto el frontend al backend?**
- Usa rutas relativas (`/api/...`). No uses `localhost` ni puertos fijos en producción.

**¿Cómo inicializo la base de datos?**
- Usa el script `scripts/init-database.sql` en tu gestor de PostgreSQL.

**¿Dónde están los logs?**
- En `jboss-eap-7.2.2/standalone/log/server.log`.

---

## 🛠️ Resolución de Problemas
- **El WAR no se genera**: Verifica el packaging y la clase principal.
- **No conecta a la base de datos**: Revisa credenciales, firewall y acceso de red.
- **El frontend no carga datos**: Asegúrate de usar rutas relativas y que el backend esté corriendo.
- **Errores en JBoss**: Consulta los logs en `standalone/log/server.log`.
- **Permisos**: Ejecuta scripts y JBoss como administrador si es necesario.
- **Node/Java no instalados**: Instala las versiones requeridas antes de ejecutar el despliegue.

---

## 📚 Glosario
- **WAR**: Web Application Archive, paquete desplegable en servidores Java.
- **JBoss**: Servidor de aplicaciones Java EE.
- **Spring Boot**: Framework para aplicaciones Java modernas.
- **Next.js**: Framework React para frontend moderno.
- **Rutas relativas**: URLs que no incluyen dominio ni puerto, útiles para despliegues integrados.

---

## 🤝 Contribución
1. Crea una rama para tu feature o fix:
   ```bash
   git checkout -b feature/mi-feature
   ```
2. Haz tus cambios y súbelos:
   ```bash
   git add .
   git commit -m "Descripción clara"
   git push origin feature/mi-feature
   ```
3. Haz un Pull Request en GitHub.

---

## 📝 Licencia
Este proyecto es privado y para uso interno de la organización. Contacta al responsable para más información.

---

## 📞 Contacto y Soporte
- Documentación interna en la carpeta `docs/`.
- Para dudas técnicas, contacta al equipo de desarrollo o abre un issue en el repositorio.
- Enlaces útiles:
  - [Spring Boot Docs](https://spring.io/projects/spring-boot)
  - [Next.js Docs](https://nextjs.org/docs)
  - [JBoss EAP Docs](https://access.redhat.com/documentation/en-us/red_hat_jboss_enterprise_application_platform/7.2/)

---

## 🎓 Créditos y Titulación

Este sistema fue desarrollado como proyecto de titulación para la empresa **Newbie** por:

- **Edwing García**
- **Sammy Porras**

Estudiantes de la carrera de **Ingeniería en Software**.

El sistema está diseñado y personalizado para cubrir las necesidades de gestión y soporte técnico de la empresa Newbie.

> "La ingeniería en software no solo construye sistemas, construye el futuro. Cada línea de código es una oportunidad para transformar el mundo."

---

¡Gracias por sostenernos en nuestro primer paso al mundo profesional! 
