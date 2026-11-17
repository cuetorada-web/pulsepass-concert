package com.pulsepass.security;

import com.pulsepass.domain.Role;
import com.pulsepass.domain.User;
import com.pulsepass.domain.UserCredential;
import com.pulsepass.repository.UserCredentialRepository;
import com.pulsepass.repository.UserRepository;
import com.pulsepass.repository.UserRoleRepository;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;
    private final UserCredentialRepository credentialRepository;
    private final UserRoleRepository roleRepository;

    public CustomUserDetailsService(UserRepository userRepository,
                                    UserCredentialRepository credentialRepository,
                                    UserRoleRepository roleRepository) {
        this.userRepository = userRepository;
        this.credentialRepository = credentialRepository;
        this.roleRepository = roleRepository;
    }

    /** LOGIN: el identificador puede ser username o email. */
    @Override
    public UserDetails loadUserByUsername(String identifier) throws UsernameNotFoundException {

        User user = (identifier.contains("@")
                ? userRepository.findByEmailIgnoreCase(identifier)
                : userRepository.findByUsername(identifier))
                .orElseThrow(() -> new UsernameNotFoundException("Invalid credentials"));

        // Usuario legado sin credencial: no puede iniciar sesión (mismo mensaje genérico)
        UserCredential credential = credentialRepository.findById(user.getId())
                .orElseThrow(() -> new UsernameNotFoundException("Invalid credentials"));

        return toPrincipal(user, credential.getPasswordHash());
    }

    /** FILTRO JWT: el "sub" del token es el ID persistente. Revalida estado y roles. */
    public SecurityPrincipal loadUserById(Long id) throws UsernameNotFoundException {

        User user = userRepository.findById(id)
                .orElseThrow(() -> new UsernameNotFoundException("Invalid token subject"));

        return toPrincipal(user, null);
    }

    private SecurityPrincipal toPrincipal(User user, String passwordHash) {

        List<GrantedAuthority> authorities = roleRepository.findRolesByUserId(user.getId())
                .stream()
                .map(Role::name)
                .map(role -> (GrantedAuthority) new SimpleGrantedAuthority("ROLE_" + role))
                .toList();

        return new SecurityPrincipal(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                passwordHash,
                Boolean.TRUE.equals(user.getActive()),
                authorities
        );
    }
}