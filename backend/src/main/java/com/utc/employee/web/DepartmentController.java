package com.utc.employee.web;

import com.utc.employee.service.DepartmentService;
import com.utc.employee.web.dto.CreateDepartmentRequest;
import com.utc.employee.web.dto.DepartmentDto;
import com.utc.employee.web.dto.UpdateDepartmentRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/departments")
public class DepartmentController {

    private final DepartmentService departmentService;
    private final CurrentUser currentUser;

    public DepartmentController(DepartmentService departmentService, CurrentUser currentUser) {
        this.departmentService = departmentService;
        this.currentUser = currentUser;
    }

    @GetMapping
    public List<DepartmentDto> list() {
        return departmentService.list(currentUser.get());
    }

    @PostMapping
    public DepartmentDto create(@Valid @RequestBody CreateDepartmentRequest req) {
        return departmentService.create(currentUser.get(), req);
    }

    @PatchMapping("/{id}")
    public DepartmentDto update(@PathVariable Long id, @RequestBody UpdateDepartmentRequest req) {
        return departmentService.update(currentUser.get(), id, req);
    }
}
