# Hệ thống quản lý nhân viên (UTC)

Gồm **frontend** (React + TypeScript + Vite + Tailwind CSS + Radix UI) và **backend** (Java 17 + Spring Boot 3).

## Kiến trúc nhanh

| Thành phần | Vai trò |
|------------|---------|
| `frontend/` | SPA, gọi API qua `/api` (proxy khi dev) |
| `backend/` | REST API + JWT + JPA (H2 khi dev, PostgreSQL khi Docker) |

### Vai trò người dùng

- **ADMIN**: xem toàn bộ phòng ban, nhân viên, request; phân quyền trực tiếp (multi-select chức năng); duyệt mọi request.
- **QUẢN LÝ (MANAGER)**: xem nhân viên **trong phòng ban**; duyệt/từ chối/gỡ request **có đối tượng thuộc phòng mình** (không cần từng dòng quyền trong DB — quyền phòng được xử lý trong code).
- **NHÂN VIÊN (EMPLOYEE)**: mặc định **chỉ xem** (read-only) nếu chưa được cấp chức năng; có thể **tạo request** xin thêm quyền; sau khi được duyệt, các mã chức năng được ghi vào `user_features`.

Luồng chính: **Request** — tạo nháp → gửi duyệt → Admin/Quản lý duyệt → quyền áp dụng cho nhân viên được chọn.

## Chạy backend (Docker — cổng 8080)

Từ thư mục gốc dự án:

```bash
docker compose up --build
```

- API: `http://localhost:8080`
- PostgreSQL: `localhost:5432` (user/pass/db: `emp` / `emp` / `empdb`)

Lần đầu chạy, dữ liệu mẫu được seed (xem `DataLoader.java`).

Image build dùng `maven:3.9-eclipse-temurin-17` và `eclipse-temurin:17-jre-jammy` (Debian/Ubuntu) để hỗ trợ **cả amd64 và arm64** (Apple Silicon). Các tag `*-alpine` cũ dễ báo `no match for platform in manifest` khi build trên Mac M1/M2/M3.

### Chạy backend local (không Docker)

Yêu cầu: JDK 17, Maven.

```bash
cd backend
mvn spring-boot:run
```

Profile `dev`: H2 in-memory, `http://localhost:8080`.

## Chạy frontend (dev)

```bash
cd frontend
npm install
npm run dev
```

Mở `http://localhost:5173`. Proxy chuyển `/api` → `http://localhost:8080`.

## Tài khoản demo (dev / seed)

| Username | Password | Vai trò |
|----------|----------|---------|
| `admin` | `admin123` | Admin |
| `manager` | `manager123` | Quản lý (phòng IT) |
| `nhanvien` | `nv123456` | Nhân viên (chưa có quyền chức năng) |

## API chính (REST)

- `POST /api/auth/login` — body `{ "username", "password" }` → JWT
- Header: `Authorization: Bearer <token>`
- `GET/POST/PATCH /api/departments` — Admin
- `GET/POST/PATCH /api/users` — theo quyền (xem `UserService`, `AccessPolicy`)
- `GET /api/features` — danh sách mã chức năng (cho multi-select)
- `GET/POST /api/requests` — request cấp quyền; `POST .../submit`, `approve`, `reject`, `revoke`, `DELETE`

## Thư mục code backend (để đọc theo flow)

1. `domain/` — entity: `UserAccount`, `Department`, `Feature`, `PermissionRequest`
2. `repo/` — Spring Data JPA
3. `service/` — nghiệp vụ + `AccessPolicy` (kiểm tra Admin / Manager / feature)
4. `security/` — JWT, filter, `CustomUserDetailsService`
5. `web/` — REST controller + `GlobalExceptionHandler`

## Gợi ý mở rộng

- Validation chi tiết, phân trang, tìm kiếm theo spec trong file Markdown gốc
- Thông báo khi duyệt/từ chối request
- File Excel export
- Test tự động (JUnit / Vitest)
