# Hệ thống quản lý nhân viên (UTC)

Gồm **frontend** (React + TypeScript + Vite + Tailwind CSS + Radix UI) và **backend** (Java 17 + Spring Boot 3).

## Yêu cầu môi trường

| Công cụ | Phiên bản / ghi chú |
|---------|-------------------|
| **Docker Desktop** (hoặc Docker Engine + Compose) | **macOS / Windows:** cài [Docker Desktop](https://www.docker.com/products/docker-desktop/), mở app và đợi Docker sẵn sàng trước khi gõ lệnh. **Windows:** backend WSL2 được khuyến nghị (Docker Desktop → Settings → General → *Use the WSL 2 based engine*). Dùng `docker compose` (Compose V2, kèm Docker Desktop) hoặc `docker-compose` nếu cài plugin riêng. |
| **Node.js** | Khuyến nghị 20 LTS trở lên (để chạy Vite frontend) |
| **JDK 17** + **Maven 3.9+** | Chỉ cần khi chạy backend **không** dùng Docker |

Repository không có container cho frontend: UI luôn chạy bằng `npm run dev` (hoặc build tĩnh và phục vụ bằng server riêng).

---

## Chạy dự án (full stack — khuyến nghị khi phát triển)

Cần **hai terminal** từ thư mục gốc `manager-employee/`:

### 1. Backend + cơ sở dữ liệu (Docker)

Trên **macOS** và **Windows**, mở **Docker Desktop** trước (thanh menu / khay hệ thống phải báo Docker đang chạy). Sau đó từ thư mục gốc:

```bash
docker compose up --build
```

*(Nếu máy chỉ có lệnh cũ: `docker-compose up --build` — cùng file `docker-compose.yml`.)*

- **API REST:** `http://localhost:8080` (prefix `/api/...`)
- **PostgreSQL:** `localhost:5432` — user / password / database: `emp` / `emp` / `empdb`
- Profile Spring: `docker` (PostgreSQL, `ddl-auto: update`, chạy thêm `schema-docker.sql` nếu cần)
- Biến môi trường có thể chỉnh trong `docker-compose.yml` (ví dụ `JWT_SECRET`, `CORS_ALLOWED_ORIGINS` khi deploy)

Đợi container `db` healthy rồi `api` mới start (đã cấu hình `depends_on`).

### 2. Frontend (Vite)

```bash
cd frontend
npm install
npm run dev
```

- Mở trình duyệt: **`http://localhost:5173`**
- Vite proxy: request tới **`/api`** được chuyển tới **`http://localhost:8080`** (xem `frontend/vite.config.ts`). Client axios dùng `baseURL: "/api"` nên không cần file `.env` cho dev.

### 3. Đăng nhập thử

Dữ liệu mẫu được seed lần đầu khi bảng `features` còn trống (xem `DataLoader.java`).

| Username | Password | Vai trò |
|----------|----------|---------|
| `admin` | `admin123` | Admin |
| `manager` | `manager123` | Quản lý (phòng IT) |
| `nhanvien` | `nv123456` | Nhân viên |

### Kiểm tra nhanh

- Health (Actuator): `GET http://localhost:8080/actuator/health`
- Dừng stack Docker: `Ctrl+C` hoặc `docker compose down` (volume `pgdata` giữ dữ liệu PostgreSQL giữa các lần chạy)

---

## Chạy chỉ backend local (không Docker)

Phù hợp khi muốn H2 in-memory, không cần PostgreSQL.

Yêu cầu: **JDK 17**, **Maven**.

```bash
cd backend
mvn spring-boot:run
```

- Mặc định profile **`dev`**: H2 in-memory, `ddl-auto: create-drop`, cổng **8080**
- Có thể bật H2 Console (đã bật trên profile dev trong `application.yml`)

Sau đó vẫn chạy frontend như trên (`npm run dev` tại `frontend/`) và dùng `http://localhost:5173`.

---

## Build production (tham khảo)

**Frontend:**

```bash
cd frontend
npm install
npm run build
```

Thư mục output: `frontend/dist/`. Cần phục vụ file tĩnh bằng nginx/CDN và cấu hình gọi API (cùng origin hoặc CORS). Khi domain frontend khác backend, set `CORS_ALLOWED_ORIGINS` cho container API (ví dụ trong `docker-compose.yml`).

**Backend (JAR):**

```bash
cd backend
mvn -q -B package -DskipTests
```

File JAR nằm trong `backend/target/`. Chạy với profile `docker` và biến `DB_*`, `JWT_SECRET` tương tự `docker-compose.yml`.

Image Docker của API build từ `backend/Dockerfile` (multi-stage: Maven → JRE 17). Base image dùng **eclipse-temurin Debian** (không dùng Alpine) để build ổn định trên **amd64 và arm64** (Apple Silicon).

---

## Kiến trúc nhanh

| Thành phần | Vai trò |
|------------|---------|
| `frontend/` | SPA, gọi API qua `/api` (proxy khi dev) |
| `backend/` | REST API + JWT + JPA (H2 khi `dev`, PostgreSQL khi `docker`) |

### Vai trò người dùng

- **ADMIN**: xem toàn bộ phòng ban, nhân viên, request; phân quyền trực tiếp (multi-select chức năng); duyệt mọi request.
- **QUẢN LÝ (MANAGER)**: xem nhân viên **trong phòng ban**; duyệt/từ chối/gỡ request **có đối tượng thuộc phòng mình** (không cần từng dòng quyền trong DB — quyền phòng được xử lý trong code).
- **NHÂN VIÊN (EMPLOYEE)**: mặc định **chỉ xem** (read-only) nếu chưa được cấp chức năng; có thể **tạo request** xin thêm quyền; sau khi được duyệt, các mã chức năng được ghi vào `user_features`.

Luồng chính: **Request** — tạo nháp → gửi duyệt → Admin/Quản lý duyệt → quyền áp dụng cho nhân viên được chọn.

CORS: nếu `app.cors.allowed-origins` để trống, backend cho phép pattern `http://localhost:*` và `http://127.0.0.1:*` (phù hợp dev với Vite).

---

## API chính (REST)

- `POST /api/auth/login` — body `{ "username", "password" }` → JWT
- Header: `Authorization: Bearer <token>`
- `GET/POST/PATCH /api/departments` — Admin
- `GET/POST/PATCH /api/users` — theo quyền (xem `UserService`, `AccessPolicy`)
- `GET /api/features` — danh sách mã chức năng (cho multi-select)
- CRUD/quản trị features (Admin): xem `FeatureController`
- `GET/POST /api/requests` — request cấp quyền; `POST .../submit`, `approve`, `reject`, `revoke`, `DELETE`

---

## Thư mục code backend (để đọc theo flow)

1. `domain/` — entity: `UserAccount`, `Department`, `Feature`, `PermissionRequest`
2. `repo/` — Spring Data JPA
3. `service/` — nghiệp vụ + `AccessPolicy` (kiểm tra Admin / Manager / feature)
4. `security/` — JWT, filter, `CustomUserDetailsService`
5. `web/` — REST controller + `GlobalExceptionHandler`

---

## Gợi ý mở rộng

- Validation chi tiết, phân trang, tìm kiếm theo spec
- Thông báo khi duyệt/từ chối request
- File Excel export
- Test tự động (JUnit / Vitest)

---

## Xử lý sự cố thường gặp

| Hiện tượng | Gợi ý |
|------------|--------|
| **`Cannot connect to the Docker daemon`** / **`Is the docker daemon running?`** | **macOS / Windows:** mở Docker Desktop và đợi tới khi trạng thái *running*. Thử `docker info` — nếu vẫn lỗi, khởi động lại Docker Desktop. **Windows:** bật WSL2 và tích hợp distro trong Docker Desktop (Settings → Resources → WSL integration). **Linux:** `sudo systemctl start docker` (hoặc tương đương). Socket (`unix://.../docker.sock`) do Docker client tự chọn theo OS — không cần sửa file compose. |
| Port **8080** hoặc **5432** đã được dùng | Đổi mapping port trong `docker-compose.yml` hoặc tắt ứng dụng đang chiếm port |
| Port **5173** bận | Đổi `server.port` trong `vite.config.ts` hoặc chạy `npm run dev -- --port 5174` |
| Frontend không gọi được API | Đảm bảo backend đang chạy tại `localhost:8080`; kiểm tra proxy `/api` trong Vite |
| Seed không chạy trên Docker | Seed chỉ chạy khi `features` trống; nếu DB cũ đã có dữ liệu, xóa volume: `docker compose down -v` (mất hết dữ liệu PostgreSQL) |
