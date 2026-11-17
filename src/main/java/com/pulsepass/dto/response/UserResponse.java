package com.pulsepass.dto.response;

public record UserResponse(
        Long id,
        String username,
        String email,
        Boolean active,
        String firstName,
        String lastName
) {
}