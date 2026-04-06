package com.utc.employee.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.Set;

public record CreatePermissionRequestBody(
        @NotBlank @Size(max = 255) String title,
        @Size(max = 4000) String description,
        @NotNull Long targetUserId,
        @NotEmpty Set<String> requestedFeatureCodes
) {
}
