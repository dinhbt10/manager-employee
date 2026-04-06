package com.utc.employee.web.dto;

import com.utc.employee.domain.Role;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.Set;

public record CreateUserRequest(
        @NotBlank String fullName,
        @NotBlank String username,
        @NotBlank String password,
        @NotNull Role role,
        Long departmentId,
        Set<String> featureCodes
) {
}
