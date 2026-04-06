package com.utc.employee.service;

import com.utc.employee.domain.Feature;
import com.utc.employee.repo.FeatureRepository;
import com.utc.employee.security.AccessPolicy;
import com.utc.employee.security.AuthUser;
import com.utc.employee.web.BadRequestException;
import com.utc.employee.web.ForbiddenException;
import com.utc.employee.web.dto.CreateFeatureRequest;
import com.utc.employee.web.dto.FeatureAdminDto;
import com.utc.employee.web.dto.FeatureOptionDto;
import com.utc.employee.web.dto.UpdateFeatureRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;

@Service
public class FeatureService {

    private final FeatureRepository featureRepository;
    private final AccessPolicy accessPolicy;

    public FeatureService(FeatureRepository featureRepository, AccessPolicy accessPolicy) {
        this.featureRepository = featureRepository;
        this.accessPolicy = accessPolicy;
    }

    @Transactional(readOnly = true)
    public List<FeatureOptionDto> listActiveOptions() {
        return featureRepository.findByActiveTrueOrderByCodeAsc().stream()
                .map(f -> new FeatureOptionDto(f.getCode(), f.getName()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<FeatureAdminDto> listAllForAdmin(AuthUser current, String q, Boolean active) {
        if (!accessPolicy.canManageFeatures(current)) {
            throw new ForbiddenException("Chỉ Admin quản lý danh mục chức năng");
        }
        return featureRepository.findAll().stream()
                .filter(f -> matchesCatalog(f, q, active))
                .sorted(Comparator.comparing(Feature::getCode))
                .map(this::toAdminDto)
                .toList();
    }

    private boolean matchesCatalog(Feature f, String q, Boolean active) {
        if (active != null && f.isActive() != active) {
            return false;
        }
        if (q == null || q.isBlank()) {
            return true;
        }
        String needle = q.trim().toLowerCase(Locale.ROOT);
        return f.getCode().toLowerCase(Locale.ROOT).contains(needle)
                || f.getName().toLowerCase(Locale.ROOT).contains(needle);
    }

    @Transactional
    public FeatureAdminDto create(AuthUser current, CreateFeatureRequest req) {
        if (!accessPolicy.canManageFeatures(current)) {
            throw new ForbiddenException("Chỉ Admin quản lý danh mục chức năng");
        }
        String code = req.code().trim().toUpperCase();
        if (featureRepository.existsByCode(code)) {
            throw new BadRequestException("Mã chức năng đã tồn tại");
        }
        Feature f = new Feature();
        f.setCode(code);
        f.setName(req.name().trim());
        f.setActive(true);
        return toAdminDto(featureRepository.save(f));
    }

    @Transactional
    public FeatureAdminDto update(AuthUser current, Long id, UpdateFeatureRequest req) {
        if (!accessPolicy.canManageFeatures(current)) {
            throw new ForbiddenException("Chỉ Admin quản lý danh mục chức năng");
        }
        Feature f = featureRepository.findById(id)
                .orElseThrow(() -> new BadRequestException("Không tìm thấy chức năng"));
        if (req.name() != null && !req.name().isBlank()) {
            f.setName(req.name().trim());
        }
        if (req.active() != null) {
            f.setActive(req.active());
        }
        return toAdminDto(featureRepository.save(f));
    }

    private FeatureAdminDto toAdminDto(Feature f) {
        return new FeatureAdminDto(f.getId(), f.getCode(), f.getName(), f.isActive());
    }
}
