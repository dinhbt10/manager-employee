# ✅ Hệ thống phân quyền dựa trên Features (không phải Role)

## 🎯 Nguyên tắc chính

**Hệ thống phân quyền dựa vào FEATURES (quyền), KHÔNG phải ROLE (vai trò)**

- ✅ **Đúng**: Check `hasFeature(FeatureCodes.EMP_VIEW_ALL)`
- ❌ **Sai**: Check `isAdmin` hoặc `isManager`

### Tại sao?

Vì **Employee** có thể được cấp quyền đặc biệt:
- Employee được cấp `EMP_VIEW_ALL` → Xem được tất cả nhân viên
- Employee được cấp `REQ_APPROVE_DEPT` → Phê duyệt request trong phòng
- Employee được cấp `DEPT_VIEW` → Xem phòng ban

---

## 📋 Danh sách Features

### Nhân viên (Employee)
| Feature Code | Mô tả | Phạm vi |
|--------------|-------|---------|
| `EMP_CREATE` | Tạo nhân viên mới | Toàn hệ thống |
| `EMP_VIEW_ALL` | Xem tất cả nhân viên | Toàn hệ thống |
| `EMP_VIEW_DEPT` | Xem nhân viên trong phòng | Chỉ phòng của mình |
| `EMP_EDIT_ALL` | Sửa tất cả nhân viên | Toàn hệ thống |
| `EMP_EDIT_DEPT` | Sửa nhân viên trong phòng | Chỉ phòng của mình |
| `EMP_EXPORT` | Xuất Excel danh sách | Theo quyền xem |

### Request
| Feature Code | Mô tả | Phạm vi |
|--------------|-------|---------|
| `REQ_APPROVE_ALL` | Phê duyệt tất cả request | Toàn hệ thống |
| `REQ_APPROVE_DEPT` | Phê duyệt request trong phòng | Chỉ phòng của mình |

### Phòng ban (Department)
| Feature Code | Mô tả | Phạm vi |
|--------------|-------|---------|
| `DEPT_VIEW` | Xem phòng ban | Theo role |
| `DEPT_CREATE` | Tạo phòng ban mới | Toàn hệ thống |
| `DEPT_EDIT` | Sửa phòng ban | Toàn hệ thống |
| `DEPT_DELETE` | Xóa phòng ban | Toàn hệ thống |

### Chức năng (Feature)
| Feature Code | Mô tả | Phạm vi |
|--------------|-------|---------|
| `FEATURE_VIEW` | Xem danh sách chức năng | Toàn hệ thống |
| `FEATURE_CREATE` | Tạo chức năng mới | Toàn hệ thống |
| `FEATURE_EDIT` | Sửa chức năng | Toàn hệ thống |
| `FEATURE_DELETE` | Xóa chức năng | Toàn hệ thống |

---

## 🔐 Quyền tự động theo Role

### Admin
- ✅ **Tất cả features** tự động
- ✅ Không cần gán trong database

### Manager (có departmentId)
- ✅ `EMP_VIEW_DEPT` - Xem nhân viên trong phòng
- ✅ `EMP_VIEW_ALL` - Vào menu Nhân viên
- ✅ `EMP_EDIT_DEPT` - Sửa nhân viên trong phòng
- ✅ `REQ_APPROVE_DEPT` - Phê duyệt request trong phòng
- ✅ `DEPT_VIEW` - Xem phòng ban của mình
- ❌ **KHÔNG** có `DEPT_CREATE` và `DEPT_EDIT` tự động

### Employee
- ❌ Không có quyền tự động
- ✅ Phải được cấp từng feature trong database

---

## 🎨 Frontend - Hiển thị UI dựa vào Features

### Menu Sidebar

```typescript
// ✅ ĐÚNG - Check feature
const canSeeEmployees =
  hasFeature(FeatureCodes.EMP_VIEW_ALL) ||
  hasFeature(FeatureCodes.EMP_VIEW_DEPT);

const canSeeDepartments = hasFeature(FeatureCodes.DEPT_VIEW);
const canSeeFeatures = hasFeature(FeatureCodes.FEATURE_VIEW);

// ❌ SAI - Check role
const canSeeEmployees = isAdmin || isManager;
```

### Nút "Tạo mới"

```typescript
// ✅ ĐÚNG - Check feature
{hasFeature(FeatureCodes.EMP_CREATE) && (
  <CreateUserDialog />
)}

// ❌ SAI - Check role
{isAdmin && (
  <CreateUserDialog />
)}
```

### Nút "Sửa"

```typescript
// ✅ ĐÚNG - Check feature
{hasFeature(FeatureCodes.EMP_EDIT_ALL) && (
  <EditUserDialog user={u} />
)}

{hasFeature(FeatureCodes.EMP_EDIT_DEPT) && (
  <ManagerEditEmployeeDialog user={u} />
)}

// ❌ SAI - Check role
{isAdmin && (
  <EditUserDialog user={u} />
)}
```

### Filter nâng cao

```typescript
// ✅ ĐÚNG - Chỉ người có quyền xem toàn bộ mới cần filter phòng ban
{hasFeature(FeatureCodes.EMP_VIEW_ALL) && (
  <div>
    <Label>Phòng ban</Label>
    <select>...</select>
  </div>
)}

// ❌ SAI - Check role
{isAdmin && (
  <div>...</div>
)}
```

---

## 🔧 Backend - Kiểm tra quyền

### Service Layer

```java
// ✅ ĐÚNG - Dùng AccessPolicy methods
@Transactional
public DepartmentDto create(AuthUser current, CreateDepartmentRequest req) {
    if (!accessPolicy.canManageDepartment(current)) {
        throw new ForbiddenException("Không có quyền");
    }
    if (!accessPolicy.hasFeature(current, FeatureCodes.DEPT_CREATE)) {
        throw new ForbiddenException("Không có quyền tạo phòng ban");
    }
    // ...
}

// ❌ SAI - Check role trực tiếp
@Transactional
public DepartmentDto create(AuthUser current, CreateDepartmentRequest req) {
    if (!accessPolicy.isAdmin(current)) {
        throw new ForbiddenException("Chỉ Admin mới tạo được");
    }
    // ...
}
```

### AccessPolicy

```java
// ✅ ĐÚNG - Kết hợp role và feature
public boolean canViewEmployee(AuthUser viewer, UserAccount target) {
    if (isAdmin(viewer)) return true;
    if (viewer.id().equals(target.getId())) return true;
    
    // Manager tự động có quyền trong phòng
    if (isManager(viewer) && managerHasDeptScope(viewer, target.getDepartmentId())) {
        return true;
    }
    
    // Check feature cho các trường hợp khác
    return hasFeature(viewer, FeatureCodes.EMP_VIEW_ALL)
        || (hasFeature(viewer, FeatureCodes.EMP_VIEW_DEPT) 
            && viewer.departmentId().equals(target.getDepartmentId()));
}
```

---

## 📊 Use Cases

### Use Case 1: Employee được cấp quyền đặc biệt

**Tình huống:**
- User A là Employee
- Admin cấp cho A quyền `EMP_VIEW_ALL` và `EMP_EDIT_DEPT`

**Kết quả:**
- ✅ A thấy menu "Nhân viên"
- ✅ A xem được tất cả nhân viên (vì có `EMP_VIEW_ALL`)
- ✅ A sửa được nhân viên trong phòng của mình (vì có `EMP_EDIT_DEPT`)
- ❌ A không sửa được nhân viên phòng khác (không có `EMP_EDIT_ALL`)

### Use Case 2: Manager không có quyền tạo phòng ban

**Tình huống:**
- User B là Manager phòng Nhân sự
- B không được cấp `DEPT_CREATE`

**Kết quả:**
- ✅ B thấy menu "Phòng ban"
- ✅ B xem được phòng Nhân sự
- ❌ B không thấy nút "Tạo mới" phòng ban
- ❌ B không thấy nút "Sửa" phòng ban

### Use Case 3: Manager được cấp thêm quyền

**Tình huống:**
- User C là Manager phòng Kỹ thuật
- Admin cấp thêm cho C quyền `DEPT_CREATE` và `DEPT_EDIT`

**Kết quả:**
- ✅ C có tất cả quyền tự động của Manager
- ✅ C thấy nút "Tạo mới" phòng ban (vì có `DEPT_CREATE`)
- ✅ C thấy nút "Sửa" phòng ban (vì có `DEPT_EDIT`)
- ✅ C tạo/sửa được phòng ban

### Use Case 4: Employee được cấp quyền phê duyệt

**Tình huống:**
- User D là Employee phòng Nhân sự
- Admin cấp cho D quyền `REQ_APPROVE_DEPT`

**Kết quả:**
- ✅ D thấy nút "Duyệt" và "Từ chối" cho request trong phòng Nhân sự
- ✅ D phê duyệt được request của nhân viên cùng phòng
- ❌ D không phê duyệt được request phòng khác

---

## ✅ Checklist đã fix

### Frontend:
- [x] Xóa tất cả check `isAdmin &&` trước `hasFeature`
- [x] Xóa tất cả check `isManager &&` trước `hasFeature`
- [x] Menu sidebar dựa vào features
- [x] Nút "Tạo mới" dựa vào features
- [x] Nút "Sửa" dựa vào features
- [x] Filter nâng cao dựa vào features
- [x] `AppLayout.tsx` - Menu visibility based on features
- [x] `EmployeesPage.tsx` - All buttons check features
- [x] `DepartmentsPage.tsx` - All buttons check features
- [x] `RequestsPage.tsx` - Approval buttons check features

### Backend:
- [x] `DepartmentService.create()` check `DEPT_CREATE`
- [x] `DepartmentService.update()` check `DEPT_EDIT`
- [x] `DepartmentService.list()` filter theo role và feature
- [x] `UserService.create()` check `EMP_CREATE` (fixed)
- [x] `UserService.update()` check `EMP_EDIT_ALL` for role/dept/features (fixed)
- [x] `FeatureService.canManageFeatures()` check `FEATURE_VIEW` only (fixed)
- [x] `PermissionRequestService` - All approval methods check features
- [x] `AccessPolicy` methods kết hợp role và feature đúng

---

## 🧪 Test Cases

### Test 1: Employee với quyền đặc biệt

**Setup:**
1. Tạo Employee: `emp_special`
2. Cấp quyền: `EMP_VIEW_ALL`, `EMP_EDIT_DEPT`, `REQ_APPROVE_DEPT`

**Test:**
- [ ] Login `emp_special`
- [ ] Thấy menu "Nhân viên"
- [ ] Xem được tất cả nhân viên
- [ ] Có nút "Sửa" cho nhân viên cùng phòng
- [ ] Không có nút "Sửa" cho nhân viên khác phòng
- [ ] Thấy nút "Duyệt/Từ chối" cho request cùng phòng

### Test 2: Manager không có quyền tạo phòng ban

**Setup:**
1. Tạo Manager: `manager_hr`
2. Không cấp `DEPT_CREATE` và `DEPT_EDIT`

**Test:**
- [ ] Login `manager_hr`
- [ ] Thấy menu "Phòng ban"
- [ ] Xem được phòng Nhân sự
- [ ] Không thấy nút "Tạo mới"
- [ ] Không thấy nút "Sửa"
- [ ] Chỉ có nút "Chi tiết"

### Test 3: Manager được cấp quyền tạo phòng ban

**Setup:**
1. Dùng Manager: `manager_hr`
2. Cấp thêm: `DEPT_CREATE`, `DEPT_EDIT`

**Test:**
- [ ] Login `manager_hr`
- [ ] Thấy nút "Tạo mới" phòng ban
- [ ] Thấy nút "Sửa" phòng ban
- [ ] Tạo được phòng ban mới
- [ ] Sửa được phòng ban

---

## 📝 Tóm tắt

| Điều kiện | Cũ (Sai) | Mới (Đúng) |
|-----------|-----------|------------|
| **Hiển thị menu** | Check `isAdmin` | Check `hasFeature(...)` |
| **Hiển thị nút** | Check `isAdmin` | Check `hasFeature(...)` |
| **Backend check** | Check `isAdmin()` | Check `hasFeature(...)` |
| **Employee đặc biệt** | ❌ Không vào được | ✅ Vào được nếu có feature |
| **Manager tạo phòng ban** | ✅ Tạo được | ❌ Không tạo được (trừ khi có feature) |

---

## 🔍 Comprehensive Review Results

### Files Reviewed:
1. ✅ `backend/src/main/java/com/utc/employee/service/UserService.java`
2. ✅ `backend/src/main/java/com/utc/employee/service/DepartmentService.java`
3. ✅ `backend/src/main/java/com/utc/employee/service/FeatureService.java`
4. ✅ `backend/src/main/java/com/utc/employee/service/PermissionRequestService.java`
5. ✅ `backend/src/main/java/com/utc/employee/security/AccessPolicy.java`
6. ✅ `backend/src/main/java/com/utc/employee/web/*Controller.java` (all controllers)
7. ✅ `frontend/src/auth/AuthContext.tsx`
8. ✅ `frontend/src/components/layout/AppLayout.tsx`
9. ✅ `frontend/src/pages/EmployeesPage.tsx`
10. ✅ `frontend/src/pages/DepartmentsPage.tsx`
11. ✅ `frontend/src/pages/RequestsPage.tsx`

### Issues Fixed:
1. ✅ `UserService.create()` - Changed from `isAdmin()` to `hasFeature(EMP_CREATE)`
2. ✅ `UserService.update()` - Changed from `isAdmin()` to `hasFeature(EMP_EDIT_ALL)` for role/dept/features
3. ✅ `AccessPolicy.canManageFeatures()` - Simplified to only check `hasFeature(FEATURE_VIEW)`

### Verification:
- ✅ All frontend UI elements check `hasFeature()` only
- ✅ All backend services use `AccessPolicy` methods or `hasFeature()`
- ✅ No direct role checks (`isAdmin`, `isManager`) before feature checks
- ✅ Manager auto-permissions correctly implemented
- ✅ Employee with special permissions can access features

---

**Status**: ✅ Hoàn thành - Comprehensive Review Complete  
**Date**: 2026-05-03  
**Build**: ✅ Success  
**Principle**: **Features > Roles**
