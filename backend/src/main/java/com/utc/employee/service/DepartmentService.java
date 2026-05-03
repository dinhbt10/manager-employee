package com.utc.employee.service;

import com.utc.employee.domain.Department;
import com.utc.employee.repo.DepartmentRepository;
import com.utc.employee.security.AccessPolicy;
import com.utc.employee.security.AuthUser;
import com.utc.employee.security.FeatureCodes;
import com.utc.employee.web.BadRequestException;
import com.utc.employee.web.ForbiddenException;
import com.utc.employee.web.dto.CreateDepartmentRequest;
import com.utc.employee.web.dto.DepartmentDto;
import com.utc.employee.web.dto.UpdateDepartmentRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
public class DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final AccessPolicy accessPolicy;

    public DepartmentService(DepartmentRepository departmentRepository, AccessPolicy accessPolicy) {
        this.departmentRepository = departmentRepository;
        this.accessPolicy = accessPolicy;
    }

    @Transactional(readOnly = true)
    public List<DepartmentDto> list(AuthUser current, String q, Boolean active) {
        if (!accessPolicy.canManageDepartment(current)) {
            throw new ForbiddenException("Không có quyền xem phòng ban");
        }
        
        // Admin xem tất cả, Manager chỉ xem phòng của mình
        List<Department> departments;
        if (accessPolicy.isAdmin(current)) {
            departments = departmentRepository.findAll();
        } else if (accessPolicy.isManager(current) && current.departmentId() != null) {
            // Manager chỉ xem phòng ban của mình
            Department dept = departmentRepository.findById(current.departmentId()).orElse(null);
            departments = dept != null ? List.of(dept) : List.of();
        } else {
            departments = List.of();
        }
        
        return departments.stream()
                .map(this::toDto)
                .filter(d -> matches(d, q, active))
                .toList();
    }

    private boolean matches(DepartmentDto d, String q, Boolean active) {
        if (active != null && d.active() != active) {
            return false;
        }
        if (q == null || q.isBlank()) {
            return true;
        }
        String needle = q.trim().toLowerCase(Locale.ROOT);
        return d.code().toLowerCase(Locale.ROOT).contains(needle)
                || d.name().toLowerCase(Locale.ROOT).contains(needle);
    }

    @Transactional
    public DepartmentDto create(AuthUser current, CreateDepartmentRequest req) {
        if (!accessPolicy.canManageDepartment(current)) {
            throw new ForbiddenException("Không có quyền tạo phòng ban");
        }
        // Chỉ cho phép tạo nếu có quyền DEPT_CREATE
        if (!accessPolicy.hasFeature(current, FeatureCodes.DEPT_CREATE)) {
            throw new ForbiddenException("Không có quyền tạo phòng ban");
        }
        long next = departmentRepository.count() + 1;
        String code = "PB" + String.format("%03d", next);
        Department d = new Department();
        d.setCode(code);
        d.setName(req.name().trim());
        d.setActive(true);
        return toDto(departmentRepository.save(d));
    }

    @Transactional
    public DepartmentDto update(AuthUser current, Long id, UpdateDepartmentRequest req) {
        if (!accessPolicy.canManageDepartment(current)) {
            throw new ForbiddenException("Không có quyền sửa phòng ban");
        }
        // Chỉ cho phép sửa nếu có quyền DEPT_EDIT
        if (!accessPolicy.hasFeature(current, FeatureCodes.DEPT_EDIT)) {
            throw new ForbiddenException("Không có quyền sửa phòng ban");
        }
        Department d = departmentRepository.findById(id).orElseThrow();
        if (req.name() != null && !req.name().isBlank()) {
            d.setName(req.name().trim());
        }
        if (req.active() != null) {
            d.setActive(req.active());
        }
        return toDto(departmentRepository.save(d));
    }

    private DepartmentDto toDto(Department d) {
        return new DepartmentDto(d.getId(), d.getCode(), d.getName(), d.isActive());
    }
}
