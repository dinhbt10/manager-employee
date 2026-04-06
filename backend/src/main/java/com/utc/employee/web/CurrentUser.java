package com.utc.employee.web;

import com.utc.employee.security.AuthUser;
import com.utc.employee.security.CustomUserDetailsService;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class CurrentUser {

    private final CustomUserDetailsService userDetailsService;

    public CurrentUser(CustomUserDetailsService userDetailsService) {
        this.userDetailsService = userDetailsService;
    }

    public AuthUser get() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null
                || !auth.isAuthenticated()
                || auth instanceof AnonymousAuthenticationToken
                || "anonymousUser".equals(auth.getPrincipal())) {
            throw new UnauthorizedException();
        }
        return userDetailsService.loadAuthUser(auth.getName());
    }
}
