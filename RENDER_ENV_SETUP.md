# Cấu hình Environment Variables cho Backend trên Render

## Cách 1: Dùng PostgreSQL của Render (Khuyến nghị)

### Bước 1: Tạo PostgreSQL Database
1. Vào Render Dashboard: https://dashboard.render.com
2. Click "New +" → "PostgreSQL"
3. Điền thông tin:
   - Name: `employee-db`
   - Database: `empdb` (hoặc để mặc định)
   - User: `empdb_user` (hoặc để mặc định)
   - Region: Chọn gần bạn nhất
   - Plan: Free
4. Click "Create Database"
5. Đợi 1-2 phút để database được tạo

### Bước 2: Lấy Database URL
1. Vào database `employee-db` vừa tạo
2. Tab "Info"
3. Copy **"Internal Database URL"** (dạng: `postgresql://user:pass@host:5432/dbname`)

### Bước 3: Cấu hình Backend Service
1. Vào Backend Service (manager-employee-2)
2. Tab "Environment"
3. Click "Add Environment Variable"
4. Thêm các biến sau:

```bash
# Profile - Bắt buộc
SPRING_PROFILES_ACTIVE=docker

# Database URL - Parse từ Internal Database URL
# Ví dụ URL: postgresql://empdb_user:abc123@dpg-xxx.oregon-postgres.render.com:5432/empdb_xxx
# Thì tách ra:

DB_HOST=dpg-xxx.oregon-postgres.render.com
DB_PORT=5432
DB_NAME=empdb_xxx
DB_USER=empdb_user
DB_PASSWORD=abc123

# JWT Secret - Đổi thành chuỗi ngẫu nhiên dài ít nhất 32 ký tự
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-change-this-in-production

# CORS - Thêm domain frontend của bạn
CORS_ALLOWED_ORIGINS=https://your-frontend-domain.vercel.app,https://your-frontend-domain.com

# Port (Render tự set, không cần thêm)
# PORT=10000
```

### Bước 4: Deploy lại
1. Click "Manual Deploy" → "Deploy latest commit"
2. Hoặc đợi auto-deploy nếu đã bật

---

## Cách 2: Dùng DATABASE_URL (Đơn giản hơn)

Nếu muốn đơn giản, chỉ cần 3 biến:

```bash
# Profile
SPRING_PROFILES_ACTIVE=docker

# Database URL đầy đủ (từ Render PostgreSQL)
DATABASE_URL=postgresql://empdb_user:abc123@dpg-xxx.oregon-postgres.render.com:5432/empdb_xxx

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-change-this-in-production

# CORS
CORS_ALLOWED_ORIGINS=https://your-frontend-domain.vercel.app
```

**Lưu ý:** Cần update `application.yml` để parse `DATABASE_URL`:

```yaml
spring:
  datasource:
    url: ${DATABASE_URL:jdbc:postgresql://${DB_HOST:db}:${DB_PORT:5432}/${DB_NAME:empdb}}
```

---

## Cách 3: Dùng H2 in-memory (Chỉ để test)

Nếu chỉ muốn test nhanh, không cần PostgreSQL:

```bash
# Profile dev = H2 in-memory
SPRING_PROFILES_ACTIVE=dev

# JWT Secret
JWT_SECRET=dev-secret-key-min-32-chars-long

# CORS
CORS_ALLOWED_ORIGINS=https://your-frontend-domain.vercel.app
```

**⚠️ Lưu ý:** H2 in-memory sẽ mất hết data mỗi khi restart service!

---

## Kiểm tra Backend đã hoạt động

### 1. Health Check
```bash
curl https://manager-employee-2.onrender.com/actuator/health
```

Response mong đợi:
```json
{"status":"UP"}
```

### 2. Test Login
```bash
curl -X POST https://manager-employee-2.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

Response mong đợi:
```json
{
  "token": "eyJhbGc...",
  "userId": 1,
  "username": "admin",
  "role": "ADMIN",
  ...
}
```

### 3. Xem Logs
```
1. Vào Backend Service
2. Tab "Logs"
3. Tìm dòng:
   - "Started EmployeeManagerApplication"
   - "Tomcat started on port"
   - Không có error về database connection
```

---

## Troubleshooting

### Lỗi: "Connection refused" hoặc "Unknown database"
- Kiểm tra lại DB_HOST, DB_PORT, DB_NAME
- Đảm bảo PostgreSQL database đã được tạo và running

### Lỗi: "Authentication failed"
- Kiểm tra lại DB_USER và DB_PASSWORD
- Copy chính xác từ Internal Database URL

### Lỗi: "CORS policy"
- Thêm domain frontend vào CORS_ALLOWED_ORIGINS
- Ví dụ: `https://your-app.vercel.app`

### Backend không start
- Xem logs để biết lỗi cụ thể
- Kiểm tra SPRING_PROFILES_ACTIVE=docker
- Kiểm tra JWT_SECRET có đủ 32 ký tự

---

## Template Copy-Paste

### Cho PostgreSQL (Render)
```bash
SPRING_PROFILES_ACTIVE=docker
DB_HOST=<copy-from-render-db-info>
DB_PORT=5432
DB_NAME=<copy-from-render-db-info>
DB_USER=<copy-from-render-db-info>
DB_PASSWORD=<copy-from-render-db-info>
JWT_SECRET=change-this-to-random-32-chars-or-more
CORS_ALLOWED_ORIGINS=https://your-frontend.vercel.app
```

### Cho H2 (Test only)
```bash
SPRING_PROFILES_ACTIVE=dev
JWT_SECRET=dev-secret-key-min-32-chars-long
CORS_ALLOWED_ORIGINS=https://your-frontend.vercel.app
```

---

## Bước tiếp theo

1. ✅ Tạo PostgreSQL database trên Render
2. ✅ Lấy connection info
3. ✅ Thêm environment variables vào Backend Service
4. ✅ Deploy lại backend
5. ✅ Test health check
6. ✅ Test login API
7. ✅ Update frontend vite.config.ts với backend URL
8. ✅ Deploy frontend

---

**Khuyến nghị:** Dùng Cách 1 (PostgreSQL) cho production, Cách 3 (H2) chỉ để test nhanh.
