package com.utc.employee.service;

import com.utc.employee.domain.*;
import com.utc.employee.repo.DepartmentRepository;
import com.utc.employee.repo.FeatureRepository;
import com.utc.employee.repo.UserAccountRepository;
import com.utc.employee.security.AccessPolicy;
import com.utc.employee.security.AuthUser;
import com.utc.employee.security.FeatureCodes;
import com.utc.employee.web.BadRequestException;
import com.utc.employee.web.ForbiddenException;
import com.utc.employee.web.dto.CreateUserRequest;
import com.utc.employee.web.dto.UpdateUserRequest;
import com.utc.employee.web.dto.UserDto;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class UserService {

    private final UserAccountRepository userAccountRepository;
    private final DepartmentRepository departmentRepository;
    private final FeatureRepository featureRepository;
    private final PasswordEncoder passwordEncoder;
    private final AccessPolicy accessPolicy;

    public UserService(
            UserAccountRepository userAccountRepository,
            DepartmentRepository departmentRepository,
            FeatureRepository featureRepository,
            PasswordEncoder passwordEncoder,
            AccessPolicy accessPolicy
    ) {
        this.userAccountRepository = userAccountRepository;
        this.departmentRepository = departmentRepository;
        this.featureRepository = featureRepository;
        this.passwordEncoder = passwordEncoder;
        this.accessPolicy = accessPolicy;
    }

    @Transactional(readOnly = true)
    public List<UserDto> list(AuthUser current, String q, String role, Long departmentId) {
        List<UserDto> base = listBase(current);
        return base.stream()
                .filter(d -> matchesUserFilter(d, q, role, departmentId))
                .toList();
    }

    private List<UserDto> listBase(AuthUser current) {
        if (current.role() == Role.EMPLOYEE) {
            UserAccount self = userAccountRepository.findById(current.id()).orElseThrow();
            return List.of(toDto(self, current));
        }
        if (current.role() == Role.MANAGER) {
            if (current.departmentId() == null) {
                return List.of();
            }
            return userAccountRepository.findByDepartment_Id(current.departmentId()).stream()
                    .map(u -> toDto(u, current))
                    .toList();
        }
        return userAccountRepository.findAll().stream().map(u -> toDto(u, current)).toList();
    }

    private boolean matchesUserFilter(UserDto d, String q, String role, Long departmentId) {
        if (role != null && !role.isBlank() && !role.trim().equalsIgnoreCase(d.role())) {
            return false;
        }
        if (departmentId != null && !departmentId.equals(d.departmentId())) {
            return false;
        }
        if (q == null || q.isBlank()) {
            return true;
        }
        String needle = q.trim().toLowerCase(Locale.ROOT);
        if (containsIgnore(d.fullName(), needle)) {
            return true;
        }
        if (containsIgnore(d.employeeCode(), needle)) {
            return true;
        }
        if (containsIgnore(d.username(), needle)) {
            return true;
        }
        return d.departmentName() != null && containsIgnore(d.departmentName(), needle);
    }

    private static boolean containsIgnore(String hay, String needleLower) {
        return hay != null && hay.toLowerCase(Locale.ROOT).contains(needleLower);
    }

    @Transactional(readOnly = true)
    public UserDto get(AuthUser current, Long id) {
        UserAccount u = userAccountRepository.findById(id).orElseThrow();
        u.getFeatures().size();
        if (u.getDepartment() != null) {
            u.getDepartment().getName();
        }
        if (!accessPolicy.canViewEmployee(current, u)) {
            throw new ForbiddenException("Không có quyền xem nhân viên này");
        }
        return toDto(u, current);
    }

    @Transactional
    public UserDto create(AuthUser current, CreateUserRequest req) {
        if (!accessPolicy.hasFeature(current, FeatureCodes.EMP_CREATE)) {
            throw new ForbiddenException("Không có quyền tạo nhân viên");
        }
        if (userAccountRepository.findByUsername(req.username()).isPresent()) {
            throw new BadRequestException("Username đã tồn tại");
        }
        long seq = userAccountRepository.count() + 1;
        UserAccount u = new UserAccount();
        u.setUsername(req.username().trim());
        u.setPasswordHash(passwordEncoder.encode(req.password()));
        u.setFullName(req.fullName().trim());
        u.setEmployeeCode("NV" + String.format("%04d", seq));
        u.setRole(req.role());
        u.setDepartment(departmentRepository.findById(req.departmentId()).orElseThrow());
        
        // Gán quyền mặc định theo role
        u.setFeatures(getDefaultFeaturesForRole(req.role()));
        
        return toDto(userAccountRepository.save(u), current);
    }
    
    /**
     * Trả về quyền mặc định theo role:
     * - EMPLOYEE: không có quyền gì (phải xin quyền qua đơn yêu cầu)
     * - MANAGER: có quyền cấp phòng ban (xem, sửa NV trong phòng, duyệt đơn trong phòng)
     * - ADMIN: có tất cả quyền
     */
    private Set<Feature> getDefaultFeaturesForRole(Role role) {
        return switch (role) {
            case EMPLOYEE -> new HashSet<>(); // Không có quyền gì
            case MANAGER -> new HashSet<>(featureRepository.findByCodeInAndActiveTrue(Set.of(
                    FeatureCodes.EMP_VIEW_DEPT,
                    FeatureCodes.EMP_EDIT_DEPT,
                    FeatureCodes.REQ_APPROVE_DEPT,
                    FeatureCodes.DEPT_VIEW
            )));
            case ADMIN -> new HashSet<>(featureRepository.findAll()); // Tất cả quyền
        };
    }

    @Transactional
    public UserDto update(AuthUser current, Long id, UpdateUserRequest req) {
        UserAccount u = userAccountRepository.findById(id).orElseThrow();
        u.getFeatures().size();
        if (!accessPolicy.canEditEmployee(current, u)) {
            throw new ForbiddenException("Không có quyền sửa nhân viên này");
        }
        if (req.fullName() != null && !req.fullName().isBlank()) {
            u.setFullName(req.fullName().trim());
        }
        // Chỉ người có quyền EMP_EDIT_ALL mới được sửa role, department và features
        if (accessPolicy.hasFeature(current, FeatureCodes.EMP_EDIT_ALL)) {
            if (req.role() != null) {
                u.setRole(req.role());
            }
            if (req.departmentId() != null) {
                u.setDepartment(departmentRepository.findById(req.departmentId()).orElseThrow());
            }
            if (req.featureCodes() != null) {
                u.setFeatures(resolveFeatures(req.featureCodes()));
            }
        }
        return toDto(userAccountRepository.save(u), current);
    }

    private Set<Feature> resolveFeatures(Set<String> codes) {
        List<Feature> list = featureRepository.findByCodeInAndActiveTrue(codes);
        if (list.size() != codes.size()) {
            throw new BadRequestException("Một số mã chức năng không hợp lệ hoặc đã ngưng");
        }
        return new HashSet<>(list);
    }

    private UserDto toDto(UserAccount u, AuthUser viewer) {
        Set<String> codes = u.getFeatures().stream().map(Feature::getCode).collect(Collectors.toSet());
        boolean readOnly = false;
        if (u.getRole() == Role.EMPLOYEE && codes.isEmpty()) {
            readOnly = true;
        }
        String deptName = u.getDepartment() != null ? u.getDepartment().getName() : null;
        Long deptId = u.getDepartment() != null ? u.getDepartment().getId() : null;
        return new UserDto(
                u.getId(),
                u.getEmployeeCode(),
                u.getUsername(),
                u.getFullName(),
                u.getRole().name(),
                deptId,
                deptName,
                codes,
                readOnly
        );
    }
}
