package com.utc.employee.service;

import com.utc.employee.domain.Feature;
import com.utc.employee.domain.UserAccount;
import com.utc.employee.repo.UserAccountRepository;
import com.utc.employee.security.JwtService;
import com.utc.employee.web.dto.LoginRequest;
import com.utc.employee.web.dto.LoginResponse;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.stream.Collectors;

@Service
public class AuthService {

        private final AuthenticationManager authenticationManager;
        private final JwtService jwtService;
        private final UserAccountRepository userAccountRepository;

        public AuthService(
                        AuthenticationManager authenticationManager,
                        JwtService jwtService,
                        UserAccountRepository userAccountRepository) {
                this.authenticationManager = authenticationManager;
                this.jwtService = jwtService;
                this.userAccountRepository = userAccountRepository;
        }

        @Transactional(readOnly = true)
        public LoginResponse login(LoginRequest req) {
                Authentication auth = authenticationManager.authenticate(
                                new UsernamePasswordAuthenticationToken(req.username(), req.password()));
                if (!auth.isAuthenticated()) {
                        throw new IllegalStateException();
                }
                UserAccount u = userAccountRepository.findByUsername(req.username())
                                .orElseThrow();
                u.getFeatures().size();
                String token = jwtService.createToken(req.username());
                String deptName = u.getDepartment() != null ? u.getDepartment().getName() : null;
                var features = u.getFeatures().stream()
                                .filter(Feature::isActive)
                                .map(Feature::getCode)
                                .collect(Collectors.toSet());
                return new LoginResponse(
                                token,
                                u.getId(),
                                u.getUsername(),
                                u.getFullName(),
                                u.getRole().name(),
                                u.getDepartment() != null ? u.getDepartment().getId() : null,
                                deptName,
                                features);
        }

        @Transactional(readOnly = true)
        public LoginResponse me(String username) {
                UserAccount u = userAccountRepository.findByUsername(username)
                                .orElseThrow();
                u.getFeatures().size();
                String deptName = u.getDepartment() != null ? u.getDepartment().getName() : null;
                var features = u.getFeatures().stream()
                                .filter(Feature::isActive)
                                .map(Feature::getCode)
                                .collect(Collectors.toSet());
                return new LoginResponse(
                                null, // token not needed for /me
                                u.getId(),
                                u.getUsername(),
                                u.getFullName(),
                                u.getRole().name(),
                                u.getDepartment() != null ? u.getDepartment().getId() : null,
                                deptName,
                                features);
        }
}
