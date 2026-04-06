package com.utc.employee.security;

import com.utc.employee.domain.Role;

import java.util.Set;

public record AuthUser(
        Long id,
        String username,
        Role role,
        Long departmentId,
        Set<String> featureCodes
) {
}
