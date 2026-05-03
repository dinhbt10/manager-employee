package com.utc.employee.web;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.util.HashMap;
import java.util.Map;

/**
 * ⚠️ CHỈ DÙNG CHO DEBUG - XÓA TRƯỚC KHI DEPLOY PRODUCTION
 * Endpoint để xem thông tin database connection
 * 
 * DISABLED - Uncomment @RestController để enable
 */
// @RestController
@RequestMapping("/api/debug")
public class DebugController {

    @Autowired
    private Environment env;

    @Autowired
    private DataSource dataSource;

    /**
     * GET /api/debug/db-info
     * Trả về thông tin database connection (đã mask password)
     */
    @GetMapping("/db-info")
    public Map<String, Object> getDbInfo() {
        Map<String, Object> info = new HashMap<>();
        
        try {
            // Lấy thông tin từ environment
            String url = env.getProperty("spring.datasource.url");
            String username = env.getProperty("spring.datasource.username");
            String driver = env.getProperty("spring.datasource.driver-class-name");
            String profile = env.getProperty("spring.profiles.active");
            
            info.put("profile", profile);
            info.put("url", url);
            info.put("username", username);
            info.put("driver", driver);
            info.put("password", "***MASKED***");
            
            // Test connection
            try (Connection conn = dataSource.getConnection()) {
                info.put("connectionValid", conn.isValid(5));
                info.put("catalog", conn.getCatalog());
                info.put("databaseProductName", conn.getMetaData().getDatabaseProductName());
                info.put("databaseProductVersion", conn.getMetaData().getDatabaseProductVersion());
            }
            
            info.put("status", "success");
        } catch (Exception e) {
            info.put("status", "error");
            info.put("error", e.getMessage());
        }
        
        return info;
    }

    /**
     * GET /api/debug/env
     * Trả về các environment variables liên quan đến DB
     */
    @GetMapping("/env")
    public Map<String, String> getEnvVars() {
        Map<String, String> envVars = new HashMap<>();
        
        // Các biến thường dùng
        String[] keys = {
            "SPRING_PROFILES_ACTIVE",
            "DB_HOST",
            "DB_PORT", 
            "DB_NAME",
            "DB_USER",
            "DATABASE_URL",
            "PORT",
            "SERVER_PORT"
        };
        
        for (String key : keys) {
            String value = env.getProperty(key);
            if (value != null) {
                // Mask password nếu có
                if (key.contains("PASSWORD") || key.contains("SECRET")) {
                    envVars.put(key, "***MASKED***");
                } else {
                    envVars.put(key, value);
                }
            }
        }
        
        return envVars;
    }
}
