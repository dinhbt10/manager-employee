package com.utc.employee.config;

import com.utc.employee.domain.*;
import com.utc.employee.repo.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Random;

@Configuration
public class DataLoader {

    @Bean
    CommandLineRunner seed(
            FeatureRepository featureRepository,
            DepartmentRepository departmentRepository,
            UserAccountRepository userAccountRepository,
            PermissionRequestRepository permissionRequestRepository,
            PasswordEncoder passwordEncoder) {
        return args -> {
            // Chỉ seed khi chưa có dữ liệu (kiểm tra cả features và users)
            if (featureRepository.count() > 0 || userAccountRepository.count() > 0) {
                return;
            }
            
            Random random = new Random();
            
            // ========== FEATURES ==========
            List<Feature> feats = List.of(
                    f("EMP_CREATE", "Thêm nhân viên"),
                    f("EMP_EDIT_ALL", "Sửa nhân viên (toàn hệ thống)"),
                    f("EMP_VIEW_ALL", "Xem danh sách NV toàn hệ thống"),
                    f("EMP_EXPORT", "Xuất Excel nhân viên"),
                    f("REQ_APPROVE_ALL", "Duyệt request toàn hệ thống"),
                    f("EMP_EDIT_DEPT", "Sửa NV trong phòng"),
                    f("EMP_VIEW_DEPT", "Xem NV trong phòng"),
                    f("REQ_APPROVE_DEPT", "Duyệt request trong phòng"),
                    f("DEPT_VIEW", "Xem danh sách phòng ban"),
                    f("DEPT_CREATE", "Thêm phòng ban"),
                    f("DEPT_EDIT", "Sửa phòng ban"),
                    f("DEPT_DELETE", "Xóa phòng ban"),
                    f("FEATURE_VIEW", "Xem danh sách chức năng"),
                    f("FEATURE_CREATE", "Thêm chức năng"),
                    f("FEATURE_EDIT", "Sửa chức năng"),
                    f("FEATURE_DELETE", "Xóa chức năng"));
            featureRepository.saveAll(feats);

            // ========== DEPARTMENTS ==========
            Department pbIt = new Department();
            pbIt.setCode("PB001");
            pbIt.setName("Phòng Công nghệ thông tin");
            pbIt.setActive(true);
            departmentRepository.save(pbIt);

            Department pbHr = new Department();
            pbHr.setCode("PB002");
            pbHr.setName("Phòng Nhân sự");
            pbHr.setActive(true);
            departmentRepository.save(pbHr);

            Department pbKd = new Department();
            pbKd.setCode("PB003");
            pbKd.setName("Phòng Kinh doanh");
            pbKd.setActive(true);
            departmentRepository.save(pbKd);

            Department pbKt = new Department();
            pbKt.setCode("PB004");
            pbKt.setName("Phòng Kế toán");
            pbKt.setActive(true);
            departmentRepository.save(pbKt);

            // ========== USERS ==========
            
            // 1. Admin
            UserAccount admin = createUser(
                "admin", "admin123", "Nguyễn Văn Admin", "NV0001",
                Role.ADMIN, null, "Nam", "1985-05-15",
                "123 Đường Láng, Đống Đa, Hà Nội", "Việt Nam", "001085012345",
                new HashSet<>(feats), passwordEncoder
            );
            userAccountRepository.save(admin);

            // 2-5. Managers (4 managers cho 4 phòng ban)
            UserAccount mgrIt = createUser(
                "manager_it", "manager123", "Trần Thị Hương", "NV0002",
                Role.MANAGER, pbIt, "Nữ", "1988-03-20",
                "45 Phố Huế, Hai Bà Trưng, Hà Nội", "Việt Nam", "001088034567",
                new HashSet<>(List.of(
                    featureRepository.findByCode("EMP_EDIT_DEPT").orElseThrow(),
                    featureRepository.findByCode("EMP_VIEW_DEPT").orElseThrow(),
                    featureRepository.findByCode("REQ_APPROVE_DEPT").orElseThrow()
                )), passwordEncoder
            );
            userAccountRepository.save(mgrIt);

            UserAccount mgrHr = createUser(
                "manager_hr", "manager123", "Lê Văn Minh", "NV0003",
                Role.MANAGER, pbHr, "Nam", "1987-07-10",
                "78 Giải Phóng, Hoàng Mai, Hà Nội", "Việt Nam", "001087078901",
                new HashSet<>(List.of(
                    featureRepository.findByCode("EMP_EDIT_DEPT").orElseThrow(),
                    featureRepository.findByCode("EMP_VIEW_DEPT").orElseThrow(),
                    featureRepository.findByCode("REQ_APPROVE_DEPT").orElseThrow()
                )), passwordEncoder
            );
            userAccountRepository.save(mgrHr);

            UserAccount mgrKd = createUser(
                "manager_kd", "manager123", "Phạm Thị Lan", "NV0004",
                Role.MANAGER, pbKd, "Nữ", "1990-11-25",
                "12 Trần Duy Hưng, Cầu Giấy, Hà Nội", "Việt Nam", "001090112345",
                new HashSet<>(List.of(
                    featureRepository.findByCode("EMP_EDIT_DEPT").orElseThrow(),
                    featureRepository.findByCode("EMP_VIEW_DEPT").orElseThrow(),
                    featureRepository.findByCode("REQ_APPROVE_DEPT").orElseThrow()
                )), passwordEncoder
            );
            userAccountRepository.save(mgrKd);

            UserAccount mgrKt = createUser(
                "manager_kt", "manager123", "Hoàng Văn Tuấn", "NV0005",
                Role.MANAGER, pbKt, "Nam", "1986-09-05",
                "56 Nguyễn Trãi, Thanh Xuân, Hà Nội", "Việt Nam", "001086098765",
                new HashSet<>(List.of(
                    featureRepository.findByCode("EMP_EDIT_DEPT").orElseThrow(),
                    featureRepository.findByCode("EMP_VIEW_DEPT").orElseThrow(),
                    featureRepository.findByCode("REQ_APPROVE_DEPT").orElseThrow()
                )), passwordEncoder
            );
            userAccountRepository.save(mgrKt);

            // 6-20. Employees (15 nhân viên phân bổ vào 4 phòng ban)
            String[] firstNames = {"Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Vũ", "Đặng", "Bùi", "Đỗ", "Ngô"};
            String[] middleNames = {"Văn", "Thị", "Đức", "Minh", "Hồng", "Thanh", "Quốc", "Anh"};
            String[] lastNames = {"An", "Bình", "Chi", "Dũng", "Hà", "Khoa", "Linh", "Nam", "Phương", "Quân", "Trang", "Vân", "Yến"};
            String[] streets = {"Láng Hạ", "Xã Đàn", "Tây Sơn", "Thái Hà", "Chùa Bộc", "Khâm Thiên", "Nguyễn Lương Bằng", "Kim Mã", "Liễu Giai", "Đê La Thành"};
            String[] districts = {"Đống Đa", "Ba Đình", "Hoàn Kiếm", "Hai Bà Trưng", "Cầu Giấy", "Thanh Xuân"};
            String[] genders = {"Nam", "Nữ"};
            
            Department[] departments = {pbIt, pbHr, pbKd, pbKt};
            
            for (int i = 6; i <= 20; i++) {
                String firstName = firstNames[random.nextInt(firstNames.length)];
                String middleName = middleNames[random.nextInt(middleNames.length)];
                String lastName = lastNames[random.nextInt(lastNames.length)];
                String fullName = firstName + " " + middleName + " " + lastName;
                String username = "nv" + String.format("%04d", i);
                String empCode = "NV" + String.format("%04d", i);
                String gender = genders[random.nextInt(genders.length)];
                int birthYear = 1990 + random.nextInt(10); // 1990-1999
                int birthMonth = 1 + random.nextInt(12);
                int birthDay = 1 + random.nextInt(28);
                String dob = String.format("%d-%02d-%02d", birthYear, birthMonth, birthDay);
                String street = streets[random.nextInt(streets.length)];
                String district = districts[random.nextInt(districts.length)];
                String address = (10 + random.nextInt(190)) + " " + street + ", " + district + ", Hà Nội";
                String cccd = String.format("001%02d%02d%06d", birthYear % 100, birthMonth, 100000 + random.nextInt(900000));
                
                Department dept = departments[random.nextInt(departments.length)];
                
                // Random features cho employee
                HashSet<Feature> empFeatures = new HashSet<>();
                if (random.nextBoolean()) {
                    empFeatures.add(featureRepository.findByCode("EMP_VIEW_DEPT").orElseThrow());
                }
                
                UserAccount emp = createUser(
                    username, "123456", fullName, empCode,
                    Role.EMPLOYEE, dept, gender, dob,
                    address, "Việt Nam", cccd,
                    empFeatures, passwordEncoder
                );
                userAccountRepository.save(emp);
            }

            // ========== PERMISSION REQUESTS ==========
            List<UserAccount> allUsers = userAccountRepository.findAll();
            List<UserAccount> employees = allUsers.stream()
                .filter(u -> u.getRole() == Role.EMPLOYEE)
                .toList();
            List<UserAccount> managers = allUsers.stream()
                .filter(u -> u.getRole() == Role.MANAGER)
                .toList();

            String[] requestTitles = {
                "Xin cấp quyền xem danh sách nhân viên",
                "Yêu cầu quyền sửa thông tin nhân viên",
                "Xin quyền duyệt đơn yêu cầu",
                "Yêu cầu quyền xem phòng ban",
                "Xin cấp quyền xuất Excel",
                "Yêu cầu quyền tạo nhân viên mới",
                "Xin quyền xem toàn bộ nhân viên",
                "Yêu cầu quyền quản lý chức năng"
            };

            String[] requestDescriptions = {
                "Cần hỗ trợ công việc điều phối nhân sự",
                "Để cập nhật thông tin nhân viên trong phòng",
                "Hỗ trợ quản lý duyệt đơn khi vắng mặt",
                "Cần xem thông tin các phòng ban để báo cáo",
                "Xuất báo cáo định kỳ hàng tháng",
                "Hỗ trợ tuyển dụng và onboarding",
                "Làm báo cáo tổng hợp toàn công ty",
                "Quản lý và cấu hình hệ thống"
            };

            RequestStatus[] statuses = {RequestStatus.DRAFT, RequestStatus.PENDING, RequestStatus.APPROVED, RequestStatus.REJECTED};

            for (int i = 1; i <= 20; i++) {
                UserAccount requester = employees.get(random.nextInt(employees.size()));
                UserAccount targetUser = employees.get(random.nextInt(employees.size()));
                RequestStatus status = statuses[random.nextInt(statuses.length)];
                
                PermissionRequest req = new PermissionRequest();
                req.setCode("REQ-" + String.format("%05d", i));
                req.setTitle(requestTitles[random.nextInt(requestTitles.length)]);
                req.setDescription(requestDescriptions[random.nextInt(requestDescriptions.length)]);
                req.setStatus(status);
                req.setRequester(requester);
                req.setTargetUser(targetUser);
                
                // Random 1-3 features
                HashSet<Feature> requestedFeatures = new HashSet<>();
                int numFeatures = 1 + random.nextInt(3);
                for (int j = 0; j < numFeatures; j++) {
                    Feature feat = feats.get(random.nextInt(feats.size()));
                    requestedFeatures.add(feat);
                }
                req.setRequestedFeatures(requestedFeatures);
                
                // Nếu đã duyệt hoặc từ chối thì có reviewer
                if (status == RequestStatus.APPROVED || status == RequestStatus.REJECTED) {
                    UserAccount reviewer = managers.get(random.nextInt(managers.size()));
                    req.setReviewer(reviewer);
                    req.setReviewedAt(LocalDateTime.now().minusDays(random.nextInt(30)));
                    
                    if (status == RequestStatus.REJECTED) {
                        String[] rejectReasons = {
                            "Không đủ điều kiện",
                            "Chưa cần thiết cho công việc hiện tại",
                            "Cần bổ sung thêm thông tin",
                            "Đã có người khác đảm nhiệm"
                        };
                        req.setRejectReason(rejectReasons[random.nextInt(rejectReasons.length)]);
                    }
                }
                
                permissionRequestRepository.save(req);
            }
        };
    }

    private static Feature f(String code, String name) {
        Feature x = new Feature();
        x.setCode(code);
        x.setName(name);
        return x;
    }

    private static UserAccount createUser(
            String username, String password, String fullName, String empCode,
            Role role, Department dept, String gender, String dob,
            String address, String nationality, String citizenId,
            HashSet<Feature> features, PasswordEncoder passwordEncoder) {
        UserAccount u = new UserAccount();
        u.setUsername(username);
        u.setPasswordHash(passwordEncoder.encode(password));
        u.setFullName(fullName);
        u.setEmployeeCode(empCode);
        u.setRole(role);
        u.setDepartment(dept);
        u.setGender(gender);
        u.setDateOfBirth(LocalDate.parse(dob));
        u.setAddress(address);
        u.setNationality(nationality);
        u.setCitizenId(citizenId);
        u.setFeatures(features);
        return u;
    }
}
