package com.pulsepass.controller;

import com.pulsepass.dto.request.RegisterUserRequest;
import com.pulsepass.dto.response.UserResponse;
import com.pulsepass.exception.DuplicateResourceException;
import com.pulsepass.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(UserController.class)
class UserControllerTest {

    @Autowired private MockMvc mockMvc;

    @MockitoBean private UserService userService;

    private static final String VALID_USER_JSON = """
            {
              "username": "andrea",
              "email": "andrea@email.com",
              "firstName": "Andrea",
              "lastName": "Lopez",
              "phone": "3000000000",
              "city": "Santa Marta",
              "birthDate": "2000-05-10"
            }
            """;

    private static final String INVALID_EMAIL_JSON = """
            {
              "username": "andrea",
              "email": "esto-no-es-un-email",
              "firstName": "Andrea",
              "lastName": "Lopez",
              "birthDate": "2000-05-10"
            }
            """;

    private UserResponse user() {
        return new UserResponse(1L, "andrea", "andrea@email.com", true, "Andrea", "Lopez");
    }

    // TEST-CTRL-USR-001
    @Test
    void shouldReturn201WhenUserIsRegistered() throws Exception {
        when(userService.register(any(RegisterUserRequest.class))).thenReturn(user());

        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_USER_JSON))
                .andExpect(status().isCreated())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.username").value("andrea"))
                .andExpect(jsonPath("$.email").value("andrea@email.com"));

        verify(userService).register(any(RegisterUserRequest.class));
    }

    // TEST-CTRL-USR-002
    @Test
    void shouldReturn400WhenEmailIsInvalid() throws Exception {
        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(INVALID_EMAIL_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.details.email").value("Email must be valid"));

        verify(userService, never()).register(any());
    }

    // TEST-CTRL-USR-003
    @Test
    void shouldReturn409WhenUsernameAlreadyExists() throws Exception {
        when(userService.register(any(RegisterUserRequest.class)))
                .thenThrow(new DuplicateResourceException("Username already exists: andrea"));

        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_USER_JSON))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message").value("Username already exists: andrea"));
    }

    // TEST-CTRL-USR-004
    @Test
    void shouldReturn200WhenSearchingByEmail() throws Exception {
        when(userService.findByEmail("andrea@email.com")).thenReturn(user());

        mockMvc.perform(get("/api/users/by-email").param("email", "andrea@email.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("andrea@email.com"));

        verify(userService).findByEmail("andrea@email.com");
    }

    // TEST-CTRL-USR-005
    @Test
    void shouldReturn200WhenSearchingByUsername() throws Exception {
        when(userService.findByUsername("andrea")).thenReturn(user());

        mockMvc.perform(get("/api/users/by-username").param("username", "andrea"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("andrea"));

        verify(userService).findByUsername("andrea");
    }
}