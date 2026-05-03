# 🚀 Hướng dẫn Setup PostgreSQL cho Backend trên Render

## Bước 1: Tạo PostgreSQL Database

1. Đăng nhập Render: https://dashboard.render.com
2. Click nút **"New +"** (góc trên bên phải)
3. Chọn **"PostgreSQL"**
4. Điền thông tin:
   ```
   Name: employee-db
   Database: empdb (hoặc để mặc định)
   User: (để mặc định, Render sẽ tự tạo)
   Region: Oregon (US West) hoặc gần bạn nhất
   PostgreSQL Version: 15 (hoặc mới nhất)
   Plan: Free
   ```
5. Click **"Create Database"**
6. Đợi 1-2 phút để database được provisioned

## Bước 2: Lấy Database Connection Info

1. Vào database **"employee-db"** vừa tạo
2. Click tab **"Info"**
3. Bạn sẽ thấy:
   ```
   Status: Available
   
   Internal Database URL:
   postgresql://empdb_xxx_user:abc123xyz...@dpg-xxx.oregon-postgres.render.com:5432/empdb_xxx
   
   External Database URL:
   postgresql://empdb_xxx_user:abc123xyz...@dpg-xxx.oregon-postgres.render.com:5432/empdb_xxx
   
   PSQL Command:
   PGPASSWORD=abc123xyz... psql -h dpg-xxx.oregon-postgres.render.com -U empdb_xxx_user empdb_xxx
   ```
4. **Copy "Internal Database URL"** (dòng đầu tiên)

## Bước 3: Cấu hình Backend Service

### Option A: Dùng DATABASE_URL (Đơn giản - Khuyến nghị)

1. Vào Backend Service: **manager-employee-2**
2. Click tab **"Environment"**
3. Click **"Add Environment Variable"**
4. Thêm các biến sau:

```bash
# Key: SPRING_PROFILES_ACTIVE
# Value: render
SPRING_PROFILES_ACTIVE=render

# Key: DATABASE_URL
# Value: <paste Internal Database URL từ bước 2>
DATABASE_URL=postgresql://empdb_xxx_user:abc123xyz@dpg-xxx.oregon-postgres.render.com:5432/empdb_xxx

# Key: JWT_SECRET
# Value: Chuỗi ngẫu nhiên dài ít nhất 32 ký tự
JWT_SECRET=my-super-secret-jwt-key-change-this-to-random-string-min-32-chars

# Key: CORS_ALLOWED_ORIGINS
# Value: Domain frontend của bạn (nếu có)
CORS_ALLOWED_ORIGINS=https://your-frontend.vercel.app
```

5. Click **"Save Changes"**

### Option B: Dùng các biến riêng lẻ (Nếu muốn tách riêng)

Parse URL thành các biến:

```bash
# Từ URL: postgresql://user:pass@host:5432/dbname
# Tách ra:

SPRING_PROFILES_ACTIVE=docker
DB_HOST=dpg-xxx.oregon-postgres.render.com
DB_PORT=5432
DB_NAME=empdb_xxx
DB_USER=empdb_xxx_user
DB_PASSWORD=abc123xyz...
JWT_SECRET=my-super-secret-jwt-key-min-32-chars
CORS_ALLOWED_ORIGINS=https://your-frontend.vercel.app
```

## Bước 4: Deploy Backend

1. Sau khi save environment variables, Render sẽ tự động deploy lại
2. Hoặc click **"Manual Deploy"** → **"Deploy latest commit"**
3. Đợi 2-5 phút để build và deploy
4. Xem logs để kiểm tra:
   - Tab **"Logs"**
   - Tìm dòng: `Started EmployeeManagerApplication in X seconds`
   - Không có error về database connection

## Bước 5: Kiểm tra Backend hoạt động

### Test 1: Health Check
```bash
curl https://manager-employee-2.onrender.com/actuator/health
```

**Kết quả mong đợi:**
```json
{"status":"UP"}
```

### Test 2: Login API
```bash
curl -X POST https://manager-employee-2.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

**Kết quả mong đợi:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "userId": 1,
  "username": "admin",
  "fullName": "Administrator",
  "role": "ADMIN",
  "departmentId": null,
  "departmentName": null,
  "featureCodes": ["USER_VIEW_ALL", "USER_CREATE", ...]
}
```

### Test 3: Debug Endpoint (Optional)
```bash
curl https://manager-employee-2.onrender.com/api/debug/db-info
```

**Kết quả mong đợi:**
```json
{
  "profile": "render",
  "url": "jdbc:postgresql://dpg-xxx.oregon-postgres.render.com:5432/empdb_xxx",
  "username": "empdb_xxx_user",
  "driver": "org.postgresql.Driver",
  "password": "***MASKED***",
  "connectionValid": true,
  "catalog": "empdb_xxx",
  "databaseProductName": "PostgreSQL",
  "databaseProductVersion": "15.x",
  "status": "success"
}
```

## Bước 6: Cập nhật Frontend

Đảm bảo frontend đang trỏ đúng backend URL:

```typescript
// frontend/vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      "/api": {
        target: "https://manager-employee-2.onrender.com",
        changeOrigin: true,
      },
    },
  },
});
```

## Troubleshooting

### ❌ Lỗi: "Connection refused"
**Nguyên nhân:** Database chưa sẵn sàng hoặc URL sai

**Giải pháp:**
1. Kiểm tra database status = "Available"
2. Copy lại Internal Database URL
3. Đảm bảo không có khoảng trắng thừa

### ❌ Lỗi: "Authentication failed for user"
**Nguyên nhân:** Username hoặc password sai

**Giải pháp:**
1. Copy chính xác từ Internal Database URL
2. Kiểm tra không có ký tự đặc biệt bị escape sai

### ❌ Lỗi: "CORS policy"
**Nguyên nhân:** Frontend domain chưa được thêm vào CORS

**Giải pháp:**
1. Thêm domain frontend vào `CORS_ALLOWED_ORIGINS`
2. Ví dụ: `https://your-app.vercel.app,https://your-app.com`

### ❌ Backend không start
**Nguyên nhân:** Thiếu biến môi trường hoặc sai profile

**Giải pháp:**
1. Kiểm tra `SPRING_PROFILES_ACTIVE=render` hoặc `docker`
2. Kiểm tra `DATABASE_URL` đã được set
3. Xem logs chi tiết: Tab "Logs"

### ❌ Data bị mất sau khi restart
**Nguyên nhân:** Đang dùng H2 in-memory thay vì PostgreSQL

**Giải pháp:**
1. Kiểm tra profile = `render` hoặc `docker`, KHÔNG phải `dev`
2. Kiểm tra logs có dòng: `HikariPool-1 - Starting...` với PostgreSQL

## Checklist

- [ ] Đã tạo PostgreSQL database trên Render
- [ ] Database status = "Available"
- [ ] Đã copy Internal Database URL
- [ ] Đã thêm `SPRING_PROFILES_ACTIVE=render`
- [ ] Đã thêm `DATABASE_URL=postgresql://...`
- [ ] Đã thêm `JWT_SECRET=...` (min 32 chars)
- [ ] Đã thêm `CORS_ALLOWED_ORIGINS=...` (nếu cần)
- [ ] Backend đã deploy thành công
- [ ] Health check trả về `{"status":"UP"}`
- [ ] Login API trả về token
- [ ] Frontend kết nối được backend

## Script hỗ trợ

### Parse Database URL
```bash
chmod +x parse-db-url.sh
./parse-db-url.sh
# Paste Internal Database URL khi được hỏi
```

### Test Backend
```bash
# Health check
curl https://manager-employee-2.onrender.com/actuator/health

# Login
curl -X POST https://manager-employee-2.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# DB Info (debug)
curl https://manager-employee-2.onrender.com/api/debug/db-info
```

## Lưu ý quan trọng

1. **Free tier PostgreSQL của Render:**
   - 1GB storage
   - Expires sau 90 ngày (cần renew)
   - Không có backup tự động

2. **Security:**
   - Đổi `JWT_SECRET` thành chuỗi ngẫu nhiên
   - Không commit `JWT_SECRET` vào Git
   - Xóa `DebugController.java` trước khi production

3. **Performance:**
   - Free tier có thể sleep sau 15 phút không hoạt động
   - Cold start có thể mất 30-60 giây
   - Cân nhắc upgrade nếu cần uptime cao

## Kết quả mong đợi

Sau khi hoàn thành:
- ✅ Backend chạy trên Render với PostgreSQL
- ✅ Data được lưu persistent (không mất khi restart)
- ✅ Frontend kết nối được backend
- ✅ Login thành công
- ✅ CRUD operations hoạt động bình thường

---

**Thời gian ước tính:** 10-15 phút

**Khó khăn:** ⭐⭐ (Trung bình)

**Hỗ trợ:** Nếu gặp vấn đề, check logs và so sánh với troubleshooting section
