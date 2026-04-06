package com.utc.employee.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Date;

@Service
public class JwtService {

    /** Trùng với giá trị mặc định trong application.yml — chỉ dùng cho dev/test. */
    private static final String DEFAULT_DEV_SECRET = "changeme-dev-only-secret-key-min-32-chars-long!!";

    private final SecretKey key;
    private final long expirationMs;

    public JwtService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expiration-ms}") long expirationMs,
            Environment environment
    ) {
        byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
        if (bytes.length < 32) {
            throw new IllegalStateException("app.jwt.secret phải dài ít nhất 32 ký tự");
        }
        if (mustUseStrongSecret(environment) && DEFAULT_DEV_SECRET.equals(secret)) {
            throw new IllegalStateException(
                    "JWT_SECRET không được dùng giá trị mặc định khi chạy ngoài profile dev/test. "
                            + "Đặt biến môi trường JWT_SECRET (≥32 ký tự ngẫu nhiên).");
        }
        this.key = Keys.hmacShaKeyFor(bytes);
        this.expirationMs = expirationMs;
    }

    private static boolean mustUseStrongSecret(Environment environment) {
        return Arrays.stream(environment.getActiveProfiles())
                .noneMatch(p -> p.equalsIgnoreCase("dev") || p.equalsIgnoreCase("test"));
    }

    public String createToken(String username) {
        Date now = new Date();
        return Jwts.builder()
                .subject(username)
                .issuedAt(now)
                .expiration(new Date(now.getTime() + expirationMs))
                .signWith(key)
                .compact();
    }

    public String extractUsername(String token) {
        return parseClaims(token).getSubject();
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
