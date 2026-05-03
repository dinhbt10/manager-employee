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
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
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
    public List<PermissionRequestDto> listVisible(
            AuthUser current,
            String q,
            List<String> statusParams,
            Long departmentId,
            Long requesterId,
            Long targetUserId,
            String createdFrom,
            String createdTo,
            String featureCode
    ) {
        List<RequestStatus> statuses = parseStatuses(statusParams);
        Instant from = parseInstantParam(createdFrom);
        Instant to = parseInstantParam(createdTo);
        String fc = featureCode != null && !featureCode.isBlank() ? featureCode.trim() : null;

        return requestRepository.findAll().stream()
                .filter(r -> canSeeRequest(current, r))
                .filter(r -> matchesStatuses(r, statuses))
                .filter(r -> matchesDepartmentFilter(r, departmentId))
                .filter(r -> matchesRequesterFilter(r, requesterId))
                .filter(r -> matchesTargetFilter(r, targetUserId))
                .filter(r -> matchesCreatedRange(r, from, to))
                .filter(r -> matchesFeatureCode(r, fc))
                .filter(r -> matchesTextQuery(r, q))
                .map(this::toDto)
                .toList();
    }

    private static List<RequestStatus> parseStatuses(List<String> statusParams) {
        if (statusParams == null || statusParams.isEmpty()) {
            return List.of();
        }
        List<RequestStatus> out = new ArrayList<>();
        for (String s : statusParams) {
            if (s == null || s.isBlank()) {
                continue;
            }
            try {
                out.add(RequestStatus.valueOf(s.trim()));
            } catch (IllegalArgumentException e) {
                throw new BadRequestException("Trạng thái không hợp lệ: " + s);
            }
        }
        return out;
    }

    private static Instant parseInstantParam(String s) {
        if (s == null || s.isBlank()) {
            return null;
        }
        try {
            return Instant.parse(s.trim());
        } catch (Exception e) {
            throw new BadRequestException("Thời gian không hợp lệ (dùng ISO-8601, ví dụ 2026-04-07T00:00:00Z)");
        }
    }

    private static boolean matchesStatuses(PermissionRequest r, List<RequestStatus> statuses) {
        if (statuses == null || statuses.isEmpty()) {
            return true;
        }
        return statuses.contains(r.getStatus());
    }

    private static boolean matchesDepartmentFilter(PermissionRequest r, Long departmentId) {
        if (departmentId == null) {
            return true;
        }
        if (r.getTargetUser().getDepartment() == null) {
            return false;
        }
        return departmentId.equals(r.getTargetUser().getDepartment().getId());
    }

    private static boolean matchesRequesterFilter(PermissionRequest r, Long requesterId) {
        if (requesterId == null) {
            return true;
        }
        return requesterId.equals(r.getRequester().getId());
    }

    private static boolean matchesTargetFilter(PermissionRequest r, Long targetUserId) {
        if (targetUserId == null) {
            return true;
        }
        return targetUserId.equals(r.getTargetUser().getId());
    }

    private static boolean matchesCreatedRange(PermissionRequest r, Instant from, Instant to) {
        Instant c = r.getCreatedAt();
        if (c == null) {
            return true;
        }
        if (from != null && c.isBefore(from)) {
            return false;
        }
        if (to != null && c.isAfter(to)) {
            return false;
        }
        return true;
    }

    private static boolean matchesFeatureCode(PermissionRequest r, String featureCode) {
        if (featureCode == null) {
            return true;
        }
        r.getRequestedFeatures().size();
        return r.getRequestedFeatures().stream()
                .anyMatch(f -> f.getCode().equalsIgnoreCase(featureCode));
    }

    private static boolean matchesTextQuery(PermissionRequest r, String q) {
        if (q == null || q.isBlank()) {
            return true;
        }
        String needle = q.trim().toLowerCase(Locale.ROOT);
        if (r.getTitle().toLowerCase(Locale.ROOT).contains(needle)) {
            return true;
        }
        if (r.getCode().toLowerCase(Locale.ROOT).contains(needle)) {
            return true;
        }
        if (r.getDescription() != null && r.getDescription().toLowerCase(Locale.ROOT).contains(needle)) {
            return true;
        }
        if (r.getRequester().getFullName().toLowerCase(Locale.ROOT).contains(needle)) {
            return true;
        }
        if (r.getTargetUser().getFullName().toLowerCase(Locale.ROOT).contains(needle)) {
            return true;
        }
        return r.getTargetUser().getDepartment() != null
                && r.getTargetUser().getDepartment().getName().toLowerCase(Locale.ROOT).contains(needle);
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
        Set<Feature> feats = new HashSet<>(featureRepository.findByCodeInAndActiveTrue(body.requestedFeatureCodes()));
        if (feats.size() != body.requestedFeatureCodes().size()) {
            throw new BadRequestException("Mã chức năng không hợp lệ hoặc đã ngưng");
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
        var submitCodes = r.getRequestedFeatures().stream().map(Feature::getCode).toList();
        var activeForSubmit = featureRepository.findByCodeInAndActiveTrue(submitCodes);
        if (activeForSubmit.size() != r.getRequestedFeatures().size()) {
            throw new BadRequestException("Một số mã chức năng đã ngưng, cập nhật request trước khi gửi");
        }
        
        // Kiểm tra nếu người gửi là Manager/Admin có quyền phê duyệt
        UserAccount target = r.getTargetUser();
        if (accessPolicy.canApproveRequest(current, target)) {
            // Tự động phê duyệt
            r.setStatus(RequestStatus.APPROVED);
            r.setReviewer(userAccountRepository.getReferenceById(current.id()));
            r.setReviewedAt(Instant.now());
            r.setRejectReason(null);
            target.getFeatures().size(); // Load lazy collection
            target.getFeatures().addAll(r.getRequestedFeatures());
        } else {
            // Chuyển sang chờ duyệt
            r.setStatus(RequestStatus.PENDING);
        }
        
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
        var codes = r.getRequestedFeatures().stream().map(Feature::getCode).toList();
        var activeOnly = featureRepository.findByCodeInAndActiveTrue(codes);
        if (activeOnly.size() != r.getRequestedFeatures().size()) {
            throw new BadRequestException("Một số mã chức năng đã ngưng, không thể cấp");
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
        boolean owner = r.getRequester().getId().equals(current.id());
        boolean admin = accessPolicy.isAdmin(current);
        boolean mgrDept = accessPolicy.canApproveRequest(current, r.getTargetUser());
        if (!owner && !admin && !mgrDept) {
            throw new ForbiddenException("Không xóa được");
        }
        if (r.getStatus() != RequestStatus.DRAFT
                && r.getStatus() != RequestStatus.REJECTED
                && r.getStatus() != RequestStatus.REVOKED) {
            throw new BadRequestException("Chỉ xóa bản nháp, đã từ chối hoặc đã gỡ");
        }
        requestRepository.delete(r);
    }

    @Transactional
    public PermissionRequestDto update(AuthUser current, Long id, CreatePermissionRequestBody body) {
        PermissionRequest r = requestRepository.findById(id).orElseThrow();
        if (!r.getRequester().getId().equals(current.id())) {
            throw new ForbiddenException("Chỉ người tạo mới chỉnh sửa được");
        }
        if (r.getStatus() != RequestStatus.DRAFT
                && r.getStatus() != RequestStatus.REJECTED
                && r.getStatus() != RequestStatus.REVOKED) {
            throw new BadRequestException("Chỉ sửa request ở trạng thái nháp, từ chối hoặc đã gỡ");
        }
        UserAccount target = userAccountRepository.findById(body.targetUserId()).orElseThrow();
        Set<Feature> feats = new HashSet<>(featureRepository.findByCodeInAndActiveTrue(body.requestedFeatureCodes()));
        if (feats.size() != body.requestedFeatureCodes().size()) {
            throw new BadRequestException("Mã chức năng không hợp lệ hoặc đã ngưng");
        }
        r.setTitle(body.title().trim());
        r.setDescription(body.description());
        r.setTargetUser(target);
        r.setRequestedFeatures(feats);
        r.setUpdatedAt(Instant.now());
        return toDto(requestRepository.save(r));
    }

    @Transactional
    public PermissionRequestDto saveDraft(AuthUser current, Long id, CreatePermissionRequestBody body) {
        PermissionRequest r = requestRepository.findById(id).orElseThrow();
        if (!r.getRequester().getId().equals(current.id())) {
            throw new ForbiddenException("Chỉ người tạo mới chỉnh sửa được");
        }
        if (r.getStatus() != RequestStatus.DRAFT 
                && r.getStatus() != RequestStatus.REJECTED 
                && r.getStatus() != RequestStatus.REVOKED) {
            throw new BadRequestException("Chỉ lưu nháp request ở trạng thái nháp, từ chối hoặc đã gỡ");
        }
        UserAccount target = userAccountRepository.findById(body.targetUserId()).orElseThrow();
        Set<Feature> feats = new HashSet<>(featureRepository.findByCodeInAndActiveTrue(body.requestedFeatureCodes()));
        if (feats.size() != body.requestedFeatureCodes().size()) {
            throw new BadRequestException("Mã chức năng không hợp lệ hoặc đã ngưng");
        }
        r.setTitle(body.title().trim());
        r.setDescription(body.description());
        r.setTargetUser(target);
        r.setRequestedFeatures(feats);
        r.setStatus(RequestStatus.DRAFT);
        r.setUpdatedAt(Instant.now());
        return toDto(requestRepository.save(r));
    }

    private PermissionRequestDto toDto(PermissionRequest r) {
        Long tdeptId = r.getTargetUser().getDepartment() != null
                ? r.getTargetUser().getDepartment().getId() : null;
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
                tdeptId,
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
