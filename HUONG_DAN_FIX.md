# Hướng dẫn fix lỗi và test tính năng mới

## 🐛 Lỗi: Duplicate code trong permission_requests

**Nguyên nhân:** Seed data chạy nhiều lần do điều kiện kiểm tra chỉ dựa vào `features.count()`.

**Đã sửa:**
- `backend/src/main/java/com/utc/employee/config/DataLoader.java`: Thêm kiểm tra `userAccountRepository.count()` để đảm bảo seed chỉ chạy 1 lần.

## ✅ Tính năng mới: STT và Phân trang cho màn Request

### 1. Đã thêm cột STT
- Hiển thị số thứ tự từ 1 đến N theo trang hiện tại
- STT tự động tính dựa trên: `(currentPage - 1) * pageSize + index + 1`

### 2. Đã thêm phân trang
- **Chọn số bản ghi/trang:** 5, 10, 20, 50
- **Điều hướng:** Nút Trước/Sau + số trang
- **Hiển thị thông minh:** Trang đầu, cuối, hiện tại và kế cận (với dấu ...)
- **Tổng số bản ghi:** Hiển thị ở góc trái

### 3. Component mới
- `frontend/src/components/Pagination.tsx`: Component tái sử dụng cho phân trang

## 🚀 Cách fix và test

### Bước 1: Xóa database cũ và khởi động lại

```bash
# Dừng và xóa volume database cũ
docker compose down -v

# Khởi động lại với database mới
docker compose up --build -d

# Đợi 10-15 giây để database khởi động
sleep 15

# Kiểm tra logs
docker compose logs api | tail -30
```

**Hoặc dùng script tự động:**
```bash
chmod +x fix-database.sh
./fix-database.sh
```

### Bước 2: Khởi động frontend

```bash
cd frontend
npm install  # Nếu chưa cài
npm run dev
```

### Bước 3: Test tính năng

1. **Đăng nhập:** http://localhost:5173
   - Admin: `admin` / `admin123`
   - Manager: `manager` / `manager123`
   - Employee: `nhanvien` / `nv123456`

2. **Vào màn Request:** Click "Request cấp quyền" trên menu

3. **Kiểm tra STT:**
   - ✅ Cột STT hiển thị ở đầu bảng
   - ✅ STT bắt đầu từ 1 trên mỗi trang
   - ✅ STT tăng dần theo thứ tự

4. **Kiểm tra phân trang:**
   - ✅ Dropdown chọn số bản ghi/trang (5, 10, 20, 50)
   - ✅ Hiển thị "Tổng X bản ghi"
   - ✅ Nút Trước/Sau hoạt động đúng
   - ✅ Click số trang để chuyển trang
   - ✅ Trang hiện tại được highlight
   - ✅ Dấu "..." hiển thị khi có nhiều trang

5. **Kiểm tra tương tác:**
   - ✅ Tìm kiếm → Reset về trang 1
   - ✅ Lọc nâng cao → Reset về trang 1
   - ✅ Chuyển tab (Đang soạn/Chờ duyệt/Đã duyệt) → Giữ nguyên trang
   - ✅ Thay đổi số bản ghi/trang → Reset về trang 1

6. **Tạo thêm request để test phân trang:**
   - Click "Tạo request"
   - Tạo ít nhất 15-20 request
   - Kiểm tra phân trang hoạt động với nhiều trang

## 📸 Chụp màn hình cho tài liệu

Các màn hình cần chụp:

1. **Màn Request - Tab "Chờ duyệt":**
   - Hiển thị cột STT
   - Hiển thị phân trang với nhiều trang
   - Dropdown chọn số bản ghi/trang

2. **Màn Request - Phân trang:**
   - Trang 1 (STT từ 1)
   - Trang 2 (STT tiếp tục)
   - Hiển thị dấu "..." khi có nhiều trang

3. **Màn Request - Các tab khác:**
   - Tab "Đang soạn"
   - Tab "Đã duyệt"

## 🔍 Kiểm tra lỗi

Nếu vẫn gặp lỗi duplicate code:

```bash
# Kiểm tra logs backend
docker compose logs api | grep -i "duplicate\|constraint"

# Nếu vẫn lỗi, xóa hoàn toàn và rebuild
docker compose down -v
docker system prune -f
docker compose up --build
```

## 📝 Thay đổi code

### Backend
- `backend/src/main/java/com/utc/employee/config/DataLoader.java`
  - Thêm kiểm tra `userAccountRepository.count() > 0`

### Frontend
- `frontend/src/pages/RequestsPage.tsx`
  - Thêm state: `currentPage`, `pageSize`
  - Thêm logic phân trang trong `RequestTable`
  - Thêm cột STT trong table header
  - Thêm component Pagination
  - Reset trang khi search/filter

- `frontend/src/components/Pagination.tsx` (MỚI)
  - Component tái sử dụng cho phân trang

## ✨ Kết quả

- ✅ Fix lỗi duplicate code trong database
- ✅ Thêm cột STT cho màn Request
- ✅ Thêm phân trang đầy đủ chức năng
- ✅ UX tốt: reset trang khi search/filter
- ✅ Responsive và dễ sử dụng

---

**Lưu ý:** Sau khi test xong, nhớ commit code và chụp màn hình cho tài liệu!
