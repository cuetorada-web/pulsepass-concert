package com.pulsepass.mapper;

import com.pulsepass.domain.User;
import com.pulsepass.dto.response.UserResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface UserMapper {

    @Mapping(target = "firstName", source = "profile.firstName")
    @Mapping(target = "lastName", source = "profile.lastName")
    UserResponse toResponse(User user);
}