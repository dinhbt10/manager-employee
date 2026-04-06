package com.utc.employee.repo;

import com.utc.employee.domain.PermissionRequest;
import com.utc.employee.domain.RequestStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PermissionRequestRepository extends JpaRepository<PermissionRequest, Long> {
    Optional<PermissionRequest> findByCode(String code);

    @EntityGraph(attributePaths = {
            "requester", "targetUser", "targetUser.department",
            "requestedFeatures", "reviewer"
    })
    @Override
    List<PermissionRequest> findAll();

    List<PermissionRequest> findByStatus(RequestStatus status);

    List<PermissionRequest> findByRequesterId(Long requesterId);

    @EntityGraph(attributePaths = {
            "requester", "targetUser", "targetUser.department",
            "requestedFeatures", "reviewer"
    })
    @Override
    Optional<PermissionRequest> findById(Long id);
}
