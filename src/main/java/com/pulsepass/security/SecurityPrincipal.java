package com.pulsepass.security;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;

public class SecurityPrincipal implements UserDetails {

    private final Long id;
    private final String username;
    private final String email;
    private final String passwordHash; // null cuando se reconstruye desde un JWT
    private final boolean enabled;
    private final Collection<? extends GrantedAuthority> authorities;

    public SecurityPrincipal(Long id,
                             String username,
                             String email,
                             String passwordHash,
                             boolean enabled,
                             Collection<? extends GrantedAuthority> authorities) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.passwordHash = passwordHash;
        this.enabled = enabled;
        this.authorities = authorities;
    }

    public Long getId() { return id; }
    public String getEmail() { return email; }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() { return authorities; }

    @Override
    public String getPassword() { return passwordHash; }

    @Override
    public String getUsername() { return username; }

    // isAccountNonExpired / isAccountNonLocked / isCredentialsNonExpired
    // ya son "true" por defecto en la interfaz UserDetails.

    @Override
    public boolean isEnabled() { return enabled; }
}