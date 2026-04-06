package com.utc.employee.web;

import com.utc.employee.service.UserService;
import com.utc.employee.web.dto.CreateUserRequest;
import com.utc.employee.web.dto.UpdateUserRequest;
import com.utc.employee.web.dto.UserDto;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final CurrentUser currentUser;

    public UserController(UserService userService, CurrentUser currentUser) {
        this.userService = userService;
        this.currentUser = currentUser;
    }

    @GetMapping
    public List<UserDto> list(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) Long departmentId
    ) {
        return userService.list(currentUser.get(), q, role, departmentId);
    }

    @GetMapping("/{id}")
    public UserDto get(@PathVariable Long id) {
        return userService.get(currentUser.get(), id);
    }

    @PostMapping
    public UserDto create(@Valid @RequestBody CreateUserRequest req) {
        return userService.create(currentUser.get(), req);
    }

    @PatchMapping("/{id}")
    public UserDto update(@PathVariable Long id, @RequestBody UpdateUserRequest req) {
        return userService.update(currentUser.get(), id, req);
    }
}
