# Newbie Core

**Newbie Core** es un sistema de **gestión de soporte técnico** desarrollado con **Spring Boot**, **JWT** y **PostgreSQL**. Permite registrar y dar seguimiento a incidencias de clientes y equipos, gestionando usuarios, roles y autenticación de manera segura.

---

## 🚀 Características

- Autenticación y autorización con **JWT** y roles de usuario.  
- Registro y seguimiento de **clientes**, **equipos** y **reparaciones**.  
- Endpoints **RESTful** organizados bajo `/api/auth`, `/api/clientes`, `/api/reparaciones`, etc.  
- Passwords encriptadas con **BCrypt**.  
- Arquitectura modular: `controller`, `service`, `repository`, `entity`, `dto`, `config`.  

---

## 🛠 Tecnologías

- Java 17  
- Spring Boot  
- Spring Security + JWT  
- PostgreSQL  
- Maven  
- SLF4J / Logger para trazabilidad  

---

## ⚙️ Requisitos

- Java 17 o superior  
- Maven  
- PostgreSQL 14+  
- IDE recomendado (IntelliJ IDEA, Eclipse, VSCode)  

---
Para ejcutar, iniciar backend:
cd backend
mvn clean spring-boot:run
iniciar frontend:
cd frontend
npm run dev
