package com.utc.employee.security;

import com.utc.employee.domain.Feature;
import com.utc.employee.domain.Role;
import com.utc.employee.domain.UserAccount;
import com.utc.employee.repo.UserAccountRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserAccountRepository userAccountRepository;

    public CustomUserDetailsService(UserAccountRepository userAccountRepository) {
        this.userAccountRepository = userAccountRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        UserAccount u = userAccountRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException(username));
        u.getFeatures().size(); // init lazy
        Set<SimpleGrantedAuthority> authorities = new HashSet<>();
        authorities.add(new SimpleGrantedAuthority("ROLE_" + u.getRole().name()));
        for (Feature f : u.getFeatures()) {
            if (f.isActive()) {
                authorities.add(new SimpleGrantedAuthority("FEAT_" + f.getCode()));
            }
        }
        return new User(u.getUsername(), u.getPasswordHash(), authorities);
    }

    @Transactional(readOnly = true)
    public AuthUser loadAuthUser(String username) {
        UserAccount u = userAccountRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException(username));
        u.getFeatures().size();
        Long deptId = u.getDepartment() != null ? u.getDepartment().getId() : null;
        Set<String> codes = u.getFeatures().stream()
                .filter(Feature::isActive)
                .map(Feature::getCode)
                .collect(Collectors.toSet());
        return new AuthUser(u.getId(), u.getUsername(), u.getRole(), deptId, codes);
    }
}
