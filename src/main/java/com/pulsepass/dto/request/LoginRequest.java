package com.pulsepass.dto.request;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(

        @NotBlank(message = "Identifier is required")
        String identifier,   // username o email

        @NotBlank(message = "Password is required")
        String password
) {

    @Override
    public String toString() {
        return "LoginRequest[identifier=" + identifier + ", password=***]";
    }
}