package com.pulsepass.controller;

import com.pulsepass.service.EventService;
import com.pulsepass.service.TicketService;
import com.pulsepass.support.AbstractSecuredMvcTest;
import com.pulsepass.support.ImportSecurity;
import org.junit.jupiter.api.Test;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = {TicketController.class, EventController.class, AuthController.class})
@ImportSecurity
@TestPropertySource(properties = "pulsepass.security.cors.allowed-origins=http://localhost:5173")
class CorsAllowedOriginTest extends AbstractSecuredMvcTest {

    private static final String ORIGIN = "http://localhost:5173";

    @MockitoBean private TicketService ticketService;
    @MockitoBean private EventService eventService;
    @MockitoBean private com.pulsepass.service.AuthService authService;

    // El navegador pregunta (preflight) SIN token: debe responderse antes de exigir autenticación
    @Test
    void preflightFromAnAllowedOriginIsAnsweredWithoutAToken() throws Exception {
        mockMvc.perform(options("/api/tickets")
                        .header("Origin", ORIGIN)
                        .header("Access-Control-Request-Method", "POST")
                        .header("Access-Control-Request-Headers", "authorization,content-type"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", ORIGIN))
                .andExpect(header().string("Access-Control-Allow-Methods", containsString("POST")))
                .andExpect(header().doesNotExist("Access-Control-Allow-Credentials"));
    }

    @Test
    void preflightFromAnotherOriginIsRejected() throws Exception {
        mockMvc.perform(options("/api/tickets")
                        .header("Origin", "http://evil.example")
                        .header("Access-Control-Request-Method", "POST"))
                .andExpect(status().isForbidden())
                .andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
    }

    // El front necesita leer X-Request-Id para reportar errores
    @Test
    void responsesExposeTheRequestIdToTheBrowser() throws Exception {
        mockMvc.perform(get("/api/events/published").header("Origin", ORIGIN))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", ORIGIN))
                .andExpect(header().string("Access-Control-Expose-Headers", "X-Request-Id"));
    }

    // Un 401 también debe llevar las cabeceras CORS; si no, el navegador oculta el error al front
    @Test
    void a401FromAnAllowedOriginStillCarriesTheCorsHeaders() throws Exception {
        mockMvc.perform(get("/api/auth/me").header("Origin", ORIGIN))
                .andExpect(status().isUnauthorized())
                .andExpect(header().string("Access-Control-Allow-Origin", ORIGIN));
    }
}