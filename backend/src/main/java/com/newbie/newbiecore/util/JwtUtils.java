package com.newbie.newbiecore.util;

import com.newbie.newbiecore.config.DynamicJwtConfig;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;

/**
 * Utilidad para manejo de tokens JWT.
 *
 * Usa DynamicJwtConfig (que tiene @RefreshScope) para obtener los valores,
 * permitiendo que los cambios en la BD se apliquen sin reiniciar.
 */
@Component
public class JwtUtils {

    private static final Logger logger = LoggerFactory.getLogger(JwtUtils.class);

    private final DynamicJwtConfig jwtConfig;

    public JwtUtils(DynamicJwtConfig jwtConfig) {
        this.jwtConfig = jwtConfig;
    }

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(jwtConfig.getSecret().getBytes(StandardCharsets.UTF_8));
    }

    // Genera Access Token (vida corta)
    public String generateToken(UserDetails userDetails) {
        return Jwts.builder()
                .setSubject(userDetails.getUsername())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + jwtConfig.getExpiration()))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    // Genera Refresh Token (vida larga)
    public String generateRefreshToken(UserDetails userDetails) {
        return Jwts.builder()
                .setSubject(userDetails.getUsername())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + jwtConfig.getRefreshExpiration()))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    // Extrae el username (correo) del token
    public String extractUsername(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }

    // Extrae la fecha de expiración del token
    public Date getExpirationDate(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getExpiration();
    }

    // Valida Access Token contra UserDetails
    public boolean validateToken(String token, UserDetails userDetails) {
        try {
            final String username = extractUsername(token);
            return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
        } catch (ExpiredJwtException e) {
            logger.warn("Token expirado");
            return false;
        } catch (JwtException e) {
            logger.error("Token inválido: {}", e.getMessage());
            return false;
        }
    }

    // Valida Refresh Token (firma y expiración)
    public boolean validateRefreshToken(String token) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token);
            return true;
        } catch (JwtException e) {
            logger.warn("Refresh token inválido: {}", e.getMessage());
            return false;
        }
    }

    // Verifica si el token está expirado
    private boolean isTokenExpired(String token) {
        Date expiration = getExpirationDate(token);
        return expiration.before(new Date());
    }
}