package com.utc.employee.service;

import com.utc.employee.domain.*;
import com.utc.employee.repo.FeatureRepository;
import com.utc.employee.repo.PermissionRequestRepository;
import com.utc.employee.repo.UserAccountRepository;
import com.utc.employee.security.AccessPolicy;
import com.utc.employee.security.AuthUser;
import com.utc.employee.web.BadRequestException;
import com.utc.employee.web.ForbiddenException;
import com.utc.employee.web.dto.CreatePermissionRequestBody;
import com.utc.employee.web.dto.PermissionRequestDto;
import com.utc.employee.web.dto.ReviewRequestBody;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class PermissionRequestService {

    private final PermissionRequestRepository requestRepository;
    private final UserAccountRepository userAccountRepository;
    private final FeatureRepository featureRepository;
    private final AccessPolicy accessPolicy;

    public PermissionRequestService(
            PermissionRequestRepository requestRepository,
            UserAccountRepository userAccountRepository,
            FeatureRepository featureRepository,
            AccessPolicy accessPolicy
    ) {
        this.requestRepository = requestRepository;
        this.userAccountRepository = userAccountRepository;
        this.featureRepository = featureRepository;
        this.accessPolicy = accessPolicy;
    }

    @Transactional(readOnly = true)
    public List<PermissionRequestDto> listVisible(AuthUser current) {
        List<PermissionRequest> all = requestRepository.findAll();
        return all.stream()
                .filter(r -> canSeeRequest(current, r))
                .map(this::toDto)
                .toList();
    }

    private boolean canSeeRequest(AuthUser viewer, PermissionRequest r) {
        if (accessPolicy.isAdmin(viewer)) {
            return true;
        }
        if (r.getRequester().getId().equals(viewer.id())) {
            return true;
        }
        if (r.getTargetUser().getId().equals(viewer.id())) {
            return true;
        }
        if (accessPolicy.isManager(viewer) && r.getTargetUser().getDepartment() != null
                && viewer.departmentId() != null
                && viewer.departmentId().equals(r.getTargetUser().getDepartment().getId())) {
            return true;
        }
        return false;
    }

    @Transactional(readOnly = true)
    public PermissionRequestDto get(AuthUser current, Long id) {
        PermissionRequest r = requestRepository.findById(id).orElseThrow();
        if (!canSeeRequest(current, r)) {
            throw new ForbiddenException("Không xem được request này");
        }
        return toDto(r);
    }

    @Transactional
    public PermissionRequestDto create(AuthUser current, CreatePermissionRequestBody body) {
        UserAccount target = userAccountRepository.findById(body.targetUserId()).orElseThrow();
        Set<Feature> feats = new HashSet<>(featureRepository.findByCodeIn(body.requestedFeatureCodes()));
        if (feats.size() != body.requestedFeatureCodes().size()) {
            throw new BadRequestException("Mã chức năng không hợp lệ");
        }
        long n = requestRepository.count() + 1;
        PermissionRequest r = new PermissionRequest();
        r.setCode("REQ-" + String.format("%05d", n));
        r.setTitle(body.title().trim());
        r.setDescription(body.description());
        r.setStatus(RequestStatus.DRAFT);
        r.setRequester(userAccountRepository.getReferenceById(current.id()));
        r.setTargetUser(target);
        r.setRequestedFeatures(feats);
        r.setUpdatedAt(Instant.now());
        return toDto(requestRepository.save(r));
    }

    @Transactional
    public PermissionRequestDto submit(AuthUser current, Long id) {
        PermissionRequest r = requestRepository.findById(id).orElseThrow();
        if (!r.getRequester().getId().equals(current.id())) {
            throw new ForbiddenException("Chỉ người tạo mới gửi duyệt");
        }
        if (r.getStatus() != RequestStatus.DRAFT && r.getStatus() != RequestStatus.REJECTED && r.getStatus() != RequestStatus.REVOKED) {
            throw new BadRequestException("Trạng thái không cho phép gửi");
        }
        r.setStatus(RequestStatus.PENDING);
        r.setUpdatedAt(Instant.now());
        return toDto(requestRepository.save(r));
    }

    @Transactional
    public PermissionRequestDto approve(AuthUser current, Long id) {
        PermissionRequest r = requestRepository.findById(id).orElseThrow();
        UserAccount target = r.getTargetUser();
        target.getFeatures().size();
        if (r.getStatus() != RequestStatus.PENDING) {
            throw new BadRequestException("Request không ở trạng thái chờ duyệt");
        }
        if (!accessPolicy.canApproveRequest(current, target)) {
            throw new ForbiddenException("Bạn không được phê duyệt request này");
        }
        r.setStatus(RequestStatus.APPROVED);
        r.setReviewer(userAccountRepository.getReferenceById(current.id()));
        r.setReviewedAt(Instant.now());
        r.setRejectReason(null);
        r.setUpdatedAt(Instant.now());
        target.getFeatures().addAll(r.getRequestedFeatures());
        return toDto(requestRepository.save(r));
    }

    @Transactional
    public PermissionRequestDto reject(AuthUser current, Long id, ReviewRequestBody body) {
        PermissionRequest r = requestRepository.findById(id).orElseThrow();
        if (r.getStatus() != RequestStatus.PENDING) {
            throw new BadRequestException("Request không ở trạng thái chờ duyệt");
        }
        if (body.rejectReason() == null || body.rejectReason().isBlank()) {
            throw new BadRequestException("Cần lý do từ chối");
        }
        if (!accessPolicy.canApproveRequest(current, r.getTargetUser())) {
            throw new ForbiddenException("Bạn không được từ chối request này");
        }
        r.setStatus(RequestStatus.REJECTED);
        r.setReviewer(userAccountRepository.getReferenceById(current.id()));
        r.setReviewedAt(Instant.now());
        r.setRejectReason(body.rejectReason().trim().substring(0, Math.min(500, body.rejectReason().trim().length())));
        r.setUpdatedAt(Instant.now());
        return toDto(requestRepository.save(r));
    }

    @Transactional
    public PermissionRequestDto revoke(AuthUser current, Long id) {
        PermissionRequest r = requestRepository.findById(id).orElseThrow();
        if (r.getStatus() != RequestStatus.APPROVED) {
            throw new BadRequestException("Chỉ gỡ request đã duyệt");
        }
        if (!accessPolicy.canApproveRequest(current, r.getTargetUser())) {
            throw new ForbiddenException("Không có quyền gỡ");
        }
        r.setStatus(RequestStatus.REVOKED);
        r.setUpdatedAt(Instant.now());
        UserAccount target = r.getTargetUser();
        target.getFeatures().removeAll(r.getRequestedFeatures());
        return toDto(requestRepository.save(r));
    }

    @Transactional
    public void delete(AuthUser current, Long id) {
        PermissionRequest r = requestRepository.findById(id).orElseThrow();
        if (!r.getRequester().getId().equals(current.id()) && !accessPolicy.isAdmin(current)) {
            throw new ForbiddenException("Không xóa được");
        }
        if (r.getStatus() != RequestStatus.DRAFT && r.getStatus() != RequestStatus.REJECTED) {
            throw new BadRequestException("Chỉ xóa bản nháp hoặc đã từ chối");
        }
        requestRepository.delete(r);
    }

    private PermissionRequestDto toDto(PermissionRequest r) {
        String tdept = r.getTargetUser().getDepartment() != null
                ? r.getTargetUser().getDepartment().getName() : null;
        Set<String> codes = r.getRequestedFeatures().stream().map(Feature::getCode).collect(Collectors.toSet());
        return new PermissionRequestDto(
                r.getId(),
                r.getCode(),
                r.getTitle(),
                r.getDescription(),
                r.getStatus().name(),
                r.getRequester().getId(),
                r.getRequester().getFullName(),
                r.getTargetUser().getId(),
                r.getTargetUser().getFullName(),
                tdept,
                codes,
                r.getReviewer() != null ? r.getReviewer().getId() : null,
                r.getReviewer() != null ? r.getReviewer().getFullName() : null,
                r.getReviewedAt(),
                r.getRejectReason(),
                r.getCreatedAt(),
                r.getUpdatedAt()
        );
    }
}
