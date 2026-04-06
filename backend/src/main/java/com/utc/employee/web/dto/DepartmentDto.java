package com.utc.employee.web.dto;

public record DepartmentDto(
        Long id,
        String code,
        String name,
        boolean active
) {
}
