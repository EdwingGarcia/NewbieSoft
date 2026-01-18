# Etapa de ejecución: Usamos una imagen ligera de Java 17
FROM eclipse-temurin:17-jdk-alpine

# Creamos un volumen temporal (opcional, pero buena práctica en Spring Boot)
VOLUME /tmp

# Copiamos el archivo JAR generado por Maven al contenedor.
# El pipeline primero ejecutará 'mvn package', generando el jar en 'target/'.
# Usamos un comodín (*.jar) para que funcione sin importar la versión exacta.
COPY target/*.jar app.jar

# Comando para ejecutar la aplicación
ENTRYPOINT ["java","-jar","/app.jar"]