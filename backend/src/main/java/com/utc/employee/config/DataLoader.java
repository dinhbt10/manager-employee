package com.utc.employee.config;

import com.utc.employee.domain.*;
import com.utc.employee.repo.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.HashSet;
import java.util.List;

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

            Department pbIt = new Department();
            pbIt.setCode("PB001");
            pbIt.setName("Phòng Công nghệ thông tin");
            pbIt.setActive(true);
            departmentRepository.save(pbIt);

            Department pbHc = new Department();
            pbHc.setCode("PB002");
            pbHc.setName("Phòng Nhân sự");
            pbHc.setActive(true);
            departmentRepository.save(pbHc);

            UserAccount admin = new UserAccount();
            admin.setUsername("admin");
            admin.setPasswordHash(passwordEncoder.encode("admin123"));
            admin.setFullName("Quản trị viên");
            admin.setEmployeeCode("NV0001");
            admin.setRole(Role.ADMIN);
            admin.setDepartment(null);
            admin.setFeatures(new HashSet<>(feats));
            userAccountRepository.save(admin);

            UserAccount manager = new UserAccount();
            manager.setUsername("manager");
            manager.setPasswordHash(passwordEncoder.encode("manager123"));
            manager.setFullName("Trưởng phòng IT");
            manager.setEmployeeCode("NV0002");
            manager.setRole(Role.MANAGER);
            manager.setDepartment(pbIt);
            manager.setFeatures(new HashSet<>(List.of(
                    featureRepository.findByCode("EMP_EDIT_DEPT").orElseThrow(),
                    featureRepository.findByCode("EMP_VIEW_DEPT").orElseThrow(),
                    featureRepository.findByCode("REQ_APPROVE_DEPT").orElseThrow(),
                    featureRepository.findByCode("DEPT_VIEW").orElseThrow())));
            userAccountRepository.save(manager);

            UserAccount emp = new UserAccount();
            emp.setUsername("nhanvien");
            emp.setPasswordHash(passwordEncoder.encode("nv123456"));
            emp.setFullName("Nguyễn Văn A");
            emp.setEmployeeCode("NV0003");
            emp.setRole(Role.EMPLOYEE);
            emp.setDepartment(pbIt);
            emp.setFeatures(new HashSet<>(List.of(
                    featureRepository.findByCode("EMP_VIEW_DEPT").orElseThrow())));
            userAccountRepository.save(emp);

            PermissionRequest req = new PermissionRequest();
            req.setCode("REQ-00001");
            req.setTitle("Xin cấp quyền xem danh sách NV phòng");
            req.setDescription("Cần hỗ trợ công việc điều phối");
            req.setStatus(RequestStatus.DRAFT);
            req.setRequester(emp);
            req.setTargetUser(emp);
            req.setRequestedFeatures(new HashSet<>(List.of(
                    featureRepository.findByCode("EMP_VIEW_DEPT").orElseThrow())));
            permissionRequestRepository.save(req);
        };
    }

    private static Feature f(String code, String name) {
        Feature x = new Feature();
        x.setCode(code);
        x.setName(name);
        return x;
    }
}
