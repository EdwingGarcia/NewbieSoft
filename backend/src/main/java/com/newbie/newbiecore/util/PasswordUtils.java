package com.newbie.newbiecore.util;


import java.util.regex.Pattern;

public class PasswordUtils {

    // Al menos 8 caracteres, 1 mayúscula, 1 minúscula, 1 dígito
    private static final Pattern PASSWORD_PATTERN =
            Pattern.compile("^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z]).{8,}$");

    public static boolean isValid(String password) {
        return PASSWORD_PATTERN.matcher(password).matches();
    }
}
 