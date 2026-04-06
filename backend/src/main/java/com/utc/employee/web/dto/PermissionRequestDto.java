package com.utc.employee.web.dto;

import java.time.Instant;
import java.util.Set;

public record PermissionRequestDto(
        Long id,
        String code,
        String title,
        String description,
        String status,
        Long requesterId,
        String requesterName,
        Long targetUserId,
        String targetUserName,
        Long targetDepartmentId,
        String targetDepartmentName,
        Set<String> requestedFeatureCodes,
        Long reviewerId,
        String reviewerName,
        Instant reviewedAt,
        String rejectReason,
        Instant createdAt,
        Instant updatedAt
) {
}
