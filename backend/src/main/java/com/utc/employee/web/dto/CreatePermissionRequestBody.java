package com.utc.employee.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.Set;

public record CreatePermissionRequestBody(
        @NotBlank String title,
        String description,
        @NotNull Long targetUserId,
        @NotEmpty Set<String> requestedFeatureCodes
) {
}
