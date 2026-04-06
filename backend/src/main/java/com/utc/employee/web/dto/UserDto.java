package com.utc.employee.web.dto;

import java.util.Set;

public record UserDto(
        Long id,
        String employeeCode,
        String username,
        String fullName,
        String role,
        Long departmentId,
        String departmentName,
        Set<String> features,
        boolean readOnlyProfile
) {
}
