package com.utc.employee.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateFeatureRequest(
        @NotBlank
        @Size(min = 2, max = 64)
        @Pattern(regexp = "^[A-Za-z][A-Za-z0-9_]{1,63}$", message = "Mã: chữ cái đầu, sau đó chữ số hoặc _ (2–64 ký tự)")
        String code,
        @NotBlank
        @Size(max = 255)
        String name
) {
}
