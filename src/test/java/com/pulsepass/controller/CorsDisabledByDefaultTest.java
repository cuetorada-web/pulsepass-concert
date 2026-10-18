package com.pulsepass.controller;

import com.pulsepass.service.EventService;
import com.pulsepass.support.AbstractSecuredMvcTest;
import com.pulsepass.support.ImportSecurity;
import org.junit.jupiter.api.Test;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(EventController.class)
@ImportSecurity
@TestPropertySource(properties = "pulsepass.security.cors.allowed-origins=")
class CorsDisabledByDefaultTest extends AbstractSecuredMvcTest {

    @MockitoBean private EventService eventService;

    // Sin orígenes configurados, ningún sitio web puede llamar a la API desde un navegador
    @Test
    void anyBrowserOriginIsRejectedWhenNoneIsConfigured() throws Exception {
        mockMvc.perform(options("/api/events/published")
                        .header("Origin", "http://localhost:5173")
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isForbidden())
                .andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
    }

    // Postman, curl y otros servicios no envían Origin: siguen funcionando
    @Test
    void clientsWithoutAnOriginAreNotAffected() throws Exception {
        mockMvc.perform(get("/api/events/published"))
                .andExpect(status().isOk());
    }
}