package com.newbie.newbiecore.util;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/**
 * Utilidad para generar hashes BCrypt de contraseñas.
 * Ejecutar: mvn spring-boot:run
 * -Dspring-boot.run.arguments="--generate-hash=Admin123!"
 */
public class PasswordHashGenerator {

    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

        String[] passwords = {
                "Admin123!",
                "Tecnico123!",
                "Cliente123!"
        };

        System.out.println("========================================");
        System.out.println("HASHES BCrypt GENERADOS");
        System.out.println("========================================");

        for (String password : passwords) {
            String hash = encoder.encode(password);
            System.out.println();
            System.out.println("Contraseña: " + password);
            System.out.println("Hash:       " + hash);
        }

        System.out.println();
        System.out.println("========================================");
        System.out.println("Usa estos hashes en el script SQL");
        System.out.println("========================================");
    }
}
