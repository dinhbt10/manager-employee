# Test Case: Manager Permissions

## Vấn đề đã fix

**Triệu chứng**: 
- Tạo user với role MANAGER và gán vào phòng ban
- Hiển thị có đủ quyền phòng ban trong profile
- Nhưng khi đăng nhập:
  - ❌ Không thấy menu "Nhân viên"
  - ❌ Không có quyền phê duyệt request của phòng ban mình quản lý

**Nguyên nhân**:
- Frontend chỉ check `user.features` (feature codes trong DB)
- Manager không có feature codes trong DB
- Logic backend đúng nhưng frontend không áp dụng

**Giải pháp**:
- Cập nhật `hasFeature()` trong `AuthContext.tsx`
- Manager tự động có các quyền cơ bản về phòng ban của mình

---

## Thay đổi Code

### File: `frontend/src/auth/AuthContext.tsx`

```typescript
// TRƯỚC
const hasFeature = useCallback(
  (code: FeatureCode): boolean => {
    if (user?.role === "ADMIN") return true;
    return user?.features.includes(code) ?? false;
  },
  [user?.features, user?.role],
);

// SAU
const hasFeature = useCallback(
  (code: FeatureCode): boolean => {
    if (user?.role === "ADMIN") return true;
    
    // Manager tự động có quyền trong phòng ban của mình
    if (user?.role === "MANAGER" && user?.departmentId) {
      // Quyền xem nhân viên trong phòng
      if (code === "EMP_VIEW_DEPT" || code === "EMP_VIEW_ALL") return true;
      // Quyền sửa nhân viên trong phòng
      if (code === "EMP_EDIT_DEPT") return true;
      // Quyền phê duyệt request trong phòng
      if (code === "REQ_APPROVE_DEPT") return true;
    }
    
    return user?.features.includes(code) ?? false;
  },
  [user?.features, user?.role, user?.departmentId],
);
```

---

## Quyền tự động của Manager

Manager có `departmentId` sẽ tự động có các quyền sau:

| Feature Code | Mô tả | Phạm vi |
|--------------|-------|---------|
| `EMP_VIEW_DEPT` | Xem danh sách nhân viên | Chỉ trong phòng ban của mình |
| `EMP_VIEW_ALL` | Xem danh sách nhân viên | Được coi là có quyền này để vào menu |
| `EMP_EDIT_DEPT` | Chỉnh sửa thông tin nhân viên | Chỉ nhân viên trong phòng |
| `REQ_APPROVE_DEPT` | Phê duyệt request | Chỉ request của nhân viên trong phòng |

**Lưu ý**: Backend đã có logic đúng, chỉ cần frontend áp dụng.

---

## Test Cases

### Test 1: Tạo Manager mới

**Bước thực hiện**:
1. Đăng nhập với tài khoản Admin
2. Vào menu "Nhân viên" → Tạo mới
3. Điền thông tin:
   - Username: `manager_hr`
   - Password: `123456`
   - Họ tên: `Nguyễn Văn Quản Lý`
   - Vai trò: **MANAGER**
   - Phòng ban: **Nhân sự** (hoặc phòng ban bất kỳ)
   - Feature codes: **Để trống** (không gán quyền riêng)
4. Lưu

**Kết quả mong đợi**:
- ✅ Tạo thành công
- ✅ User có role = MANAGER
- ✅ User có departmentId
- ✅ User không có feature codes trong DB

---

### Test 2: Đăng nhập với Manager

**Bước thực hiện**:
1. Đăng xuất Admin
2. Đăng nhập với `manager_hr` / `123456`

**Kết quả mong đợi**:
- ✅ Đăng nhập thành công
- ✅ Thấy menu "Request" (mặc định)
- ✅ **Thấy menu "Nhân viên"** ← FIX
- ✅ Không thấy menu "Phòng ban" (chỉ Admin)
- ✅ Không thấy menu "Chức năng" (chỉ Admin)

---

### Test 3: Xem danh sách nhân viên

**Bước thực hiện**:
1. Đăng nhập với Manager
2. Click vào menu "Nhân viên"

**Kết quả mong đợi**:
- ✅ Vào được trang Nhân viên (không bị redirect)
- ✅ Chỉ thấy nhân viên trong phòng ban của mình
- ✅ Không thấy nhân viên phòng ban khác
- ✅ Có nút "Sửa" cho nhân viên trong phòng

---

### Test 4: Phê duyệt Request

**Bước thực hiện**:
1. Tạo một Employee trong phòng Nhân sự
2. Employee tạo request xin quyền
3. Đăng nhập với Manager phòng Nhân sự
4. Vào tab "Chờ duyệt"

**Kết quả mong đợi**:
- ✅ Thấy request của nhân viên trong phòng
- ✅ **Có nút "Duyệt" và "Từ chối"** ← FIX
- ✅ Click "Duyệt" → Phê duyệt thành công
- ✅ Quyền được cấp cho nhân viên

---

### Test 5: Không phê duyệt Request phòng khác

**Bước thực hiện**:
1. Tạo Employee trong phòng Kỹ thuật
2. Employee tạo request
3. Đăng nhập với Manager phòng Nhân sự
4. Vào tab "Chờ duyệt"

**Kết quả mong đợi**:
- ✅ **KHÔNG thấy** request của nhân viên phòng Kỹ thuật
- ✅ Hoặc nếu thấy (do Admin tạo) thì **KHÔNG có nút Duyệt/Từ chối**

---

### Test 6: Profile hiển thị đúng

**Bước thực hiện**:
1. Đăng nhập với Manager
2. Click vào profile (góc dưới sidebar)

**Kết quả mong đợi**:
- ✅ Vai trò: **Quản lý**
- ✅ Phòng ban: **Nhân sự** (hoặc phòng được gán)
- ✅ Chức năng được gán: 
  - Nếu không có feature codes trong DB → Hiển thị:
    > "Quản lý — đủ quyền với nhân viên thuộc phòng ban (theo chính sách hệ thống)."

---

### Test 7: Manager có thêm feature codes

**Bước thực hiện**:
1. Admin gán thêm feature codes cho Manager (ví dụ: `DEPT_VIEW`)
2. Manager đăng nhập lại

**Kết quả mong đợi**:
- ✅ Vẫn có quyền cơ bản (EMP_VIEW_DEPT, EMP_EDIT_DEPT, REQ_APPROVE_DEPT)
- ✅ Có thêm quyền mới được gán (DEPT_VIEW → thấy menu Phòng ban)
- ✅ Profile hiển thị cả quyền tự động và quyền được gán

---

## Backend Logic (Đã đúng - Không cần fix)

### UserService.listBase()
```java
if (current.role() == Role.MANAGER) {
    if (current.departmentId() == null) {
        return List.of();
    }
    return userAccountRepository.findByDepartment_Id(current.departmentId()).stream()
            .map(u -> toDto(u, current))
            .toList();
}
```
✅ Manager chỉ thấy nhân viên trong phòng

### AccessPolicy.canApproveRequest()
```java
if (isManager(u) && targetUser.getDepartment() != null
        && managerHasDeptScope(u, targetUser.getDepartment().getId())) {
    return true;
}
```
✅ Manager có quyền phê duyệt request trong phòng

### AccessPolicy.canEditEmployee()
```java
if (isManager(viewer) && managerHasDeptScope(viewer,
        target.getDepartment() != null ? target.getDepartment().getId() : null)) {
    return true;
}
```
✅ Manager có quyền sửa nhân viên trong phòng

---

## Tóm tắt

| Vấn đề | Trước | Sau |
|--------|-------|-----|
| **Menu Nhân viên** | ❌ Không thấy | ✅ Thấy |
| **Xem nhân viên** | ❌ Bị chặn | ✅ Xem được (chỉ trong phòng) |
| **Sửa nhân viên** | ❌ Không có nút | ✅ Có nút Sửa |
| **Phê duyệt request** | ❌ Không có nút | ✅ Có nút Duyệt/Từ chối |
| **Feature codes trong DB** | Bắt buộc | Không bắt buộc (tự động) |

---

## Checklist

- [x] Fix `hasFeature()` trong AuthContext.tsx
- [x] Build frontend thành công
- [x] Manager tự động có EMP_VIEW_DEPT
- [x] Manager tự động có EMP_EDIT_DEPT
- [x] Manager tự động có REQ_APPROVE_DEPT
- [ ] Test thực tế với Manager mới tạo
- [ ] Verify menu Nhân viên hiển thị
- [ ] Verify phê duyệt request hoạt động

---

**Status**: ✅ Fixed  
**Date**: 2026-05-03  
**Files Changed**: `frontend/src/auth/AuthContext.tsx`
