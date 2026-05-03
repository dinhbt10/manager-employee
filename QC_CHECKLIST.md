# ✅ QC Checklist - STT và Phân trang

## 📋 Yêu cầu ban đầu
> "a ơi, xíu a thêm cho e cột stt với phân trang cho màn request nhé. để e chụp nốt màn hình cho tài liệu"

---

## 🔧 Setup và Fix lỗi

### Database
- [ ] Chạy `docker compose down -v` để xóa database cũ
- [ ] Chạy `docker compose up --build -d` để khởi động lại
- [ ] Đợi 15 giây để database khởi động
- [ ] Kiểm tra logs không có lỗi: `docker compose logs api | grep -i error`
- [ ] Kiểm tra health: `curl http://localhost:8080/actuator/health`

### Frontend
- [ ] Chạy `cd frontend && npm install`
- [ ] Chạy `npm run dev`
- [ ] Mở http://localhost:5173
- [ ] Không có lỗi trong console

---

## ✅ Tính năng: Cột STT

### Hiển thị
- [ ] Cột STT xuất hiện ở đầu bảng (trước cột "Mã")
- [ ] Header cột là "STT"
- [ ] STT căn giữa
- [ ] Font size phù hợp, dễ đọc
- [ ] Màu sắc phù hợp (text-zinc-500)

### Logic
- [ ] STT bắt đầu từ 1 trên mỗi trang
- [ ] STT tăng dần: 1, 2, 3, ..., N
- [ ] Trang 1: STT từ 1 đến pageSize
- [ ] Trang 2: STT từ (pageSize + 1) đến (2 * pageSize)
- [ ] Trang 3: STT từ (2 * pageSize + 1) đến (3 * pageSize)

### Tương tác
- [ ] STT không thay đổi khi hover
- [ ] STT không thay đổi khi click
- [ ] STT cập nhật đúng khi chuyển trang
- [ ] STT reset về 1 khi search
- [ ] STT reset về 1 khi filter
- [ ] STT giữ nguyên khi chuyển tab

---

## ✅ Tính năng: Phân trang

### Dropdown số bản ghi/trang
- [ ] Dropdown hiển thị ở góc trái dưới bảng
- [ ] Text: "Hiển thị [X] / trang"
- [ ] Các option: 5, 10, 20, 50
- [ ] Option mặc định: 10
- [ ] Click dropdown → mở danh sách options
- [ ] Chọn option → table reload với số bản ghi mới
- [ ] Chọn option → reset về trang 1

### Tổng số bản ghi
- [ ] Hiển thị: "Tổng X bản ghi"
- [ ] Số X cập nhật đúng theo dữ liệu
- [ ] Hiển thị ở cùng dòng với dropdown

### Nút Trước/Sau
- [ ] Nút "Trước" hiển thị bên trái số trang
- [ ] Nút "Sau" hiển thị bên phải số trang
- [ ] Trang 1: Nút "Trước" disabled
- [ ] Trang cuối: Nút "Sau" disabled
- [ ] Trang giữa: Cả 2 nút enabled
- [ ] Click "Trước" → chuyển về trang trước
- [ ] Click "Sau" → chuyển sang trang sau

### Số trang
- [ ] Hiển thị giữa nút Trước và Sau
- [ ] Trang hiện tại được highlight (variant="default")
- [ ] Trang khác có variant="ghost"
- [ ] Click số trang → chuyển đến trang đó
- [ ] Luôn hiển thị trang đầu (1)
- [ ] Luôn hiển thị trang cuối (N)
- [ ] Hiển thị trang hiện tại và kế cận (±1)

### Ellipsis (...)
- [ ] Hiển thị khi có nhiều trang (>7)
- [ ] Hiển thị giữa trang đầu và trang hiện tại (nếu cách xa)
- [ ] Hiển thị giữa trang hiện tại và trang cuối (nếu cách xa)
- [ ] Không hiển thị khi trang kế cận
- [ ] Màu sắc: text-zinc-400

### Tương tác
- [ ] Chuyển trang → table reload
- [ ] Chuyển trang → STT cập nhật
- [ ] Chuyển trang → scroll về đầu table
- [ ] Chuyển trang → không mất dữ liệu filter/search

---

## ✅ Tương tác với các tính năng khác

### Tìm kiếm
- [ ] Nhập text vào ô tìm kiếm
- [ ] Click nút tìm kiếm hoặc Enter
- [ ] Kết quả hiển thị đúng
- [ ] STT reset về 1
- [ ] Phân trang cập nhật theo kết quả
- [ ] Tổng số bản ghi cập nhật

### Lọc nâng cao
- [ ] Mở dialog lọc nâng cao
- [ ] Chọn các filter (phòng ban, người tạo, đối tượng, thời gian, mã chức năng)
- [ ] Click "Áp dụng"
- [ ] Kết quả hiển thị đúng
- [ ] STT reset về 1
- [ ] Phân trang cập nhật theo kết quả

### Chuyển tab
- [ ] Click tab "Đang soạn"
- [ ] Dữ liệu load đúng (Draft, Rejected, Revoked)
- [ ] STT và phân trang hoạt động
- [ ] Giữ nguyên trang hiện tại (không reset)
- [ ] Click tab "Chờ duyệt"
- [ ] Dữ liệu load đúng (Pending)
- [ ] STT và phân trang hoạt động
- [ ] Click tab "Đã duyệt"
- [ ] Dữ liệu load đúng (Approved)
- [ ] STT và phân trang hoạt động

### Thao tác trên request
- [ ] Click "Chi tiết" → mở dialog
- [ ] Click "Sửa" → mở dialog
- [ ] Click "Gửi duyệt" → request chuyển trạng thái
- [ ] Click "Duyệt" → request được duyệt
- [ ] Click "Từ chối" → mở dialog nhập lý do
- [ ] Click "Xóa" → mở dialog xác nhận
- [ ] Sau mỗi thao tác → table reload
- [ ] Sau reload → giữ nguyên trang hiện tại
- [ ] Sau reload → STT cập nhật đúng

---

## ✅ UI/UX

### Responsive
- [ ] Desktop (1920x1080): Hiển thị đẹp
- [ ] Laptop (1366x768): Hiển thị đẹp
- [ ] Tablet (768px): Hiển thị ổn
- [ ] Mobile: Có thể scroll ngang

### Performance
- [ ] Chuyển trang nhanh (<500ms)
- [ ] Không có lag khi scroll
- [ ] Không có flicker khi reload
- [ ] Spinner hiển thị khi loading

### Accessibility
- [ ] Có thể dùng keyboard để điều hướng
- [ ] Tab key hoạt động đúng
- [ ] Enter key hoạt động đúng
- [ ] Aria labels đầy đủ

### Visual
- [ ] Màu sắc phù hợp với design system
- [ ] Font size nhất quán
- [ ] Spacing hợp lý
- [ ] Border và shadow phù hợp
- [ ] Hover state rõ ràng
- [ ] Active state rõ ràng
- [ ] Disabled state rõ ràng

---

## 📸 Screenshots (10 ảnh)

- [ ] 01: Overview màn Request (tab Chờ duyệt, trang 1, 10/trang)
- [ ] 02: Zoom in cột STT
- [ ] 03: Trang 2 - STT tiếp tục từ 11
- [ ] 04: Dropdown số bản ghi/trang (đang mở)
- [ ] 05: Phân trang với ellipsis (trang 4-5)
- [ ] 06: Tab "Đang soạn"
- [ ] 07: Tab "Đã duyệt"
- [ ] 08: Chọn 5 bản ghi/trang
- [ ] 09: Chọn 50 bản ghi/trang
- [ ] 10: Tìm kiếm với phân trang

---

## 🐛 Bug Testing

### Edge Cases
- [ ] 0 request: Hiển thị "Không có dữ liệu"
- [ ] 1 request: Phân trang ẩn hoặc disabled
- [ ] Đúng pageSize request: Chỉ 1 trang
- [ ] pageSize + 1 request: 2 trang
- [ ] Rất nhiều request (100+): Ellipsis hoạt động

### Error Handling
- [ ] API lỗi: Hiển thị toast error
- [ ] Network lỗi: Hiển thị toast error
- [ ] Timeout: Hiển thị toast error
- [ ] Không có quyền: Redirect hoặc toast error

### Data Consistency
- [ ] Tạo request mới → table reload → STT cập nhật
- [ ] Xóa request → table reload → STT cập nhật
- [ ] Cập nhật request → table reload → STT giữ nguyên
- [ ] Duyệt request → chuyển tab → STT cập nhật

---

## 📝 Documentation

- [ ] README_UPDATE.md đã tạo
- [ ] HUONG_DAN_FIX.md đã tạo
- [ ] CHANGELOG.md đã tạo
- [ ] SCREENSHOT_GUIDE.md đã tạo
- [ ] QC_CHECKLIST.md đã tạo (file này)
- [ ] UPDATE_SUMMARY.md đã tạo

---

## 🚀 Deployment

- [ ] Code đã commit
- [ ] Screenshots đã chụp
- [ ] Tài liệu đã cập nhật
- [ ] QC đã approve
- [ ] Ready to deploy

---

## ✅ Final Check

- [ ] Tất cả checklist items đã pass
- [ ] Không có bug critical
- [ ] Performance ổn định
- [ ] UI/UX đẹp và dễ dùng
- [ ] Screenshots đầy đủ và rõ nét
- [ ] Tài liệu đầy đủ và chính xác

---

**Người test:** _______________  
**Ngày test:** _______________  
**Kết quả:** ⬜ Pass  ⬜ Fail  
**Ghi chú:** _______________

---

**Approved by QC:** _______________  
**Date:** _______________  
**Signature:** _______________
