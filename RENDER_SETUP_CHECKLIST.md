# ✅ Checklist Setup PostgreSQL trên Render

## 📋 Chuẩn bị

- [ ] Đã có tài khoản Render
- [ ] Đã deploy backend service lên Render
- [ ] Backend service đang chạy (có thể lỗi vì chưa có DB)

## 🗄️ Bước 1: Tạo PostgreSQL Database (5 phút)

- [ ] Vào https://dashboard.render.com
- [ ] Click "New +" → "PostgreSQL"
- [ ] Điền:
  - Name: `employee-db`
  - Region: Oregon (US West) hoặc gần nhất
  - Plan: Free
- [ ] Click "Create Database"
- [ ] Đợi status = "Available" (1-2 phút)

## 📝 Bước 2: Lấy Database URL (1 phút)

- [ ] Vào database "employee-db"
- [ ] Tab "Info"
- [ ] Copy "Internal Database URL"
  ```
  postgresql://user:pass@host:5432/dbname
  ```

## ⚙️ Bước 3: Cấu hình Backend (3 phút)

- [ ] Vào backend service "manager-employee-2"
- [ ] Tab "Environment"
- [ ] Click "Add Environment Variable"
- [ ] Thêm các biến:

### Biến bắt buộc:

```bash
SPRING_PROFILES_ACTIVE=render
```

```bash
DATABASE_URL=<paste Internal Database URL>
```

```bash
JWT_SECRET=<chuỗi ngẫu nhiên min 32 ký tự>
```

### Biến tùy chọn:

```bash
CORS_ALLOWED_ORIGINS=https://your-frontend.vercel.app
```

- [ ] Click "Save Changes"

## 🚀 Bước 4: Deploy (2 phút)

- [ ] Render tự động deploy sau khi save env vars
- [ ] Hoặc click "Manual Deploy" → "Deploy latest commit"
- [ ] Đợi deploy xong (2-5 phút)
- [ ] Xem logs: Tab "Logs"
- [ ] Tìm dòng: `Started EmployeeManagerApplication`

## ✅ Bước 5: Test Backend (2 phút)

### Test tự động:
```bash
chmod +x test-render-backend.sh
./test-render-backend.sh
```

### Test thủ công:

#### Test 1: Health Check
```bash
curl https://manager-employee-2.onrender.com/actuator/health
```
- [ ] Trả về: `{"status":"UP"}`

#### Test 2: Login
```bash
curl -X POST https://manager-employee-2.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```
- [ ] Trả về: `{"token":"eyJ...","userId":1,...}`

#### Test 3: DB Info (Optional)
```bash
curl https://manager-employee-2.onrender.com/api/debug/db-info
```
- [ ] Trả về: `{"status":"success","connectionValid":true,...}`

## 🎯 Kết quả mong đợi

- [ ] ✅ Health check: HTTP 200
- [ ] ✅ Login API: HTTP 200 + token
- [ ] ✅ Logs không có error
- [ ] ✅ Database connection thành công

## 🔧 Troubleshooting

### ❌ Health check failed
- [ ] Kiểm tra backend service status = "Live"
- [ ] Xem logs có error gì
- [ ] Kiểm tra `SPRING_PROFILES_ACTIVE=render`

### ❌ Login failed
- [ ] Kiểm tra `DATABASE_URL` đã set đúng
- [ ] Kiểm tra database status = "Available"
- [ ] Xem logs có error về database connection

### ❌ CORS error
- [ ] Thêm frontend domain vào `CORS_ALLOWED_ORIGINS`
- [ ] Format: `https://domain1.com,https://domain2.com`

## 📊 Thông tin hữu ích

### Render Dashboard URLs:
- Backend Service: https://dashboard.render.com/web/manager-employee-2
- Database: https://dashboard.render.com/d/employee-db
- Logs: https://dashboard.render.com/web/manager-employee-2/logs

### Backend URLs:
- Health: https://manager-employee-2.onrender.com/actuator/health
- Login: https://manager-employee-2.onrender.com/api/auth/login
- Debug: https://manager-employee-2.onrender.com/api/debug/db-info

### Default Credentials:
- Admin: `admin` / `admin123`
- Manager: `manager` / `manager123`
- Employee: `employee` / `employee123`

## 📚 Tài liệu tham khảo

- [ ] `RENDER_POSTGRESQL_SETUP.md` - Hướng dẫn chi tiết
- [ ] `parse-db-url.sh` - Script parse database URL
- [ ] `test-render-backend.sh` - Script test backend

## ⏱️ Tổng thời gian: ~15 phút

---

**Status:** [ ] Chưa bắt đầu | [ ] Đang làm | [ ] Hoàn thành

**Ghi chú:**
```
(Ghi lại các vấn đề gặp phải và cách giải quyết)
```
