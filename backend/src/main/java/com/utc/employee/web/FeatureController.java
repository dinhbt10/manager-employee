package com.utc.employee.web;

import com.utc.employee.service.FeatureService;
import com.utc.employee.web.dto.CreateFeatureRequest;
import com.utc.employee.web.dto.FeatureAdminDto;
import com.utc.employee.web.dto.FeatureOptionDto;
import com.utc.employee.web.dto.UpdateFeatureRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/features")
public class FeatureController {

    private final FeatureService featureService;
    private final CurrentUser currentUser;

    public FeatureController(FeatureService featureService, CurrentUser currentUser) {
        this.featureService = featureService;
        this.currentUser = currentUser;
    }

    /** Chức năng đang hoạt động — dropdown gán quyền, request. */
    @GetMapping
    public List<FeatureOptionDto> list() {
        return featureService.listActiveOptions();
    }

    /** Danh mục đầy đủ (kể cả ngưng) — chỉ Admin. Gộp vào cùng controller với GET /api/features để tránh endpoint riêng không được deploy. */
    @GetMapping("/catalog")
    public List<FeatureAdminDto> listCatalog(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Boolean active
    ) {
        return featureService.listAllForAdmin(currentUser.get(), q, active);
    }

    @PostMapping("/catalog")
    public FeatureAdminDto create(@Valid @RequestBody CreateFeatureRequest req) {
        return featureService.create(currentUser.get(), req);
    }

    @PatchMapping("/catalog/{id}")
    public FeatureAdminDto update(@PathVariable Long id, @Valid @RequestBody UpdateFeatureRequest req) {
        return featureService.update(currentUser.get(), id, req);
    }
}
