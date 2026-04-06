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
    /** Sửa nhân viên toàn hệ thống */
    public static final String EMP_EDIT_ALL = "EMP_EDIT_ALL";
    /** Xem danh sách NV toàn hệ thống */
    public static final String EMP_VIEW_ALL = "EMP_VIEW_ALL";
    /** Xuất Excel danh sách NV */
    public static final String EMP_EXPORT = "EMP_EXPORT";
    /** Duyệt request toàn hệ thống (Admin) */
    public static final String REQ_APPROVE_ALL = "REQ_APPROVE_ALL";

    /** Sửa NV trong phòng (Manager hoặc được cấp) */
    public static final String EMP_EDIT_DEPT = "EMP_EDIT_DEPT";
    /** Xem NV trong phòng */
    public static final String EMP_VIEW_DEPT = "EMP_VIEW_DEPT";
    /** Duyệt request trong phòng */
    public static final String REQ_APPROVE_DEPT = "REQ_APPROVE_DEPT";
}
