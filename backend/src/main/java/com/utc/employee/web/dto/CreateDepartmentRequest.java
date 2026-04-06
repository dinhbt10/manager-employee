package com.utc.employee.web.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateDepartmentRequest(@NotBlank String name) {
}
