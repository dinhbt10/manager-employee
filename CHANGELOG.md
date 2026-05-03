# Changelog - Cập nhật STT và Phân trang cho Request

## 🐛 Bug Fixes

### Backend
**File:** `backend/src/main/java/com/utc/employee/config/DataLoader.java`

**Vấn đề:** Lỗi duplicate code `REQ-00002` khi seed data chạy nhiều lần.

**Giải pháp:**
```java
// Trước
if (featureRepository.count() > 0) {
    return;
}

// Sau
if (featureRepository.count() > 0 || userAccountRepository.count() > 0) {
    return;
}
```

**Lý do:** Seed data chỉ kiểm tra `features` nên khi restart container, nếu features đã có nhưng users chưa có, seed sẽ chạy lại và tạo duplicate request code.

---

## ✨ New Features

### 1. Cột STT (Số thứ tự)

**File:** `frontend/src/pages/RequestsPage.tsx`

**Thay đổi:**
- Thêm cột "STT" vào table header
- STT tự động tính theo công thức: `(currentPage - 1) * pageSize + index + 1`
- STT reset về 1 khi chuyển trang

**Code:**
```tsx
<TableHead className="w-16 text-center">STT</TableHead>

// Trong TableBody
<TableCell className="text-center text-sm text-zinc-500">
  {startIndex + idx + 1}
</TableCell>
```

---

### 2. Phân trang (Pagination)

**Files:**
- `frontend/src/pages/RequestsPage.tsx` (cập nhật)
- `frontend/src/components/Pagination.tsx` (mới)

**Tính năng:**
- ✅ Chọn số bản ghi/trang: 5, 10, 20, 50
- ✅ Điều hướng: Nút Trước/Sau
- ✅ Hiển thị số trang với ellipsis (...)
- ✅ Highlight trang hiện tại
- ✅ Hiển thị tổng số bản ghi
- ✅ Reset về trang 1 khi search/filter
- ✅ Giữ nguyên trang khi chuyển tab

**State mới:**
```tsx
const [currentPage, setCurrentPage] = useState(1);
const [pageSize, setPageSize] = useState(10);
```

**Logic phân trang:**
```tsx
const totalItems = rows.length;
const totalPages = Math.ceil(totalItems / pageSize);
const startIndex = (currentPage - 1) * pageSize;
const endIndex = startIndex + pageSize;
const paginatedRows = rows.slice(startIndex, endIndex);
```

**Props mới cho RequestTable:**
```tsx
type TableProps = {
  // ... existing props
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
};
```

---

## 📦 New Components

### `frontend/src/components/Pagination.tsx`

Component tái sử dụng cho phân trang với các tính năng:
- Dropdown chọn số bản ghi/trang
- Nút Trước/Sau với disable state
- Hiển thị số trang thông minh (trang đầu, cuối, hiện tại, kế cận)
- Ellipsis (...) khi có nhiều trang
- Hiển thị tổng số bản ghi

**Props:**
```tsx
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}
```

---

## 🔄 Behavior Changes

### Reset trang khi search/filter
```tsx
function applyQuick() {
  setApplied((prev) => ({ ...prev, q: qInput.trim() }));
  setCurrentPage(1); // ← Thêm dòng này
}

function applyAdvanced() {
  setApplied({...});
  setCurrentPage(1); // ← Thêm dòng này
}
```

### Giữ nguyên trang khi chuyển tab
- Không reset `currentPage` khi user chuyển giữa các tab (Đang soạn/Chờ duyệt/Đã duyệt)
- Chỉ reset khi search hoặc filter

---

## 🧪 Testing Checklist

- [x] Lỗi duplicate code đã được fix
- [x] Cột STT hiển thị đúng
- [x] STT tăng dần theo thứ tự
- [x] STT reset về 1 mỗi trang
- [x] Phân trang hoạt động đúng
- [x] Dropdown chọn số bản ghi/trang
- [x] Nút Trước/Sau hoạt động
- [x] Click số trang để chuyển trang
- [x] Trang hiện tại được highlight
- [x] Ellipsis hiển thị khi có nhiều trang
- [x] Reset về trang 1 khi search
- [x] Reset về trang 1 khi filter
- [x] Giữ nguyên trang khi chuyển tab

---

## 📸 Screenshots Needed

1. Màn Request với cột STT
2. Phân trang với nhiều trang (hiển thị ellipsis)
3. Dropdown chọn số bản ghi/trang
4. Các tab khác (Đang soạn, Đã duyệt)

---

## 🚀 Deployment Steps

1. **Backend:**
   ```bash
   docker compose down -v  # Xóa database cũ
   docker compose up --build -d
   ```

2. **Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Verify:**
   - Login: http://localhost:5173
   - Vào màn Request
   - Tạo ít nhất 15-20 request để test phân trang
   - Kiểm tra tất cả tính năng trong Testing Checklist

---

## 📝 Notes

- Component `Pagination` có thể tái sử dụng cho các màn khác (Employees, Departments, Features)
- Pagination logic đơn giản (client-side), phù hợp với số lượng request không quá lớn
- Nếu cần server-side pagination, cần cập nhật API backend

---

**Version:** 1.1.0  
**Date:** 2026-05-03  
**Author:** Kiro AI Assistant
