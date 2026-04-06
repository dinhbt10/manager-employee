package com.utc.employee.web.dto;

import java.util.Set;

public record LoginResponse(
        String token,
        Long userId,
        String username,
        String fullName,
        String role,
        Long departmentId,
        String departmentName,
        Set<String> features
) {
}
