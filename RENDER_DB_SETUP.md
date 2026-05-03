# Hướng dẫn lấy thông tin Database trên Render

## Bước 1: Tạo PostgreSQL Database

1. Mở tab mới, vào: https://dashboard.render.com
2. Click nút **"New +"** (góc trên phải)
3. Chọn **"PostgreSQL"**
4. Điền:
   - **Name:** `employee-db`
   - **Region:** Oregon (US West)
   - **Plan:** Free
5. Click **"Create Database"**
6. Đợi 1-2 phút cho đến khi **Status = "Available"**

## Bước 2: Lấy Database URL

1. Click vào database **"employee-db"** vừa tạo
2. Tab **"Info"**
3. Tìm dòng **"Internal Database URL"**
4. Click icon **Copy** bên cạnh URL
5. URL sẽ có dạng:
   ```
   postgresql://empdb_xxx_user:abc123xyz@dpg-xxx.oregon-postgres.render.com:5432/empdb_xxx
   ```

## Bước 3: Thêm vào Backend Service

Quay lại tab backend service (manager-employee-2), thêm 3 biến:

### Biến 1: SPRING_PROFILES_ACTIVE
```
Key: SPRING_PROFILES_ACTIVE
Value: render
```

### Biến 2: DATABASE_URL
```
Key: DATABASE_URL
Value: <paste URL vừa copy ở bước 2>
```

### Biến 3: JWT_SECRET
```
Key: JWT_SECRET
Value: my-super-secret-jwt-key-change-this-random-string-min-32-chars
```

### Biến 4 (Optional): CORS_ALLOWED_ORIGINS
```
Key: CORS_ALLOWED_ORIGINS
Value: https://your-frontend-domain.vercel.app
```

Click **"Save Changes"**

## Bước 4: Deploy

- Render sẽ tự động deploy lại
- Hoặc click **"Manual Deploy"** → **"Deploy latest commit"**
- Đợi 2-5 phút

## Bước 5: Kiểm tra

Mở terminal và chạy:

```bash
# Test health
curl https://manager-employee-2.onrender.com/actuator/health

# Test login
curl -X POST https://manager-employee-2.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

Nếu thành công, bạn sẽ thấy:
- Health: `{"status":"UP"}`
- Login: `{"token":"eyJ...","userId":1,...}`

---

**Tổng thời gian:** 10 phút

**Lưu ý:** Database Free tier của Render expires sau 90 ngày, cần renew.

---

## Bonus: Kết nối Database với DBeaver

### Bước 1: Lấy thông tin kết nối từ Render

1. Vào database **"employee-db"** trên Render
2. Tab **"Info"**
3. Bạn sẽ thấy:
   ```
   Hostname: dpg-xxx.oregon-postgres.render.com
   Port: 5432
   Database: empdb_xxx
   Username: empdb_xxx_user
   Password: (click "Show" để xem)
   ```
4. Hoặc từ **"External Database URL"**:
   ```
   postgresql://empdb_xxx_user:password@dpg-xxx.oregon-postgres.render.com:5432/empdb_xxx
   ```
   Parse ra:
   - **Host:** `dpg-xxx.oregon-postgres.render.com`
   - **Port:** `5432`
   - **Database:** `empdb_xxx`
   - **Username:** `empdb_xxx_user`
   - **Password:** `password`

### Bước 2: Mở DBeaver và tạo kết nối mới

1. Mở **DBeaver**
2. Click **"New Database Connection"** (icon cắm điện hoặc Cmd+N)
3. Chọn **"PostgreSQL"**
4. Click **"Next"**

### Bước 3: Điền thông tin kết nối

Trong tab **"Main"**:

```
Host: dpg-xxx.oregon-postgres.render.com
Port: 5432
Database: empdb_xxx
Username: empdb_xxx_user
Password: <paste password từ Render>
```

**Lưu ý:** Bỏ tick **"Show all databases"** nếu có

### Bước 4: Cấu hình SSL (Quan trọng!)

1. Click tab **"SSL"**
2. Chọn **"Use SSL"** = **Require**
3. Hoặc trong tab **"Driver properties"**:
   - Tìm `ssl` → set = `true`
   - Tìm `sslmode` → set = `require`

### Bước 5: Test Connection

1. Click **"Test Connection"**
2. Nếu lần đầu, DBeaver sẽ tải PostgreSQL driver → Click **"Download"**
3. Đợi download xong
4. Nếu thành công, sẽ thấy: **"Connected"** ✅
5. Click **"Finish"**

### Bước 6: Xem dữ liệu

1. Expand connection tree:
   ```
   employee-db
   └── Databases
       └── empdb_xxx
           └── Schemas
               └── public
                   └── Tables
                       ├── department
                       ├── feature
                       ├── permission_request
                       ├── role
                       └── user_account
   ```
2. Right-click table → **"View Data"** để xem dữ liệu

### Troubleshooting

#### ❌ "Connection refused"
- Kiểm tra Host và Port
- Đảm bảo database status = "Available" trên Render

#### ❌ "SSL required"
- Bật SSL trong tab SSL
- Set `sslmode=require`

#### ❌ "Authentication failed"
- Kiểm tra Username và Password
- Copy chính xác từ Render (không có khoảng trắng thừa)

#### ❌ "Timeout"
- Kiểm tra internet connection
- Render database có thể đang sleep (free tier)

### Script nhanh để parse URL

Nếu bạn có External Database URL, chạy script này:

```bash
# Paste URL vào đây
URL="postgresql://empdb_xxx_user:abc123@dpg-xxx.oregon-postgres.render.com:5432/empdb_xxx"

# Parse
echo "Host: $(echo $URL | sed 's/.*@\(.*\):.*/\1/')"
echo "Port: $(echo $URL | sed 's/.*:\([0-9]*\)\/.*/\1/')"
echo "Database: $(echo $URL | sed 's/.*\/\(.*\)/\1/')"
echo "Username: $(echo $URL | sed 's/.*:\/\/\(.*\):.*/\1/')"
echo "Password: $(echo $URL | sed 's/.*:\/\/.*:\(.*\)@.*/\1/')"
```

### Kết quả mong đợi

Sau khi kết nối thành công, bạn có thể:
- ✅ Xem tất cả tables
- ✅ Query dữ liệu: `SELECT * FROM user_account;`
- ✅ Xem schema, indexes, constraints
- ✅ Export/Import data
- ✅ Chạy SQL scripts
