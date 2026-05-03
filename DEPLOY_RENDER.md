# Hướng dẫn Deploy lên Render

## Tại sao cần chuyển từ H2 sang PostgreSQL?

- **H2**: Database in-memory, dữ liệu lưu trong RAM → **mất hết khi restart**
- **PostgreSQL**: Database persistent, dữ liệu lưu trên disk → **không mất khi restart**

## Bước 1: Tạo PostgreSQL Database trên Render

1. Đăng nhập [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"PostgreSQL"**
3. Điền thông tin:
   - **Name**: `employee-db`
   - **Database**: `empdb`
   - **User**: `emp` (tự động)
   - **Region**: Singapore (hoặc gần bạn)
   - **Plan**: **Free** (đủ cho demo, có giới hạn 90 ngày)
4. Click **"Create Database"**
5. Đợi vài phút để Render tạo database
6. Sau khi tạo xong, vào tab **"Info"** và copy:
   - **Internal Database URL** (dùng cho backend)
   - **External Database URL** (dùng để connect từ máy local nếu cần)

## Bước 2: Deploy Backend API

### Cách 1: Dùng file render.yaml (Tự động - Khuyến nghị)

1. Push code lên GitHub (nếu chưa có):
   ```bash
   git init
   git add .
   git commit -m "Add Render deployment config"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```

2. Trên Render Dashboard:
   - Click **"New +"** → **"Blueprint"**
   - Connect GitHub repository
   - Render sẽ tự động đọc file `render.yaml` và tạo services

3. Cấu hình environment variables:
   - `SPRING_PROFILES_ACTIVE`: `render`
   - `DATABASE_URL`: Chọn từ database đã tạo ở Bước 1
   - `JWT_SECRET`: Render sẽ tự generate (hoặc tự đặt, tối thiểu 32 ký tự)
   - `CORS_ALLOWED_ORIGINS`: URL frontend của bạn (ví dụ: `https://your-app.onrender.com`)

### Cách 2: Deploy thủ công

1. Trên Render Dashboard:
   - Click **"New +"** → **"Web Service"**
   - Connect GitHub repository
   - Chọn branch `main`

2. Điền thông tin:
   - **Name**: `employee-manager-api`
   - **Runtime**: `Java`
   - **Build Command**: 
     ```bash
     cd backend && mvn clean package -DskipTests
     ```
   - **Start Command**:
     ```bash
     cd backend && java -jar target/employee-manager-api-0.1.0-SNAPSHOT.jar
     ```
   - **Plan**: Free

3. Environment Variables (tab "Environment"):
   - `SPRING_PROFILES_ACTIVE` = `render`
   - `DATABASE_URL` = (chọn từ database đã tạo)
   - `JWT_SECRET` = (tự đặt, ví dụ: `my-super-secret-jwt-key-at-least-32-characters-long`)
   - `CORS_ALLOWED_ORIGINS` = `https://your-frontend.onrender.com`

4. Click **"Create Web Service"**

## Bước 3: Deploy Frontend (Optional)

1. Cập nhật API URL trong frontend:
   - Tạo file `frontend/.env.production`:
     ```
     VITE_API_URL=https://employee-manager-api.onrender.com
     ```

2. Trên Render Dashboard:
   - Click **"New +"** → **"Static Site"**
   - Connect GitHub repository
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/dist`

3. Click **"Create Static Site"**

## Bước 4: Kiểm tra

1. Sau khi deploy xong, truy cập:
   - Backend health check: `https://your-api.onrender.com/actuator/health`
   - Frontend: `https://your-frontend.onrender.com`

2. Đăng nhập và tạo dữ liệu test

3. **Restart backend** để kiểm tra dữ liệu không bị mất:
   - Vào Render Dashboard → Web Service → Manual Deploy → "Clear build cache & deploy"
   - Sau khi restart, đăng nhập lại → dữ liệu vẫn còn ✅

## Lưu ý quan trọng

### Free Plan Limitations

- **Database**: 
  - 90 ngày free trial
  - 1 GB storage
  - Sau 90 ngày cần upgrade hoặc tạo database mới
  
- **Web Service**:
  - Tự động sleep sau 15 phút không hoạt động
  - Request đầu tiên sau khi sleep sẽ mất ~30 giây để wake up
  - 750 giờ/tháng (đủ cho 1 service chạy 24/7)

### Bảo mật

- **Không commit** `JWT_SECRET` vào Git
- Dùng Render Environment Variables để lưu secrets
- Cập nhật `CORS_ALLOWED_ORIGINS` với domain thật của frontend

### Backup dữ liệu

Render Free Plan không có auto backup. Để backup thủ công:

```bash
# Cài pg_dump (nếu chưa có)
brew install postgresql  # macOS
# hoặc apt-get install postgresql-client  # Linux

# Backup
pg_dump "EXTERNAL_DATABASE_URL" > backup.sql

# Restore
psql "EXTERNAL_DATABASE_URL" < backup.sql
```

## Troubleshooting

### Lỗi "Connection refused"
- Kiểm tra `DATABASE_URL` đã đúng chưa
- Đảm bảo database đã được tạo và running

### Lỗi "Port already in use"
- Render tự động set biến `PORT`, không cần config
- File `application.yml` đã config: `port: ${PORT:8080}`

### Dữ liệu bị mất sau restart
- Kiểm tra `SPRING_PROFILES_ACTIVE=render` (không phải `dev`)
- Kiểm tra `DATABASE_URL` đã được set đúng
- Xem logs: Render Dashboard → Service → Logs

### Build failed
- Kiểm tra Java version: project dùng Java 17
- Xem build logs để biết lỗi cụ thể
- Thử build local: `cd backend && mvn clean package`

## So sánh Local vs Docker vs Render

| Môi trường | Database | Profile | Dữ liệu persistent? |
|------------|----------|---------|---------------------|
| Local dev  | H2 in-memory | `dev` | ❌ Mất khi restart |
| Docker     | PostgreSQL | `docker` | ✅ Lưu trong volume |
| Render     | PostgreSQL | `render` | ✅ Lưu trên cloud |

## Tài liệu tham khảo

- [Render Docs - Deploy Spring Boot](https://render.com/docs/deploy-spring-boot)
- [Render Docs - PostgreSQL](https://render.com/docs/databases)
- [Spring Boot - Profiles](https://docs.spring.io/spring-boot/docs/current/reference/html/features.html#features.profiles)
