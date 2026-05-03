package com.utc.employee.security;

import com.utc.employee.domain.Role;
import com.utc.employee.domain.UserAccount;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class AccessPolicy {

    public boolean isAdmin(AuthUser u) {
        if (u != null && u.role() == Role.ADMIN) {
            return true;
        }
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth instanceof AnonymousAuthenticationToken) {
            return false;
        }
        return auth.getAuthorities().stream().anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
    }

    public boolean isManager(AuthUser u) {
        return u != null && u.role() == Role.MANAGER;
    }

    public boolean canManageDepartment(AuthUser u) {
        if (isAdmin(u)) {
            return true;
        }
        return hasFeature(u, FeatureCodes.DEPT_VIEW);
    }

    /** Danh mục mã chức năng (cấu hình hệ thống) — Admin hoặc có feature FEATURE_VIEW. */
    public boolean canManageFeatures(AuthUser u) {
        return hasFeature(u, FeatureCodes.FEATURE_VIEW);
    }

    public boolean hasFeature(AuthUser u, String code) {
        if (u == null) {
            return false;
        }
        if (isAdmin(u)) {
            return true;
        }
        return u.featureCodes() != null && u.featureCodes().contains(code);
    }

    /** Manager: quyền đầy đủ trong phòng ban (không cần từng feature trong DB). */
    public boolean managerHasDeptScope(AuthUser u, Long departmentId) {
        if (!isManager(u) || u.departmentId() == null || departmentId == null) {
            return false;
        }
        return u.departmentId().equals(departmentId);
    }

    public boolean canViewEmployee(AuthUser viewer, UserAccount target) {
        if (isAdmin(viewer)) {
            return true;
        }
        if (viewer.id().equals(target.getId())) {
            return true;
        }
        if (isManager(viewer)
                && target.getDepartment() != null
                && viewer.departmentId() != null
                && viewer.departmentId().equals(target.getDepartment().getId())) {
            return true;
        }
        return hasFeature(viewer, FeatureCodes.EMP_VIEW_ALL)
                || (hasFeature(viewer, FeatureCodes.EMP_VIEW_DEPT)
                        && target.getDepartment() != null
                        && viewer.departmentId() != null
                        && viewer.departmentId().equals(target.getDepartment().getId()));
    }

    public boolean canEditEmployee(AuthUser viewer, UserAccount target) {
        if (isAdmin(viewer)) {
            return true;
        }
        if (isManager(viewer) && managerHasDeptScope(viewer,
                target.getDepartment() != null ? target.getDepartment().getId() : null)) {
            return true;
        }
        if (hasFeature(viewer, FeatureCodes.EMP_EDIT_ALL)) {
            return true;
        }
        return hasFeature(viewer, FeatureCodes.EMP_EDIT_DEPT)
                && target.getDepartment() != null
                && viewer.departmentId() != null
                && viewer.departmentId().equals(target.getDepartment().getId());
    }

    public boolean canApproveRequest(AuthUser u, UserAccount targetUser) {
        if (isAdmin(u)) {
            return true;
        }
        if (isManager(u) && targetUser.getDepartment() != null
                && managerHasDeptScope(u, targetUser.getDepartment().getId())) {
            return true;
        }
        return hasFeature(u, FeatureCodes.REQ_APPROVE_ALL)
                || (hasFeature(u, FeatureCodes.REQ_APPROVE_DEPT)
                        && targetUser.getDepartment() != null
                        && u.departmentId() != null
                        && u.departmentId().equals(targetUser.getDepartment().getId()));
    }
}
