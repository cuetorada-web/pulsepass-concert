package com.pulsepass.service;

import com.pulsepass.dto.request.RegisterUserRequest;
import com.pulsepass.dto.response.UserResponse;
import org.springframework.security.access.prepost.PreAuthorize;

public interface UserService {

    // Público (FR-SECUSR-01): el rol inicial lo asigna AuthService, siempre USER
    UserResponse register(RegisterUserRequest request);

    // FR-SECUSR-02: el propio usuario, o ADMIN
    @PreAuthorize("hasRole('ADMIN') or @authz.isCurrentUserEmail(#email)")
    UserResponse findByEmail(String email);

    // FR-SECUSR-03
    @PreAuthorize("hasRole('ADMIN') or @authz.isCurrentUsername(#username)")
    UserResponse findByUsername(String username);
}