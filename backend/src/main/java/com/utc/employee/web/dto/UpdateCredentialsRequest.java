package com.utc.employee.web.dto;

public record UpdateCredentialsRequest(
        String username,
        String password
) {
}
