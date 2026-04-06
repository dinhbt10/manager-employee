package com.utc.employee.web.dto;

import jakarta.validation.constraints.Size;

public record UpdateFeatureRequest(
        @Size(max = 255)
        String name,
        Boolean active
) {
}
