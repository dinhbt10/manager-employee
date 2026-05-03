package com.utc.employee.service;

import com.utc.employee.domain.*;
import com.utc.employee.repo.DepartmentRepository;
import com.utc.employee.repo.FeatureRepository;
import com.utc.employee.repo.UserAccountRepository;
import com.utc.employee.security.AccessPolicy;
import com.utc.employee.security.AuthUser;
import com.utc.employee.security.FeatureCodes;
import com.utc.employee.web.BadRequestException;
import com.utc.employee.web.ForbiddenException;
import com.utc.employee.web.dto.CreateUserRequest;
import com.utc.employee.web.dto.UpdateUserRequest;
import com.utc.employee.web.dto.UserDto;
import jakarta.servlet.http.HttpServletResponse;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class UserService {

    private final UserAccountRepository userAccountRepository;
    private final DepartmentRepository departmentRepository;
    private final FeatureRepository featureRepository;
    private final PasswordEncoder passwordEncoder;
    private final AccessPolicy accessPolicy;

    public UserService(
            UserAccountRepository userAccountRepository,
            DepartmentRepository departmentRepository,
            FeatureRepository featureRepository,
            PasswordEncoder passwordEncoder,
            AccessPolicy accessPolicy
    ) {
        this.userAccountRepository = userAccountRepository;
        this.departmentRepository = departmentRepository;
        this.featureRepository = featureRepository;
        this.passwordEncoder = passwordEncoder;
        this.accessPolicy = accessPolicy;
    }

    @Transactional(readOnly = true)
    public List<UserDto> list(AuthUser current, String q, String role, Long departmentId) {
        List<UserDto> base = listBase(current);
        return base.stream()
                .filter(d -> matchesUserFilter(d, q, role, departmentId))
                .toList();
    }

    private List<UserDto> listBase(AuthUser current) {
        if (current.role() == Role.EMPLOYEE) {
            UserAccount self = userAccountRepository.findById(current.id()).orElseThrow();
            return List.of(toDto(self, current));
        }
        if (current.role() == Role.MANAGER) {
            if (current.departmentId() == null) {
                return List.of();
            }
            return userAccountRepository.findByDepartment_Id(current.departmentId()).stream()
                    .map(u -> toDto(u, current))
                    .toList();
        }
        return userAccountRepository.findAll().stream().map(u -> toDto(u, current)).toList();
    }

    private boolean matchesUserFilter(UserDto d, String q, String role, Long departmentId) {
        if (role != null && !role.isBlank() && !role.trim().equalsIgnoreCase(d.role())) {
            return false;
        }
        if (departmentId != null && !departmentId.equals(d.departmentId())) {
            return false;
        }
        if (q == null || q.isBlank()) {
            return true;
        }
        String needle = q.trim().toLowerCase(Locale.ROOT);
        if (containsIgnore(d.fullName(), needle)) {
            return true;
        }
        if (containsIgnore(d.employeeCode(), needle)) {
            return true;
        }
        if (containsIgnore(d.username(), needle)) {
            return true;
        }
        return d.departmentName() != null && containsIgnore(d.departmentName(), needle);
    }

    private static boolean containsIgnore(String hay, String needleLower) {
        return hay != null && hay.toLowerCase(Locale.ROOT).contains(needleLower);
    }

    @Transactional(readOnly = true)
    public UserDto get(AuthUser current, Long id) {
        UserAccount u = userAccountRepository.findById(id).orElseThrow();
        u.getFeatures().size();
        if (u.getDepartment() != null) {
            u.getDepartment().getName();
        }
        if (!accessPolicy.canViewEmployee(current, u)) {
            throw new ForbiddenException("Không có quyền xem nhân viên này");
        }
        return toDto(u, current);
    }

    @Transactional
    public UserDto create(AuthUser current, CreateUserRequest req) {
        if (!accessPolicy.hasFeature(current, FeatureCodes.EMP_CREATE)) {
            throw new ForbiddenException("Không có quyền tạo nhân viên");
        }
        if (userAccountRepository.findByUsername(req.username()).isPresent()) {
            throw new BadRequestException("Username đã tồn tại");
        }
        long seq = userAccountRepository.count() + 1;
        UserAccount u = new UserAccount();
        u.setUsername(req.username().trim());
        u.setPasswordHash(passwordEncoder.encode(req.password()));
        u.setFullName(req.fullName().trim());
        u.setEmployeeCode("NV" + String.format("%04d", seq));
        u.setRole(req.role());
        u.setDepartment(departmentRepository.findById(req.departmentId()).orElseThrow());
        
        // Gán quyền: mặc định theo role + quyền được chọn thêm từ UI
        Set<Feature> features = getDefaultFeaturesForRole(req.role());
        if (req.featureCodes() != null && !req.featureCodes().isEmpty()) {
            features.addAll(resolveFeatures(req.featureCodes()));
        }
        u.setFeatures(features);
        
        return toDto(userAccountRepository.save(u), current);
    }
    
    /**
     * Trả về quyền mặc định theo role:
     * - EMPLOYEE: không có quyền gì (phải xin quyền qua đơn yêu cầu)
     * - MANAGER: có quyền cấp phòng ban (xem, sửa NV trong phòng, duyệt đơn trong phòng)
     *            KHÔNG tự động có DEPT_VIEW (phải được cấp riêng nếu cần)
     * - ADMIN: có tất cả quyền
     */
    private Set<Feature> getDefaultFeaturesForRole(Role role) {
        return switch (role) {
            case EMPLOYEE -> new HashSet<>(); // Không có quyền gì
            case MANAGER -> new HashSet<>(featureRepository.findByCodeInAndActiveTrue(Set.of(
                    FeatureCodes.EMP_VIEW_DEPT,
                    FeatureCodes.EMP_EDIT_DEPT,
                    FeatureCodes.REQ_APPROVE_DEPT
                    // KHÔNG có DEPT_VIEW - Manager phải được cấp riêng nếu cần
            )));
            case ADMIN -> new HashSet<>(featureRepository.findAll()); // Tất cả quyền
        };
    }

    @Transactional
    public UserDto update(AuthUser current, Long id, UpdateUserRequest req) {
        UserAccount u = userAccountRepository.findById(id).orElseThrow();
        u.getFeatures().size();
        if (!accessPolicy.canEditEmployee(current, u)) {
            throw new ForbiddenException("Không có quyền sửa nhân viên này");
        }
        if (req.fullName() != null && !req.fullName().isBlank()) {
            u.setFullName(req.fullName().trim());
        }
        // Chỉ người có quyền EMP_EDIT_ALL mới được sửa role, department và features
        if (accessPolicy.hasFeature(current, FeatureCodes.EMP_EDIT_ALL)) {
            Role oldRole = u.getRole();
            
            if (req.role() != null) {
                u.setRole(req.role());
                
                // Khi đổi role từ MANAGER xuống EMPLOYEE: xóa hết quyền liên quan phòng ban
                if (oldRole == Role.MANAGER && req.role() == Role.EMPLOYEE) {
                    Set<Feature> currentFeatures = new HashSet<>(u.getFeatures());
                    currentFeatures.removeIf(f -> 
                        f.getCode().equals(FeatureCodes.EMP_VIEW_DEPT) ||
                        f.getCode().equals(FeatureCodes.EMP_EDIT_DEPT) ||
                        f.getCode().equals(FeatureCodes.REQ_APPROVE_DEPT) ||
                        f.getCode().equals(FeatureCodes.DEPT_VIEW) ||
                        f.getCode().equals(FeatureCodes.DEPT_CREATE) ||
                        f.getCode().equals(FeatureCodes.DEPT_EDIT)
                    );
                    u.setFeatures(currentFeatures);
                }
                // Khi đổi role từ EMPLOYEE lên MANAGER: gán quyền mặc định của MANAGER
                else if (oldRole == Role.EMPLOYEE && req.role() == Role.MANAGER) {
                    Set<Feature> currentFeatures = new HashSet<>(u.getFeatures());
                    currentFeatures.addAll(featureRepository.findByCodeInAndActiveTrue(Set.of(
                        FeatureCodes.EMP_VIEW_DEPT,
                        FeatureCodes.EMP_EDIT_DEPT,
                        FeatureCodes.REQ_APPROVE_DEPT
                    )));
                    u.setFeatures(currentFeatures);
                }
            }
            if (req.departmentId() != null) {
                u.setDepartment(departmentRepository.findById(req.departmentId()).orElseThrow());
            }
            if (req.featureCodes() != null) {
                u.setFeatures(resolveFeatures(req.featureCodes()));
            }
        }
        return toDto(userAccountRepository.save(u), current);
    }

    private Set<Feature> resolveFeatures(Set<String> codes) {
        List<Feature> list = featureRepository.findByCodeInAndActiveTrue(codes);
        if (list.size() != codes.size()) {
            throw new BadRequestException("Một số mã chức năng không hợp lệ hoặc đã ngưng");
        }
        return new HashSet<>(list);
    }

    private UserDto toDto(UserAccount u, AuthUser viewer) {
        Set<String> codes = u.getFeatures().stream().map(Feature::getCode).collect(Collectors.toSet());
        boolean readOnly = false;
        if (u.getRole() == Role.EMPLOYEE && codes.isEmpty()) {
            readOnly = true;
        }
        String deptName = u.getDepartment() != null ? u.getDepartment().getName() : null;
        Long deptId = u.getDepartment() != null ? u.getDepartment().getId() : null;
        return new UserDto(
                u.getId(),
                u.getEmployeeCode(),
                u.getUsername(),
                u.getFullName(),
                u.getRole().name(),
                deptId,
                deptName,
                codes,
                readOnly
        );
    }

    @Transactional(readOnly = true)
    public void exportToExcel(AuthUser current, String q, String role, Long departmentId, HttpServletResponse response) throws IOException {
        // Kiểm tra quyền export
        if (!accessPolicy.hasFeature(current, FeatureCodes.EMP_EXPORT)) {
            throw new ForbiddenException("Không có quyền xuất Excel");
        }

        // Lấy danh sách nhân viên
        List<UserDto> users = list(current, q, role, departmentId);

        // Tạo workbook
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Danh sách nhân viên");

            // Tạo header style
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);
            headerStyle.setBorderBottom(BorderStyle.THIN);
            headerStyle.setBorderTop(BorderStyle.THIN);
            headerStyle.setBorderLeft(BorderStyle.THIN);
            headerStyle.setBorderRight(BorderStyle.THIN);

            // Tạo header row
            Row headerRow = sheet.createRow(0);
            String[] columns = {"Mã NV", "Họ tên", "Username", "Vai trò", "Phòng ban", "Quyền"};
            for (int i = 0; i < columns.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(columns[i]);
                cell.setCellStyle(headerStyle);
            }

            // Tạo data rows
            int rowNum = 1;
            for (UserDto user : users) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(user.employeeCode());
                row.createCell(1).setCellValue(user.fullName());
                row.createCell(2).setCellValue(user.username());
                row.createCell(3).setCellValue(getRoleLabel(user.role()));
                row.createCell(4).setCellValue(user.departmentName() != null ? user.departmentName() : "");
                row.createCell(5).setCellValue(String.join(", ", user.features()));
            }

            // Auto-size columns
            for (int i = 0; i < columns.length; i++) {
                sheet.autoSizeColumn(i);
            }

            // Set response headers
            response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            response.setHeader("Content-Disposition", "attachment; filename=danh-sach-nhan-vien.xlsx");

            // Write to response
            workbook.write(response.getOutputStream());
        }
    }

    private String getRoleLabel(String role) {
        return switch (role) {
            case "ADMIN" -> "Quản trị viên";
            case "MANAGER" -> "Quản lý";
            case "EMPLOYEE" -> "Nhân viên";
            default -> role;
        };
    }
}
