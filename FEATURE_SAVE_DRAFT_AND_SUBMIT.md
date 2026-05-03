# Tính năng: Nút "Lưu nháp" và "Gửi duyệt" cho Permission Request

## Tóm tắt thay đổi

Đã thêm 2 nút riêng biệt "Lưu nháp" và "Gửi duyệt" trong form tạo/chỉnh sửa permission request với logic phân quyền tự động.

## Backend Changes

### 1. PermissionRequestService.java

#### Thêm method `saveDraft()`
```java
@Transactional
public PermissionRequestDto saveDraft(AuthUser current, Long id, CreatePermissionRequestBody body)
```
- Cho phép lưu request ở trạng thái DRAFT hoặc REJECTED về DRAFT
- Chỉ người tạo mới có thể lưu nháp
- Validate các trường bắt buộc và feature codes

#### Cập nhật method `submit()`
```java
@Transactional
public PermissionRequestDto submit(AuthUser current, Long id)
```
- **Logic mới**: Kiểm tra quyền của người gửi
  - Nếu người gửi là **Manager/Admin** có quyền phê duyệt → Tự động phê duyệt (APPROVED)
  - Nếu người gửi là **Employee** → Chuyển sang chờ duyệt (PENDING)
- Sử dụng `accessPolicy.canApproveRequest()` để kiểm tra quyền

### 2. PermissionRequestController.java

#### Thêm endpoint mới
```java
@PostMapping("/{id}/save-draft")
public PermissionRequestDto saveDraft(@PathVariable Long id, @Valid @RequestBody CreatePermissionRequestBody body)
```

## Frontend Changes

### 1. CreateRequestDialog Component

#### Thêm 2 nút riêng biệt:
- **Nút "Lưu nháp"** (variant: secondary)
  - Tạo request với trạng thái DRAFT
  - Enable khi: `title.trim() && targetUserId !== "" && selected.size > 0`
  
- **Nút "Gửi duyệt"** (variant: default/primary)
  - Tạo request và gọi API submit ngay
  - Enable khi: `title.trim() && targetUserId !== "" && selected.size > 0`
  - Hiển thị toast khác nhau:
    - Manager/Admin: "Đã tạo và phê duyệt request"
    - Employee: "Đã tạo và gửi duyệt request"

### 2. EditRequestDialog Component

#### Thêm 2 nút riêng biệt:
- **Nút "Lưu nháp"** (variant: secondary)
  - Gọi API `/requests/{id}/save-draft`
  - Chuyển request về trạng thái DRAFT
  - Enable khi: `title.trim() && selected.size > 0`
  
- **Nút "Gửi duyệt"** (variant: default/primary)
  - Cập nhật request trước (PATCH)
  - Sau đó gọi API submit
  - Enable khi: `title.trim() && selected.size > 0`
  - Hiển thị toast khác nhau:
    - Manager/Admin: "Đã phê duyệt request"
    - Employee: "Đã gửi duyệt"

### 3. RequestTable Component

#### Xóa nút "Gửi duyệt" cũ
- Đã xóa nút "Gửi duyệt" riêng lẻ trong bảng
- Chức năng này đã được tích hợp vào dialog chỉnh sửa

## Logic phân quyền

### Khi tạo mới request:
1. **Employee**:
   - Nhấn "Lưu nháp" → Trạng thái: DRAFT
   - Nhấn "Gửi duyệt" → Trạng thái: PENDING (chờ Manager/Admin duyệt)

2. **Manager** (quản lý phòng ban của target user):
   - Nhấn "Lưu nháp" → Trạng thái: DRAFT
   - Nhấn "Gửi duyệt" → Trạng thái: APPROVED (tự động phê duyệt)

3. **Admin**:
   - Nhấn "Lưu nháp" → Trạng thái: DRAFT
   - Nhấn "Gửi duyệt" → Trạng thái: APPROVED (tự động phê duyệt)

### Khi chỉnh sửa request:

#### Request có trạng thái DRAFT:
1. **Employee**:
   - Nhấn "Lưu nháp" → Giữ trạng thái: DRAFT
   - Nhấn "Gửi duyệt" → Chuyển sang: PENDING

2. **Manager/Admin**:
   - Nhấn "Lưu nháp" → Giữ trạng thái: DRAFT
   - Nhấn "Gửi duyệt" → Chuyển sang: APPROVED

#### Request có trạng thái REJECTED:
1. **Employee**:
   - Nhấn "Lưu nháp" → Chuyển về: DRAFT
   - Nhấn "Gửi duyệt" → Chuyển sang: PENDING

2. **Manager/Admin**:
   - Nhấn "Lưu nháp" → Chuyển về: DRAFT
   - Nhấn "Gửi duyệt" → Chuyển sang: APPROVED

## Validation

### Cả 2 nút đều chỉ enable khi:
- ✅ Tiêu đề không rỗng (`title.trim()`)
- ✅ Đã chọn nhân viên đích (`targetUserId !== ""`)
- ✅ Đã chọn ít nhất 1 chức năng (`selected.size > 0`)
- ✅ Không đang trong quá trình submit/save

### Backend validation:
- Kiểm tra tất cả feature codes phải đang active
- Kiểm tra quyền của người thực hiện
- Kiểm tra trạng thái request hợp lệ

## Testing Checklist

### Backend:
- [ ] Test endpoint `/requests/{id}/save-draft`
- [ ] Test logic tự động phê duyệt trong `submit()` cho Manager
- [ ] Test logic tự động phê duyệt trong `submit()` cho Admin
- [ ] Test Employee vẫn chuyển sang PENDING khi submit

### Frontend:
- [ ] Test nút "Lưu nháp" trong form tạo mới
- [ ] Test nút "Gửi duyệt" trong form tạo mới
- [ ] Test nút "Lưu nháp" trong form chỉnh sửa
- [ ] Test nút "Gửi duyệt" trong form chỉnh sửa
- [ ] Test validation enable/disable nút
- [ ] Test toast message khác nhau cho Manager/Admin vs Employee
- [ ] Test với request DRAFT
- [ ] Test với request REJECTED

## Files Changed

### Backend:
1. `backend/src/main/java/com/utc/employee/service/PermissionRequestService.java`
   - Thêm method `saveDraft()`
   - Cập nhật method `submit()` với logic tự động phê duyệt

2. `backend/src/main/java/com/utc/employee/web/PermissionRequestController.java`
   - Thêm endpoint `POST /api/requests/{id}/save-draft`

### Frontend:
1. `frontend/src/pages/RequestsPage.tsx`
   - Cập nhật `CreateRequestDialog`: thêm 2 nút và logic
   - Cập nhật `EditRequestDialog`: thêm 2 nút và logic
   - Xóa nút "Gửi duyệt" trong bảng
   - Xóa hàm `submit()` không dùng
   - Xóa import `Send` icon

## Notes

- Tất cả validation đều được thực hiện ở cả frontend và backend
- Toast messages được customize theo role của user
- Form được reset sau khi thành công
- Không cần thay đổi database schema
- Tương thích ngược với code cũ
