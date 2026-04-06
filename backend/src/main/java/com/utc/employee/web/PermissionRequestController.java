package com.utc.employee.web;

import com.utc.employee.service.PermissionRequestService;
import com.utc.employee.web.dto.CreatePermissionRequestBody;
import com.utc.employee.web.dto.PermissionRequestDto;
import com.utc.employee.web.dto.ReviewRequestBody;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/requests")
public class PermissionRequestController {

    private final PermissionRequestService permissionRequestService;
    private final CurrentUser currentUser;

    public PermissionRequestController(
            PermissionRequestService permissionRequestService,
            CurrentUser currentUser
    ) {
        this.permissionRequestService = permissionRequestService;
        this.currentUser = currentUser;
    }

    @GetMapping
    public List<PermissionRequestDto> list(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) List<String> status,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) Long requesterId,
            @RequestParam(required = false) Long targetUserId,
            @RequestParam(required = false) String createdFrom,
            @RequestParam(required = false) String createdTo,
            @RequestParam(required = false) String featureCode
    ) {
        return permissionRequestService.listVisible(
                currentUser.get(),
                q,
                status,
                departmentId,
                requesterId,
                targetUserId,
                createdFrom,
                createdTo,
                featureCode
        );
    }

    @GetMapping("/{id}")
    public PermissionRequestDto get(@PathVariable Long id) {
        return permissionRequestService.get(currentUser.get(), id);
    }

    @PostMapping
    public PermissionRequestDto create(@Valid @RequestBody CreatePermissionRequestBody body) {
        return permissionRequestService.create(currentUser.get(), body);
    }

    @PatchMapping("/{id}")
    public PermissionRequestDto update(@PathVariable Long id, @Valid @RequestBody CreatePermissionRequestBody body) {
        return permissionRequestService.update(currentUser.get(), id, body);
    }

    @PostMapping("/{id}/submit")
    public PermissionRequestDto submit(@PathVariable Long id) {
        return permissionRequestService.submit(currentUser.get(), id);
    }

    @PostMapping("/{id}/approve")
    public PermissionRequestDto approve(@PathVariable Long id) {
        return permissionRequestService.approve(currentUser.get(), id);
    }

    @PostMapping("/{id}/reject")
    public PermissionRequestDto reject(@PathVariable Long id, @RequestBody ReviewRequestBody body) {
        return permissionRequestService.reject(currentUser.get(), id, body);
    }

    @PostMapping("/{id}/revoke")
    public PermissionRequestDto revoke(@PathVariable Long id) {
        return permissionRequestService.revoke(currentUser.get(), id);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        permissionRequestService.delete(currentUser.get(), id);
    }
}
