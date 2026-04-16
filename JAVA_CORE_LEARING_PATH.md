# Lộ trình học Java Core qua project `manager-employee` (dành cho FE)

Tài liệu này bỏ qua frontend, chỉ tập trung backend Java theo kiểu:
**đọc code -> chạy API -> sửa một thay đổi nhỏ -> hiểu vì sao hệ thống chạy được**.

---

## 1) Kiến thức Java Core có trong project

### OOP và tổ chức theo layer

- `web/` (Controller): nhận request, trả response.
- `service/` (Business): xử lý nghiệp vụ.
- `repo/` (Data access): truy vấn DB qua Spring Data JPA.
- `domain/` (Entity): mô hình dữ liệu.

File tiêu biểu:

- `backend/src/main/java/com/utc/employee/web/DepartmentController.java`
- `backend/src/main/java/com/utc/employee/service/DepartmentService.java`
- `backend/src/main/java/com/utc/employee/repo/DepartmentRepository.java`
- `backend/src/main/java/com/utc/employee/domain/Department.java`

### Collections, Generics, Stream API

- `List<T>`, `Set<T>`, `Optional<T>`.
- `.stream().filter().map().toList()`.
- `Collectors.toSet()`.

File tiêu biểu:

- `backend/src/main/java/com/utc/employee/service/UserService.java`
- `backend/src/main/java/com/utc/employee/service/PermissionRequestService.java`

### Exception handling

- Custom exception: `BadRequestException`, `ForbiddenException`.
- Bắt lỗi tập trung: `GlobalExceptionHandler`.

### Annotations

- Spring: `@RestController`, `@Service`, `@Transactional`.
- Validation: `@Valid`, `@NotBlank`.
- JPA: `@Entity`, `@Id`, `@Table`, mapping quan hệ.

### Security nền tảng

- JWT: tạo/parse token.
- Authorization theo role + scope + feature.

File tiêu biểu:

- `backend/src/main/java/com/utc/employee/service/AuthService.java`
- `backend/src/main/java/com/utc/employee/security/JwtService.java`
- `backend/src/main/java/com/utc/employee/security/AccessPolicy.java`

---

## 2) Cách học nhanh cho người làm FE

Học theo flow của **1 request**:

1. Endpoint nằm ở controller nào?
2. Service xử lý rule gì?
3. Repo/entity đọc-ghi dữ liệu ra sao?
4. Điều kiện lỗi và quyền nằm ở đâu?

Nguyên tắc:

- Mỗi ngày 1 endpoint.
- Mỗi endpoint sửa 1 thay đổi nhỏ để nhớ lâu.
- Luôn ghi chú 4 ý: `input`, `validate`, `business rule`, `output`.

---

## 3) Chức năng đơn giản nhất để bắt đầu: API phòng ban

Endpoint:

- `GET /api/departments`
- `POST /api/departments`
- `PATCH /api/departments/{id}`

Thứ tự đọc file:

1. `backend/src/main/java/com/utc/employee/web/DepartmentController.java`
2. `backend/src/main/java/com/utc/employee/service/DepartmentService.java`
3. `backend/src/main/java/com/utc/employee/repo/DepartmentRepository.java`
4. `backend/src/main/java/com/utc/employee/domain/Department.java`
5. `backend/src/main/java/com/utc/employee/web/dto/CreateDepartmentRequest.java`
6. `backend/src/main/java/com/utc/employee/web/dto/UpdateDepartmentRequest.java`

---

## 4) Hướng dẫn SIÊU CHI TIẾT từ B1 (cầm tay chỉ việc)

Mục tiêu: sau phần này, bạn tự dựng được một API CRUD cơ bản theo chuẩn project.

### B0 - Chốt bài toán trước khi code

Phải trả lời được:

- Department có trường gì? (`id`, `code`, `name`, `active`)
- API cần gì? (`GET`, `POST`, `PATCH`)
- Ai được dùng? (Admin)
- Lỗi nào có thể xảy ra? (403, 400, not found)

Nếu bỏ qua bước này, code rất dễ phải sửa lại.

---

### B1 - Tạo Entity (mô hình dữ liệu)

File: `backend/src/main/java/com/utc/employee/domain/Department.java`

Bạn tạo class `Department` để map với bảng `departments`.

Các thành phần bắt buộc:

- `@Entity`, `@Table(name = "departments")`
- `id` với `@Id`, `@GeneratedValue`
- `code` với `@Column(nullable = false, unique = true, length = 32)`
- `name` với `@Column(nullable = false, length = 500)`
- `active` với `@Column(nullable = false)`
- Getter/Setter 

Vì sao cần bước này:

- JPA chỉ lưu/đọc được dữ liệu khi bạn mô tả entity rõ ràng.
- Entity là “xương sống” dữ liệu cho module.

Checklist:

- Có `@Entity`
- Có khóa chính `id`
- Có ràng buộc cột hợp lý
- App chạy không lỗi mapping

---

### B2 - Tạo Repository (truy cập dữ liệu)

File: `backend/src/main/java/com/utc/employee/repo/DepartmentRepository.java`

Bạn tạo:

- `public interface DepartmentRepository extends JpaRepository<Department, Long>`

Các hàm nền tảng có sẵn:

- `findAll()`, `findById()`, `save()`, `count()`, ...

Hàm custom có thể thêm:

- `Optional<Department> findByCode(String code)`
- `boolean existsByNameIgnoreCase(String name)` (nên thêm khi validate trùng tên)

Vì sao cần bước này:

- Service chỉ tập trung nghiệp vụ, không viết SQL tay.
- Dễ mở rộng và bảo trì.

Checklist:

- Generic đúng `Department, Long`
- App start không lỗi bean repository
- Gọi được các hàm CRUD cơ bản

---

### B3 - Tạo DTO cho request/response

File:

- `backend/src/main/java/com/utc/employee/web/dto/CreateDepartmentRequest.java`
- `backend/src/main/java/com/utc/employee/web/dto/UpdateDepartmentRequest.java`
- `backend/src/main/java/com/utc/employee/web/dto/DepartmentDto.java`

Mục tiêu:

- Không dùng Entity trực tiếp làm request body.
- Tách input/output API khỏi model DB nội bộ.

Cách làm:

- `CreateDepartmentRequest`: có `name`, thêm `@NotBlank`.
- `UpdateDepartmentRequest`: có `name` và `active` (cho PATCH).
- `DepartmentDto`: chuẩn response trả ra client.

Checklist:

- Có validation cho input bắt buộc
- Response ổn định schema
- Không expose thừa field nội bộ

---

### B4 - Viết Service (trái tim nghiệp vụ)

File: `backend/src/main/java/com/utc/employee/service/DepartmentService.java`

Service nên có các hàm chính:

1. `list(AuthUser current, String q, Boolean active)`

- Dùng để lấy danh sách phòng ban.
- Việc làm:
  - Kiểm tra quyền (`canManageDepartment`).
  - `findAll()` từ repository.
  - `map` sang `DepartmentDto`.
  - `filter` theo `q`, `active`.

1. `create(AuthUser current, CreateDepartmentRequest req)`

- Dùng để tạo phòng ban mới.
- Việc làm:
  - Kiểm tra quyền admin.
  - Sinh mã phòng ban kiểu `PB001`, `PB002`.
  - Chuẩn hóa tên (`trim`).
  - `save()` và trả DTO.

1. `update(AuthUser current, Long id, UpdateDepartmentRequest req)`

- Dùng để cập nhật thông tin.
- Việc làm:
  - Kiểm tra quyền admin.
  - Tìm bản ghi theo `id`.
  - Chỉ cập nhật field có gửi lên.
  - `save()` và trả DTO.

Hàm phụ:

- `toDto(Department d)`: map entity -> response.
- `matches(DepartmentDto d, String q, Boolean active)`: logic filter.

Checklist:

- Có check quyền đầu mỗi thao tác
- Không để business logic trong controller
- Trả về DTO thay vì entity
- Có xử lý null/blank rõ ràng

---

### B5 - Viết Controller (mở API REST)

File: `backend/src/main/java/com/utc/employee/web/DepartmentController.java`

Cấu hình:

- `@RestController`
- `@RequestMapping("/api/departments")`

Inject:

- `DepartmentService`
- `CurrentUser`

Endpoint:

- `@GetMapping`: nhận `q`, `active`, gọi `service.list(...)`
- `@PostMapping`: nhận `@Valid @RequestBody CreateDepartmentRequest`, gọi `service.create(...)`
- `@PatchMapping("/{id}")`: nhận `id` + body update, gọi `service.update(...)`

Vì sao cần `CurrentUser`:

- Lấy user hiện tại từ security context để check role/quyền trong service.

Checklist:

- URL đúng chuẩn REST
- HTTP method đúng mục đích
- Có `@Valid` ở create
- Controller mỏng, chỉ điều phối

---

### B6 - Xử lý lỗi tập trung

File liên quan:

- `backend/src/main/java/com/utc/employee/web/BadRequestException.java`
- `backend/src/main/java/com/utc/employee/web/ForbiddenException.java`
- `backend/src/main/java/com/utc/employee/web/GlobalExceptionHandler.java`

Nguyên tắc:

- Sai dữ liệu/nghiệp vụ -> `BadRequestException`.
- Sai quyền -> `ForbiddenException`.
- Handler chuyển thành HTTP response thống nhất cho FE.

Checklist:

- Không try/catch rải rác ở controller
- Message lỗi rõ ràng, dễ debug
- FE đọc được lỗi nhất quán

---

### B7 - Chạy và test API

1. Chạy backend:

- `cd backend`
- `mvn spring-boot:run`

1. Login lấy token:

- `POST /api/auth/login`
- Body: `{ "username": "admin", "password": "admin123" }`

1. Gọi API với header:

- `Authorization: Bearer <token>`

1. Test tối thiểu:

- Happy path:
  - Tạo phòng ban thành công.
  - List thấy phòng ban vừa tạo.
  - Patch đổi tên/trạng thái thành công.
- Sad path:
  - User không phải admin -> 403.
  - Name rỗng khi create -> 400.
  - Update `id` không tồn tại -> not found.

---

### B8 - Bài tập nâng cấp sau bản cơ bản

Làm lần lượt:

1. Cấm trùng tên phòng ban (không phân biệt hoa thường).
2. Cấm trùng mã phòng ban.
3. Soft delete (`active=false`) thay vì xóa cứng.
4. Phân trang cho API list.

Mỗi bài tập sẽ giúp bạn học thêm:

- Query method trong repository.
- Validation business rule.
- Thiết kế response cho danh sách lớn.

---

### B9 - Bản đồ “hàm nào làm gì” trong module Department

- `DepartmentController.list(...)`: nhận query, gọi service list.
- `DepartmentController.create(...)`: nhận body tạo mới, validate, gọi service create.
- `DepartmentController.update(...)`: nhận id + body patch, gọi service update.
- `DepartmentService.list(...)`: check quyền + filter + map DTO.
- `DepartmentService.create(...)`: check quyền + tạo dữ liệu + save.
- `DepartmentService.update(...)`: check quyền + cập nhật có điều kiện + save.
- `DepartmentService.matches(...)`: gom logic filter để code gọn.
- `DepartmentService.toDto(...)`: chuẩn hóa object response.
- `DepartmentRepository.findByCode(...)`: hỗ trợ truy vấn theo mã.

---

### B10 - Cách tự học tiếp sau bài Department

Sau khi nắm chắc Department, lặp lại y chang cho module `users`:

1. Đọc controller `users`.
2. Đi qua service để hiểu rule.
3. Xem `AccessPolicy` để hiểu quyền.
4. Test role `ADMIN`, `MANAGER`, `EMPLOYEE`.

Làm được 2 module này là bạn đã vượt giai đoạn “vỡ lòng Java backend”.

---

## 5) Kế hoạch 7 ngày (gợi ý)

- Ngày 1: đọc `domain/` + `repo/`.
- Ngày 2: làm full `departments`.
- Ngày 3: `users` list/filter.
- Ngày 4: `auth/jwt`.
- Ngày 5: `AccessPolicy`.
- Ngày 6: workflow request.
- Ngày 7: thêm 1 rule nghiệp vụ + test.

---

## 6) Bước tiếp theo đề xuất

Nếu bạn muốn, mình có thể viết thêm:

- Bộ request Postman copy-paste chạy ngay (login + create/list/update departments).
- Hoặc hướng dẫn luôn cách implement rule **“không trùng tên phòng ban”** trong code hiện tại.

# Lo trinh hoc Java Core qua project manager-employee (danh cho FE)

Tai lieu nay bo qua frontend, chi tap trung backend Java de hoc theo kieu "doc code + chay endpoint + sua tinh nang nho".

## 1) Kien thuc Java Core co trong project

### OOP va to chuc code theo layer

- `web/` (Controller): nhan request, tra response.
- `service/` (Business): xu ly nghiep vu.
- `repo/` (Data access): truy van DB qua Spring Data JPA.
- `domain/` (Entity): model du lieu.

File tham khao:

- `backend/src/main/java/com/utc/employee/web/DepartmentController.java`
- `backend/src/main/java/com/utc/employee/service/DepartmentService.java`
- `backend/src/main/java/com/utc/employee/repo/DepartmentRepository.java`
- `backend/src/main/java/com/utc/employee/domain/Department.java`

### Collections, Generics, Stream API

- `List<T>`, `Set<T>`, `Optional<T>`.
- `.stream().filter().map().toList()`.
- `Collectors.toSet()`.

File tham khao:

- `backend/src/main/java/com/utc/employee/service/UserService.java`
- `backend/src/main/java/com/utc/employee/service/PermissionRequestService.java`

### Exception handling

- Custom exception: `BadRequestException`, `ForbiddenException`.
- Global handler: `GlobalExceptionHandler`.

### Annotations

- Spring: `@RestController`, `@Service`, `@Transactional`.
- Validation: `@Valid`, `@NotBlank`.
- JPA: `@Entity`, `@Id`, `@Table`, quan he entity.

### Security nen tang (de hoc nang cao)

- JWT: tao/parse token.
- Authorization theo role + scope + feature.

File tham khao:

- `backend/src/main/java/com/utc/employee/service/AuthService.java`
- `backend/src/main/java/com/utc/employee/security/JwtService.java`
- `backend/src/main/java/com/utc/employee/security/AccessPolicy.java`

## 2) Cach hoc nhanh cho nguoi lam FE

Hoc theo "flow 1 request":

1. Endpoint nam o controller nao?
2. Service xu ly rule gi?
3. Repo/entity doc-ghi du lieu ra sao?
4. Dieu kien loi va quyen o dau?

Nguyen tac:

- Moi ngay 1 endpoint, test bang Postman/curl.
- Moi endpoint sua 1 thay doi nho de nho sau.
- Luon ghi chu 4 y: input, validate, business rule, output.

## 3) Chuc nang don gian nhat de bat dau

**Quan ly phong ban** (`/api/departments`) la bai mo man de nhat.

### Endpoint co san

- `GET /api/departments`
- `POST /api/departments`
- `PATCH /api/departments/{id}`

### File can doc theo thu tu

1. `backend/src/main/java/com/utc/employee/web/DepartmentController.java`
2. `backend/src/main/java/com/utc/employee/service/DepartmentService.java`
3. `backend/src/main/java/com/utc/employee/repo/DepartmentRepository.java`
4. `backend/src/main/java/com/utc/employee/domain/Department.java`
5. `backend/src/main/java/com/utc/employee/web/dto/CreateDepartmentRequest.java`
6. `backend/src/main/java/com/utc/employee/web/dto/UpdateDepartmentRequest.java`

### Thuc hanh tung buoc

1. Chay backend:
  - `cd backend`
  - `mvn spring-boot:run`
2. Dang nhap lay token:
  - `POST /api/auth/login` voi `admin/admin123`
3. Goi thu API:
  - List phong ban.
  - Tao phong ban moi.
  - Sua ten/trang thai phong ban.
4. Doi chieu ket qua voi logic trong `DepartmentService`.

### Bai tap mini ngay dau tien

Them rule: **khong cho trung ten phong ban** (khong phan biet hoa thuong) khi create/update.

Muc tieu hoc duoc:

- Validate business rule.
- Dung repo de check du lieu ton tai.
- Nem custom exception de tra thong diep ro rang.

## 4) Lo trinh nang cao dan

### Muc 1: User list + filter

- Doc: `UserService.list(...)`
- Hoc: stream filter nhieu dieu kien, role-based visibility.

### Muc 2: Login + JWT

- Doc: `AuthService`, `JwtService`.
- Hoc: authentication flow, token issue/parse.

### Muc 3: Phan quyen theo role/scope/feature

- Doc: `AccessPolicy`.
- Hoc: cach tach logic quyen khoi controller/service.

### Muc 4: Workflow request cap quyen

- Doc: `PermissionRequestService`.
- Hoc: state transition `DRAFT -> PENDING -> APPROVED/REJECTED/REVOKED`.

### Muc 5: Tu toi uu va nang cap

- Them pagination/filter tot hon.
- Them test cho service.
- Tu mo rong API theo nhu cau thuc te.

## 5) Ke hoach 7 ngay (goi y)

- Ngay 1: Doc `domain/` + `repo/` de nam model.
- Ngay 2: Lam full `departments`.
- Ngay 3: `users` list/filter.
- Ngay 4: auth/jwt.
- Ngay 5: phan quyen `AccessPolicy`.
- Ngay 6: workflow request.
- Ngay 7: tu them 1 rule nghiep vu + test.

---

Neu ban muon, buoc tiep theo co the lam ngay:

- Toi viet cho ban checklist test API (copy-paste dung luon trong Postman).
- Hoac implement truc tiep rule "trung ten phong ban" trong backend.

## 6) Huong dan SIEU CHI TIET: tu B1 de lam API phong ban

Muc tieu phan nay: neu mai ban tu tao API moi (vd: API chuc vu, API du an), ban co the lap lai y chang khung nay.

---

### B0 - Hieu bai toan truoc khi code (cuc ky quan trong)

Truoc khi viet code, chot nghiep vu:

- Department co cac truong gi? (id, code, name, active)
- API can co gi?
  - `GET /api/departments`: lay danh sach + filter `q`, `active`
  - `POST /api/departments`: tao phong ban moi
  - `PATCH /api/departments/{id}`: cap nhat ten/trang thai
- Ai duoc dung API nay? Chi Admin.
- Khi loi thi tra gi? (Forbidden / BadRequest / NotFound)

Neu bo qua B0, code de sai huong va sau do phai sua lai rat nhieu.

---

### B1 - Tao Entity (model du lieu DB)

File: `backend/src/main/java/com/utc/employee/domain/Department.java`

Ban tao class `Department` de map toi bang `departments`.

Nhung thanh phan can co:

- `@Entity`, `@Table(name = "departments")`: bao JPA day la bang DB.
- `id`: khoa chinh, tu tang (`@Id`, `@GeneratedValue`).
- `code`: ma phong ban, unique, khong null.
- `name`: ten phong ban, khong null.
- `active`: trang thai dang hoat dong hay khong.
- Getter/Setter de service co the doc ghi.

Tai sao can B1:

- Khong co Entity thi JPA khong biet save/load doi tuong nao.
- Day la "nguon su that" cho cau truc du lieu.

Checklist B1:

- Class co `@Entity`
- Co truong `id`
- Co cac rang buoc cot (`nullable`, `unique`, `length`)
- Chay app khong loi mapping

---

### B2 - Tao Repository (lop truy cap du lieu)

File: `backend/src/main/java/com/utc/employee/repo/DepartmentRepository.java`

Ban tao interface:

- `extends JpaRepository<Department, Long>`
- Them ham query can dung, vd:
  - `Optional<Department> findByCode(String code)`
  - (mo rong de hoc): `boolean existsByNameIgnoreCase(String name)`

Tai sao can B2:

- Service khong nen viet SQL tay trong project nay.
- Repository cho phep query nhanh, de test, de doc.

Checklist B2:

- Interface dung generic dung (`Department`, `Long`)
- App start khong loi bean repository
- Goi duoc `findAll()`, `findById()`, `save()`

---

### B3 - Tao DTO cho input/output

File lien quan:

- `backend/src/main/java/com/utc/employee/web/dto/CreateDepartmentRequest.java`
- `backend/src/main/java/com/utc/employee/web/dto/UpdateDepartmentRequest.java`
- `backend/src/main/java/com/utc/employee/web/dto/DepartmentDto.java`

Can tach DTO vi:

- Request tu client KHONG nen buoc dính truc tiep vao Entity.
- Tranh expose field nhay cam/noi bo.
- De validation ro rang.

Noi dung:

- `CreateDepartmentRequest`: chi can `name`, co `@NotBlank`.
- `UpdateDepartmentRequest`: `name` va `active` de cap nhat 1 phan (PATCH).
- `DepartmentDto`: object tra ve client.

Checklist B3:

- Khong dung Entity lam request body truc tiep
- Co validation cho field bat buoc
- Response giu on dinh schema

---

### B4 - Viet Service (trai tim nghiep vu)

File: `backend/src/main/java/com/utc/employee/service/DepartmentService.java`

Service can co 3 ham chinh:

1. `list(AuthUser current, String q, Boolean active)`

- Muc dich: lay danh sach phong ban, co filter.
- Viec can lam:
  - Kiem tra quyen `canManageDepartment`.
  - Lay data tu `departmentRepository.findAll()`.
  - Map entity -> dto.
  - Filter theo `q` va `active`.
- Kien thuc hoc duoc: Stream API, validate quyen, clean code (tach `matches(...)`).

1. `create(AuthUser current, CreateDepartmentRequest req)`

- Muc dich: tao phong ban moi.
- Viec can lam:
  - Kiem tra quyen admin.
  - Sinh ma phong ban (`PB001`, `PB002`...).
  - Trim ten phong.
  - Save DB va tra dto.
- Kien thuc hoc duoc: tao entity moi, save transaction, mapping response.

1. `update(AuthUser current, Long id, UpdateDepartmentRequest req)`

- Muc dich: cap nhat 1 phong ban.
- Viec can lam:
  - Kiem tra quyen admin.
  - Tim ban ghi theo id (khong co thi bao loi).
  - Chi update field co gui len (`name`, `active`).
  - Save va tra dto.
- Kien thuc hoc duoc: update 1 phan voi PATCH.

Ham phu thuong co:

- `toDto(Department d)`: chuyen entity sang response.
- `matches(DepartmentDto d, String q, Boolean active)`: logic filter.

Tai sao Service la trong tam:

- Controller chi nen "nhan/chuyen".
- Rule nghiep vu nen nam 1 cho de bao tri.

Checklist B4:

- Ham service dat ten theo hanh dong (`list/create/update`)
- Co check quyen truoc khi thao tac du lieu
- Co xu ly input xau (blank/null)
- Tra ve DTO, khong tra truc tiep Entity

---

### B5 - Viet Controller (expose REST API)

File: `backend/src/main/java/com/utc/employee/web/DepartmentController.java`

Controller can co:

- `@RestController`
- `@RequestMapping("/api/departments")`
- Inject `DepartmentService` + `CurrentUser`

Endpoint:

- `@GetMapping`
  - Nhan query param `q`, `active`
  - Goi `departmentService.list(currentUser.get(), q, active)`
- `@PostMapping`
  - Nhan body `@Valid CreateDepartmentRequest`
  - Goi service create
- `@PatchMapping("/{id}")`
  - Nhan `id` + `UpdateDepartmentRequest`
  - Goi service update

Tai sao can `CurrentUser`:

- Lay thong tin user dang dang nhap tu security context.
- Day role/id/department vao service de check quyen.

Checklist B5:

- URL dung chuan REST
- Method HTTP dung (`GET/POST/PATCH`)
- Dung `@Valid` cho create
- Controller khong chua business logic phuc tap

---

### B6 - Xu ly loi dung cach

File lien quan:

- `backend/src/main/java/com/utc/employee/web/BadRequestException.java`
- `backend/src/main/java/com/utc/employee/web/ForbiddenException.java`
- `backend/src/main/java/com/utc/employee/web/GlobalExceptionHandler.java`

Nguyen tac:

- Rule sai -> nem `BadRequestException`.
- Khong du quyen -> nem `ForbiddenException`.
- Global handler convert thanh HTTP response de FE doc duoc.

Tai sao can B6:

- Khong de try/catch tung controller.
- API tra loi nhat quan, FE de xu ly.

---

### B7 - Chay va test endpoint (thuc chien)

1. Chay backend:

- `cd backend`
- `mvn spring-boot:run`

1. Dang nhap lay token:

- `POST /api/auth/login`
- Body:
  - `{ "username": "admin", "password": "admin123" }`

1. Goi API voi header:

- `Authorization: Bearer <token>`

1. Test case can co:

- Happy path:
  - Create phong ban thanh cong.
  - List thay phong ban vua tao.
  - Patch doi ten/active thanh cong.
- Sad path:
  - User khong phai admin -> 403.
  - Body create name rong -> 400.
  - Patch id khong ton tai -> loi not found.

Checklist B7:

- Co test thanh cong va that bai
- Log backend khong bao exception la
- Du lieu DB dung nhu mong doi

---

### B8 - Nang cap bai toan de hoc sau hon

Sau khi API chay on, them rule:

1. Khong cho trung `name` phong ban (ignore case).
2. Khong cho trung `code`.
3. Them soft-delete (chi set `active=false`).
4. Them pagination cho list.

Moi lan nang cap, ban hoc them:

- Query method trong repository.
- Validation truoc khi save.
- Design API response cho list co phan trang.

---

### B9 - Ban do "ham nao de lam gi" trong tinh nang Department

- `DepartmentController.list(...)`
  - Nhan query tu client, goi service list.
- `DepartmentController.create(...)`
  - Nhan body tao moi, validate format, goi service create.
- `DepartmentController.update(...)`
  - Nhan id + body patch, goi service update.
- `DepartmentService.list(...)`
  - Check quyen + filter + map DTO.
- `DepartmentService.create(...)`
  - Check quyen + tao du lieu moi + save.
- `DepartmentService.update(...)`
  - Check quyen + cap nhat co dieu kien + save.
- `DepartmentService.matches(...)`
  - Ham phu de xu ly filter text/status.
- `DepartmentService.toDto(...)`
  - Chuyen model noi bo thanh object tra API.
- `DepartmentRepository.findByCode(...)`
  - Tim phong theo ma (phuc vu validate/truy van).

---

### B10 - Cach tu hoc sau bai Department

Sau khi ban "thong" bai nay, lap lai y chang cho module `users`:

1. Doc controller users.
2. Ve luong qua service.
3. Liet ke rule quyen trong `AccessPolicy`.
4. Chay endpoint + test role Admin/Manager/Employee.

Neu lam duoc nhu vay voi 2 module (`departments` + `users`), ban da vuot qua giai doan "vo long Java backend".