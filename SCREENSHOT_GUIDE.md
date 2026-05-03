# 📸 Hướng dẫn chụp màn hình cho tài liệu

## 🎯 Mục đích
Chụp màn hình để minh họa tính năng **STT** và **Phân trang** cho màn Request trong tài liệu.

## 📋 Chuẩn bị

### 1. Đảm bảo hệ thống đang chạy
```bash
# Kiểm tra backend
curl http://localhost:8080/actuator/health

# Kiểm tra frontend
# Mở http://localhost:5173 trên trình duyệt
```

### 2. Tạo dữ liệu test
- Đăng nhập với tài khoản **admin** / **admin123**
- Tạo ít nhất **20-25 request** để có đủ dữ liệu phân trang
- Các request nên có trạng thái khác nhau (Draft, Pending, Approved)

### 3. Cài đặt trình duyệt
- Zoom: 100% (Cmd/Ctrl + 0)
- Độ phân giải: 1920x1080 hoặc tương đương
- Ẩn bookmark bar để giao diện gọn gàng
- Sử dụng chế độ sáng (light mode)

## 📸 Danh sách screenshots

### Screenshot 1: Tổng quan màn Request với STT và Phân trang
**File:** `01-request-overview.png`

**Nội dung:**
- Tab "Chờ duyệt" được chọn
- Bảng hiển thị đầy đủ các cột: **STT**, Mã, Tiêu đề, Đối tượng, Trạng thái, Thao tác
- STT từ 1 đến 10 (hoặc số bản ghi/trang đã chọn)
- Phân trang ở dưới bảng với:
  - Dropdown "Hiển thị 10 / trang"
  - Tổng số bản ghi
  - Nút Trước/Sau
  - Số trang (1, 2, 3, ...)

**Cách chụp:**
1. Đăng nhập với admin
2. Vào màn "Request cấp quyền"
3. Đảm bảo tab "Chờ duyệt" được chọn
4. Chọn "Hiển thị 10 / trang"
5. Ở trang 1
6. Chụp toàn bộ màn hình (hoặc chỉ phần content)

**Điểm nhấn:**
- ✅ Cột STT rõ ràng
- ✅ Phân trang đầy đủ chức năng
- ✅ Tổng số bản ghi hiển thị

---

### Screenshot 2: Cột STT chi tiết
**File:** `02-stt-column.png`

**Nội dung:**
- Zoom vào phần table để thấy rõ cột STT
- STT từ 1 đến 10
- Các cột khác: Mã, Tiêu đề, Đối tượng

**Cách chụp:**
1. Ở trang 1
2. Zoom trình duyệt lên 125% (Cmd/Ctrl + +)
3. Chụp phần table (không cần header và footer)
4. Zoom về 100% sau khi chụp

**Điểm nhấn:**
- ✅ STT căn giữa
- ✅ STT bắt đầu từ 1
- ✅ Font size và màu sắc phù hợp

---

### Screenshot 3: Trang 2 - STT tiếp tục
**File:** `03-page-2-stt.png`

**Nội dung:**
- Trang 2 được chọn (highlight)
- STT từ 11 đến 20
- Nút "Trước" enabled
- Nút "Sau" enabled (nếu có trang 3)

**Cách chụp:**
1. Click vào số trang "2"
2. Đợi table load xong
3. Chụp toàn bộ màn hình

**Điểm nhấn:**
- ✅ STT tiếp tục từ 11
- ✅ Trang 2 được highlight
- ✅ Nút "Trước" có thể click

---

### Screenshot 4: Dropdown số bản ghi/trang
**File:** `04-page-size-dropdown.png`

**Nội dung:**
- Dropdown "Hiển thị X / trang" đang mở
- Các option: 5, 10, 20, 50
- Option hiện tại được chọn (ví dụ: 10)

**Cách chụp:**
1. Click vào dropdown "Hiển thị 10 / trang"
2. Chụp ngay khi dropdown mở
3. Đảm bảo thấy tất cả options

**Điểm nhấn:**
- ✅ Các option rõ ràng
- ✅ Option hiện tại được highlight

---

### Screenshot 5: Phân trang với nhiều trang (Ellipsis)
**File:** `05-pagination-ellipsis.png`

**Nội dung:**
- Có ít nhất 7-8 trang
- Hiển thị: 1 ... 3 4 5 ... 8
- Trang hiện tại (ví dụ: 4) được highlight
- Ellipsis (...) hiển thị rõ ràng

**Cách chụp:**
1. Tạo thêm request để có ít nhất 70-80 request
2. Chọn "Hiển thị 10 / trang"
3. Click vào trang 4 hoặc 5
4. Zoom vào phần pagination
5. Chụp

**Điểm nhấn:**
- ✅ Ellipsis hiển thị
- ✅ Trang hiện tại highlight
- ✅ Trang đầu và cuối luôn hiển thị

---

### Screenshot 6: Tab "Đang soạn"
**File:** `06-tab-draft.png`

**Nội dung:**
- Tab "Đang soạn" được chọn
- Hiển thị các request có trạng thái: Draft, Rejected, Revoked
- STT và phân trang hoạt động bình thường

**Cách chụp:**
1. Click vào tab "Đang soạn"
2. Đợi load xong
3. Chụp toàn bộ màn hình

**Điểm nhấn:**
- ✅ Tab "Đang soạn" active
- ✅ STT và phân trang vẫn hoạt động

---

### Screenshot 7: Tab "Đã duyệt"
**File:** `07-tab-approved.png`

**Nội dung:**
- Tab "Đã duyệt" được chọn
- Hiển thị các request có trạng thái: Approved
- STT và phân trang hoạt động bình thường

**Cách chụp:**
1. Click vào tab "Đã duyệt"
2. Đợi load xong
3. Chụp toàn bộ màn hình

**Điểm nhấn:**
- ✅ Tab "Đã duyệt" active
- ✅ Badge "Đã duyệt" màu xanh
- ✅ STT và phân trang vẫn hoạt động

---

### Screenshot 8: Chọn 5 bản ghi/trang
**File:** `08-page-size-5.png`

**Nội dung:**
- Dropdown chọn "5"
- Bảng chỉ hiển thị 5 dòng
- STT từ 1 đến 5
- Nhiều trang hơn (vì mỗi trang ít bản ghi)

**Cách chụp:**
1. Click dropdown và chọn "5"
2. Đợi table reload
3. Chụp toàn bộ màn hình

**Điểm nhấn:**
- ✅ Chỉ 5 dòng hiển thị
- ✅ STT từ 1 đến 5
- ✅ Số trang tăng lên

---

### Screenshot 9: Chọn 50 bản ghi/trang
**File:** `09-page-size-50.png`

**Nội dung:**
- Dropdown chọn "50"
- Bảng hiển thị nhiều dòng (tối đa 50)
- STT từ 1 đến 50 (hoặc ít hơn nếu không đủ)
- Ít trang hơn (có thể chỉ 1 trang)

**Cách chụp:**
1. Click dropdown và chọn "50"
2. Đợi table reload
3. Chụp toàn bộ màn hình (có thể cần scroll)

**Điểm nhấn:**
- ✅ Nhiều dòng hiển thị
- ✅ STT tăng dần
- ✅ Phân trang đơn giản hơn

---

### Screenshot 10: Tìm kiếm và phân trang
**File:** `10-search-pagination.png`

**Nội dung:**
- Ô tìm kiếm có text (ví dụ: "quyền")
- Kết quả tìm kiếm hiển thị
- STT reset về 1
- Phân trang hoạt động với kết quả tìm kiếm

**Cách chụp:**
1. Nhập "quyền" vào ô tìm kiếm
2. Click nút tìm kiếm hoặc Enter
3. Đợi kết quả load
4. Chụp toàn bộ màn hình

**Điểm nhấn:**
- ✅ Ô tìm kiếm có text
- ✅ Kết quả phù hợp
- ✅ STT bắt đầu từ 1
- ✅ Phân trang hoạt động

---

## 🎨 Tips chụp đẹp

### 1. Độ phân giải
- Khuyến nghị: 1920x1080 hoặc cao hơn
- Đảm bảo text rõ nét, không bị mờ

### 2. Zoom
- Mặc định: 100%
- Zoom in (125%) cho screenshots chi tiết (STT, dropdown)
- Zoom out (90%) nếu cần chụp nhiều nội dung

### 3. Màu sắc
- Sử dụng light mode
- Đảm bảo contrast tốt
- Không chụp khi có popup/dialog che khuất

### 4. Timing
- Đợi animation hoàn tất
- Đợi data load xong (không có spinner)
- Không chụp khi hover/focus vào element (trừ khi cần)

### 5. Crop
- Crop bỏ phần không cần thiết (browser toolbar, taskbar)
- Giữ lại header và navigation để có context
- Đảm bảo phần quan trọng ở giữa ảnh

## 📁 Tổ chức files

```
screenshots/
├── 01-request-overview.png
├── 02-stt-column.png
├── 03-page-2-stt.png
├── 04-page-size-dropdown.png
├── 05-pagination-ellipsis.png
├── 06-tab-draft.png
├── 07-tab-approved.png
├── 08-page-size-5.png
├── 09-page-size-50.png
└── 10-search-pagination.png
```

## ✅ Checklist trước khi chụp

- [ ] Backend đang chạy (http://localhost:8080/actuator/health)
- [ ] Frontend đang chạy (http://localhost:5173)
- [ ] Đã đăng nhập với tài khoản admin
- [ ] Đã tạo đủ 20-25 request
- [ ] Trình duyệt zoom 100%
- [ ] Ẩn bookmark bar
- [ ] Light mode
- [ ] Không có popup/dialog đang mở

## 🚀 Workflow chụp nhanh

```bash
# 1. Chuẩn bị
- Đăng nhập admin
- Tạo 25 request
- Vào màn Request

# 2. Chụp theo thứ tự
01 → Overview (tab Chờ duyệt, trang 1, 10/trang)
02 → Zoom in cột STT
03 → Click trang 2
04 → Click dropdown (đang mở)
05 → Tạo thêm request → Click trang 4-5
06 → Click tab "Đang soạn"
07 → Click tab "Đã duyệt"
08 → Chọn 5/trang
09 → Chọn 50/trang
10 → Tìm kiếm "quyền"

# 3. Review
- Kiểm tra tất cả screenshots
- Đảm bảo rõ nét
- Crop nếu cần
```

## 📝 Ghi chú cho tài liệu

Khi thêm vào tài liệu, nên có caption cho mỗi ảnh:

```markdown
**Hình 1:** Màn Request với cột STT và phân trang đầy đủ chức năng

**Hình 2:** Cột STT hiển thị số thứ tự từ 1 đến 10

**Hình 3:** Trang 2 với STT tiếp tục từ 11 đến 20

**Hình 4:** Dropdown chọn số bản ghi/trang (5, 10, 20, 50)

**Hình 5:** Phân trang với ellipsis khi có nhiều trang

**Hình 6:** Tab "Đang soạn" với STT và phân trang

**Hình 7:** Tab "Đã duyệt" với STT và phân trang

**Hình 8:** Hiển thị 5 bản ghi/trang

**Hình 9:** Hiển thị 50 bản ghi/trang

**Hình 10:** Tìm kiếm với phân trang
```

---

**Hoàn thành:** Sau khi chụp xong 10 screenshots, có thể bắt đầu viết tài liệu! 📚
