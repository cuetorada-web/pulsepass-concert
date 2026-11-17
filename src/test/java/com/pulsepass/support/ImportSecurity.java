package com.pulsepass.support;

import com.pulsepass.security.JwtService;
import com.pulsepass.security.RestAccessDeniedHandler;
import com.pulsepass.security.RestAuthenticationEntryPoint;
import com.pulsepass.security.SecurityConfig;
import org.springframework.context.annotation.Import;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Carga la seguridad REAL (filtro JWT, reglas de URL, 401/403 en JSON) dentro de un @WebMvcTest.
 * No se desactivan filtros: el objetivo es justamente probarlos.
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Import({
        SecurityConfig.class,
        RestAccessDeniedHandler.class,
        RestAuthenticationEntryPoint.class,
        JwtService.class
})
public @interface ImportSecurity {
}