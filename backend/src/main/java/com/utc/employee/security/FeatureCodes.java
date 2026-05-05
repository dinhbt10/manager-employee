package com.utc.employee.security;

/**
 * Mã chức năng cấp động (lưu trong bảng features + gán user_features).
 * Quản lý / Admin có quyền theo role, không nhất thiết cần từng dòng trong DB.
 */
public final class FeatureCodes {

    private FeatureCodes() {
    }

    /** Thêm nhân viên (ngoài luồng request — chủ yếu Admin) */
    public static final String EMP_CREATE = "EMP_CREATE";
    /** Xuất Excel danh sách NV */
    public static final String EMP_EXPORT = "EMP_EXPORT";

    /** Sửa NV trong phòng (Manager hoặc được cấp) */
    public static final String EMP_EDIT_DEPT = "EMP_EDIT_DEPT";
    /** Xem NV trong phòng */
    public static final String EMP_VIEW_DEPT = "EMP_VIEW_DEPT";
    /** Duyệt request trong phòng */
    public static final String REQ_APPROVE_DEPT = "REQ_APPROVE_DEPT";

    /** Xem danh sách phòng ban */
    public static final String DEPT_VIEW = "DEPT_VIEW";
    /** Thêm phòng ban */
    public static final String DEPT_CREATE = "DEPT_CREATE";
    /** Sửa phòng ban */
    public static final String DEPT_EDIT = "DEPT_EDIT";
    /** Xóa phòng ban */
    public static final String DEPT_DELETE = "DEPT_DELETE";

    /** Xem danh sách chức năng */
    public static final String FEATURE_VIEW = "FEATURE_VIEW";
    /** Thêm chức năng */
    public static final String FEATURE_CREATE = "FEATURE_CREATE";
    /** Sửa chức năng */
    public static final String FEATURE_EDIT = "FEATURE_EDIT";
    /** Xóa chức năng */
    public static final String FEATURE_DELETE = "FEATURE_DELETE";
}
