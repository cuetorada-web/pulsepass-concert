package com.pulsepass.service;

import com.pulsepass.domain.User;
import com.pulsepass.dto.request.RegisterUserRequest;
import com.pulsepass.dto.response.UserResponse;
import com.pulsepass.exception.BusinessRuleException;
import com.pulsepass.exception.DuplicateResourceException;
import com.pulsepass.mapper.UserMapper;
import com.pulsepass.repository.UserRepository;
import com.pulsepass.service.impl.UserServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

    @Mock private UserRepository userRepository;
    @Mock private UserMapper mapper;

    @InjectMocks private UserServiceImpl service;

    private RegisterUserRequest request(LocalDate birthDate) {
        return new RegisterUserRequest("andrea", "andrea@email.com", "Andrea", "Lopez",
                "3000000000", "Santa Marta", birthDate);
    }

    // ---------- TEST-USER-001 ----------
    @Test
    void shouldRegisterValidUser() {
        // ARRANGE
        UserResponse response = new UserResponse(1L, "andrea", "andrea@email.com", true, "Andrea", "Lopez");
        when(userRepository.existsByUsername("andrea")).thenReturn(false);
        when(userRepository.existsByEmailIgnoreCase("andrea@email.com")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));
        when(mapper.toResponse(any(User.class))).thenReturn(response);

        // ACT
        UserResponse result = service.register(request(LocalDate.now().minusYears(25)));

        // ASSERT
        assertThat(result).isEqualTo(response);

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        assertThat(captor.getValue().getActive()).isTrue();
        assertThat(captor.getValue().getProfile()).isNotNull();
    }

    // ---------- TEST-USER-002 ----------
    @Test
    void shouldFailWhenUsernameAlreadyExists() {
        // ARRANGE
        when(userRepository.existsByUsername("andrea")).thenReturn(true);

        // ACT + ASSERT
        assertThatThrownBy(() -> service.register(request(LocalDate.now().minusYears(25))))
                .isInstanceOf(DuplicateResourceException.class);

        verify(userRepository, never()).save(any());
    }

    // ---------- TEST-USER-003 ----------
    @Test
    void shouldFailWhenEmailAlreadyExists() {
        // ARRANGE
        when(userRepository.existsByUsername("andrea")).thenReturn(false);
        when(userRepository.existsByEmailIgnoreCase("andrea@email.com")).thenReturn(true);

        // ACT + ASSERT
        assertThatThrownBy(() -> service.register(request(LocalDate.now().minusYears(25))))
                .isInstanceOf(DuplicateResourceException.class);

        verify(userRepository, never()).save(any());
    }

    // ---------- TEST-USER-004 ----------
    @Test
    void shouldFailWhenBirthDateIsInTheFuture() {
        // ACT + ASSERT
        assertThatThrownBy(() -> service.register(request(LocalDate.now().plusDays(1))))
                .isInstanceOf(BusinessRuleException.class);

        verify(userRepository, never()).save(any());
    }
}