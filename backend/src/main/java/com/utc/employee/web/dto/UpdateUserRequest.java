package com.utc.employee.web.dto;

import com.utc.employee.domain.Role;

import java.util.Set;

public record UpdateUserRequest(
        String fullName,
        Role role,
        Long departmentId,
        Set<String> featureCodes,
        String gender,
        String dateOfBirth, // ISO format: yyyy-MM-dd
        String address,
        String nationality,
        String citizenId
) {
}
