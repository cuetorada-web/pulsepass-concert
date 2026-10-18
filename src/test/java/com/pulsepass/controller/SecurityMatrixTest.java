package com.pulsepass.controller;

import com.pulsepass.domain.EventCategory;
import com.pulsepass.domain.EventStatus;
import com.pulsepass.domain.TicketStatus;
import com.pulsepass.domain.TicketType;
import com.pulsepass.dto.request.CreateEventRequest;
import com.pulsepass.dto.request.LoginRequest;
import com.pulsepass.dto.response.AuthResponse;
import com.pulsepass.dto.response.EventResponse;
import com.pulsepass.dto.response.TicketResponse;
import com.pulsepass.security.JwtProperties;
import com.pulsepass.security.JwtService;
import com.pulsepass.service.ArtistService;
import com.pulsepass.service.AuthService;
import com.pulsepass.service.EventService;
import com.pulsepass.service.TicketService;
import com.pulsepass.service.VenueService;
import com.pulsepass.support.AbstractSecuredMvcTest;
import com.pulsepass.support.ImportSecurity;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.ResultActions;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpMethod;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.request;

import static org.assertj.core.api.Assertions.assertThat;

@WebMvcTest(controllers = {
        EventController.class,
        TicketController.class,
        AuthController.class,
        VenueController.class,
        ArtistController.class
})
@ImportSecurity
class SecurityMatrixTest extends AbstractSecuredMvcTest {

    @MockitoBean private EventService eventService;
    @MockitoBean private TicketService ticketService;
    @MockitoBean private AuthService authService;
    @MockitoBean private VenueService venueService;
    @MockitoBean private ArtistService artistService;

    @Autowired private JwtProperties jwtProperties;

    private static final String VALID_EVENT_JSON = """
            {
              "eventCode": "CMF-2026",
              "name": "Caribbean Music Fest 2026",
              "description": "Festival de musica",
              "category": "MUSIC",
              "eventDate": "2030-12-20T20:00:00",
              "minimumAge": 18,
              "venueCode": "VEN-SMR-01"
            }
            """;

    private static final String INVALID_EVENT_JSON = """
            {
              "eventCode": "",
              "name": "Caribbean Music Fest 2026",
              "category": "MUSIC",
              "eventDate": "2030-12-20T20:00:00",
              "minimumAge": 18,
              "venueCode": ""
            }
            """;

    private static final String LOGIN_JSON = """
            { "identifier": "andrea", "password": "UnaFraseSegura2026!" }
            """;

    // ---------- datos de apoyo ----------

    private EventResponse event(EventStatus status) {
        return new EventResponse(1L, "CMF-2026", "Caribbean Music Fest 2026", "Festival de musica",
                EventCategory.MUSIC, status, LocalDateTime.now().plusDays(30), 18,
                "VEN-SMR-01", "Marina Convention Center", List.of());
    }

    private TicketResponse ticket(TicketStatus status) {
        return new TicketResponse(1L, "TKT-1", TicketType.GENERAL, new BigDecimal("50000.00"), status,
                LocalDateTime.now(), "andrea@email.com", "CMF-2026", "Caribbean Music Fest 2026");
    }

    /** Token firmado con la MISMA clave pero ya vencido. */
    private String expiredBearer() {
        JwtService shortLived = new JwtService(new JwtProperties(
                jwtProperties.issuer(), jwtProperties.secretBase64(), Duration.ofSeconds(-30)));
        return "Bearer " + shortLived.generateToken(principal(1L, true, "USER"));
    }

    /** Token válido con un carácter de la firma alterado. */
    private String tamperedBearer() {
        String token = bearer(1L, "USER").substring("Bearer ".length());
        String[] parts = token.split("\\.");
        char first = parts[2].charAt(0);
        String badSignature = (first == 'A' ? "B" : "A") + parts[2].substring(1);
        return "Bearer " + parts[0] + "." + parts[1] + "." + badSignature;
    }

    private void assertUniform401(ResultActions result) throws Exception {
        result.andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("Unauthorized"))
                .andExpect(jsonPath("$.timestamp").exists())
                .andExpect(content().string(not(containsString("Exception"))))
                .andExpect(content().string(not(containsString("password"))));
    }
        // FR-SECAUTH-008: la API no crea sesión ni cookies (no existe JSESSIONID)
    @Test
    void noSessionOrCookieIsEverCreated() throws Exception {
        MvcResult authenticated = mockMvc.perform(get("/api/auth/me")
                        .header(HttpHeaders.AUTHORIZATION, bearer(1L, "USER")))
                .andExpect(status().isOk())
                .andReturn();
        MvcResult denied = mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized())
                .andReturn();

        for (MvcResult result : List.of(authenticated, denied)) {
            assertThat(result.getResponse().getCookies()).isEmpty();
            assertThat(result.getResponse().getHeader(HttpHeaders.SET_COOKIE)).isNull();
            assertThat(result.getRequest().getSession(false)).isNull();
        }
    }

    // 17.4: sin token, TODA ruta protegida responde 401 y no ejecuta negocio
    @Test
    void anonymousIsRejectedOnEveryProtectedRoute() throws Exception {
        record Route(String method, String path) { }

        List<Route> protectedRoutes = List.of(
                new Route("POST", "/api/events"),
                new Route("PATCH", "/api/events/CMF-2026/publish"),
                new Route("POST", "/api/events/CMF-2026/artists/1"),
                new Route("GET", "/api/users/by-email?email=andrea@email.com"),
                new Route("GET", "/api/users/by-username?username=andrea"),
                new Route("POST", "/api/tickets"),
                new Route("GET", "/api/tickets/TKT-1"),
                new Route("GET", "/api/tickets/by-user?email=andrea@email.com"),
                new Route("GET", "/api/events/CMF-2026/tickets/paid"),
                new Route("PATCH", "/api/tickets/TKT-1/cancel"),
                new Route("PATCH", "/api/tickets/TKT-1/use"),
                new Route("GET", "/api/auth/me"));

        for (Route route : protectedRoutes) {
            mockMvc.perform(request(HttpMethod.valueOf(route.method()), route.path()))
                    .andExpect(status().isUnauthorized());
        }

        verifyNoInteractions(eventService, ticketService);
    }

    // 17.4: un USER común no entra a las rutas privilegiadas; un STAFF tampoco a las de ADMIN
    @Test
    void privilegedRoutesRejectRolesWithoutPermission() throws Exception {
        record Route(String method, String path) { }

        List<Route> operationalRoutes = List.of(           // STAFF o ADMIN
                new Route("PATCH", "/api/tickets/TKT-1/use"),
                new Route("GET", "/api/events/CMF-2026/tickets/paid"));
        List<Route> adminOnlyRoutes = List.of(             // solo ADMIN
                new Route("POST", "/api/events"),
                new Route("PATCH", "/api/events/CMF-2026/publish"),
                new Route("POST", "/api/events/CMF-2026/artists/1"));

        String user = bearer(1L, "USER");
        String staff = bearer(3L, "USER", "STAFF");

        for (Route route : operationalRoutes) {
            mockMvc.perform(request(HttpMethod.valueOf(route.method()), route.path())
                            .header(HttpHeaders.AUTHORIZATION, user))
                    .andExpect(status().isForbidden());
        }
        for (Route route : adminOnlyRoutes) {
            mockMvc.perform(request(HttpMethod.valueOf(route.method()), route.path())
                            .header(HttpHeaders.AUTHORIZATION, user))
                    .andExpect(status().isForbidden());
            mockMvc.perform(request(HttpMethod.valueOf(route.method()), route.path())
                            .header(HttpHeaders.AUTHORIZATION, staff))
                    .andExpect(status().isForbidden());
        }

        verifyNoInteractions(eventService, ticketService);
    }

    // ---------- rutas públicas ----------

    // T-SEC-001
    @Test
    void anonymousCanListPublishedEvents() throws Exception {
        mockMvc.perform(get("/api/events/published"))
                .andExpect(status().isOk());
    }

    // FR-SECVEN-01/02, FR-SECART-01..03 (DoR: probar GET /api/venues/active de forma explícita)
    @Test
    void publicRoutesDoNotRequireAToken() throws Exception {
        for (String url : List.of(
                "/api/venues/VEN-SMR-01",
                "/api/venues/active",
                "/api/artists/1",
                "/api/artists/active",
                "/api/events/published")) {
            mockMvc.perform(get(url)).andExpect(status().isOk());
        }
        mockMvc.perform(get("/api/artists/by-stage-name").param("stageName", "Solar Beat"))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/events/by-artist").param("stageName", "Solar Beat"))
                .andExpect(status().isOk());
    }

    // Un token basura en una ruta pública no debe romperla
    @Test
    void garbageTokenDoesNotBreakPublicRoutes() throws Exception {
        mockMvc.perform(get("/api/events/published")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer abc.def.ghi"))
                .andExpect(status().isOk());
    }

    // ---------- roles ----------

    // T-SEC-002
    @Test
    void anonymousCannotCreateEvent() throws Exception {
        mockMvc.perform(post("/api/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_EVENT_JSON))
                .andExpect(status().isUnauthorized())
                .andExpect(header().string(HttpHeaders.WWW_AUTHENTICATE, "Bearer"))
                .andExpect(jsonPath("$.status").value(401));

        verifyNoInteractions(eventService);
    }

    // T-SEC-003
    @Test
    void userCannotCreateEvent() throws Exception {
        mockMvc.perform(post("/api/events")
                        .header(HttpHeaders.AUTHORIZATION, bearer(1L, "USER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.error").value("Forbidden"));

        verifyNoInteractions(eventService);
    }

    // T-SEC-004
    @Test
    void adminCanCreateEvent() throws Exception {
        when(eventService.create(any(CreateEventRequest.class))).thenReturn(event(EventStatus.DRAFT));

        mockMvc.perform(post("/api/events")
                        .header(HttpHeaders.AUTHORIZATION, bearer(2L, "USER", "ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_EVENT_JSON))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.eventCode").value("CMF-2026"));
    }

    // T-SEC-014
    @Test
    void adminCanPublishEvent() throws Exception {
        when(eventService.publish("CMF-2026")).thenReturn(event(EventStatus.PUBLISHED));

        mockMvc.perform(patch("/api/events/CMF-2026/publish")
                        .header(HttpHeaders.AUTHORIZATION, bearer(2L, "ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PUBLISHED"));
    }

    // UC-SEC-08
    @Test
    void userCannotPublishEvent() throws Exception {
        mockMvc.perform(patch("/api/events/CMF-2026/publish")
                        .header(HttpHeaders.AUTHORIZATION, bearer(1L, "USER")))
                .andExpect(status().isForbidden());

        verifyNoInteractions(eventService);
    }

    // T-SEC-012
    @Test
    void userCannotMarkTicketAsUsed() throws Exception {
        mockMvc.perform(patch("/api/tickets/TKT-1/use")
                        .header(HttpHeaders.AUTHORIZATION, bearer(1L, "USER")))
                .andExpect(status().isForbidden());

        verifyNoInteractions(ticketService);
    }

    // T-SEC-013 / UC-SEC-07
    @Test
    void staffCanMarkTicketAsUsed() throws Exception {
        when(ticketService.markAsUsed("TKT-1")).thenReturn(ticket(TicketStatus.USED));

        mockMvc.perform(patch("/api/tickets/TKT-1/use")
                        .header(HttpHeaders.AUTHORIZATION, bearer(3L, "USER", "STAFF")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("USED"));
    }

    // FR-SECTKT-04
    @Test
    void paidTicketsListRequiresStaffOrAdmin() throws Exception {
        mockMvc.perform(get("/api/events/CMF-2026/tickets/paid"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/events/CMF-2026/tickets/paid")
                        .header(HttpHeaders.AUTHORIZATION, bearer(1L, "USER")))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/events/CMF-2026/tickets/paid")
                        .header(HttpHeaders.AUTHORIZATION, bearer(3L, "USER", "STAFF")))
                .andExpect(status().isOk());
    }

    // ---------- login ----------

    // T-SEC-005
    @Test
    void loginReturnsBearerToken() throws Exception {
        when(authService.login(any(LoginRequest.class)))
                .thenReturn(new AuthResponse("jwt-de-prueba", "Bearer", 900));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(LOGIN_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.expiresIn").value(900));
    }

    // T-SEC-006
    @Test
    void wrongPasswordReturnsGeneric401() throws Exception {
        when(authService.login(any(LoginRequest.class)))
                .thenThrow(new BadCredentialsException("Invalid credentials"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(LOGIN_JSON))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(content().string(not(containsString("Invalid credentials"))));
    }

    // ---------- JWT inválidos ----------

    // T-SEC-007
    @Test
    void expiredTokenReturns401() throws Exception {
        assertUniform401(mockMvc.perform(get("/api/tickets/TKT-1")
                .header(HttpHeaders.AUTHORIZATION, expiredBearer())));

        verifyNoInteractions(ticketService);
    }

    // T-SEC-008
    @Test
    void tamperedTokenReturns401() throws Exception {
        assertUniform401(mockMvc.perform(get("/api/tickets/TKT-1")
                .header(HttpHeaders.AUTHORIZATION, tamperedBearer())));

        verifyNoInteractions(ticketService);
    }

    // T-SEC-019 / NFR-SEC002: un Bearer malformado nunca produce 500 ni filtra detalles
    @Test
    void malformedBearerNeverLeaksDetails() throws Exception {
        assertUniform401(mockMvc.perform(get("/api/tickets/TKT-1")
                .header(HttpHeaders.AUTHORIZATION, "Bearer esto-no-es-un-jwt")));

        assertUniform401(mockMvc.perform(get("/api/tickets/TKT-1")
                .header(HttpHeaders.AUTHORIZATION, "Bearer ")));
    }

    // Dos headers Authorization: no se autentica con ninguno
    @Test
    void duplicatedAuthorizationHeaderIsNotAuthenticated() throws Exception {
        String valid = bearer(1L, "USER");

        mockMvc.perform(get("/api/auth/me")
                        .header(HttpHeaders.AUTHORIZATION, valid, valid))
                .andExpect(status().isUnauthorized());
    }

    // T-SEC-016 (versión MockMvc): token válido de un usuario desactivado
    @Test
    void validTokenOfInactiveUserReturns401() throws Exception {
        mockMvc.perform(get("/api/auth/me")
                        .header(HttpHeaders.AUTHORIZATION, bearerOfInactiveUser(9L)))
                .andExpect(status().isUnauthorized());
    }

    // ---------- /api/auth/me ----------

    @Test
    void meReturnsThePrincipalOfAValidToken() throws Exception {
        mockMvc.perform(get("/api/auth/me")
                        .header(HttpHeaders.AUTHORIZATION, bearer(7L, "USER", "STAFF")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(7))
                .andExpect(jsonPath("$.username").value("user7"))
                .andExpect(jsonPath("$.roles[0]").value("USER"))
                .andExpect(jsonPath("$.roles[1]").value("STAFF"))
                .andExpect(jsonPath("$.password").doesNotExist());
    }

    @Test
    void meRequiresAuthentication() throws Exception {
        assertUniform401(mockMvc.perform(get("/api/auth/me")));
    }

    // T-SEC-018: request inválido pero autorizado -> 400 de Bean Validation
    @Test
    void invalidBodyFromAnAuthorizedUserReturns400() throws Exception {
        mockMvc.perform(post("/api/events")
                        .header(HttpHeaders.AUTHORIZATION, bearer(2L, "ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(INVALID_EVENT_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.details.eventCode").value("Event code is required"));

        verifyNoInteractions(eventService);
    }

        // NFR-SEC006: toda respuesta lleva X-Request-Id, también las de error
    @Test
    void everyResponseCarriesARequestId() throws Exception {
        mockMvc.perform(get("/api/events/published"))                       // 200
                .andExpect(header().exists("X-Request-Id"));

        mockMvc.perform(post("/api/events")                                  // 401
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isUnauthorized())
                .andExpect(header().exists("X-Request-Id"));

        mockMvc.perform(post("/api/events")                                  // 403
                        .header(HttpHeaders.AUTHORIZATION, bearer(1L, "USER"))
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isForbidden())
                .andExpect(header().exists("X-Request-Id"));
    }

    @Test
    void aValidRequestIdSentByTheClientIsEchoedBack() throws Exception {
        mockMvc.perform(get("/api/events/published").header("X-Request-Id", "traza-demo-001"))
                .andExpect(header().string("X-Request-Id", "traza-demo-001"));
    }

    // NFR-SEC006: las denegaciones quedan registradas, sin token ni datos sensibles
    @Test
    void deniedRequestsAreLoggedWithMethodPathAndNoSecrets() throws Exception {
        ch.qos.logback.classic.Logger audit =
                (ch.qos.logback.classic.Logger) LoggerFactory.getLogger("SECURITY_AUDIT");
        ListAppender<ILoggingEvent> appender = new ListAppender<>();
        appender.start();
        audit.addAppender(appender);

        try {
            mockMvc.perform(post("/api/events")
                            .contentType(MediaType.APPLICATION_JSON).content("{}"))
                    .andExpect(status().isUnauthorized());

            mockMvc.perform(post("/api/events")
                            .header(HttpHeaders.AUTHORIZATION, bearer(1L, "USER"))
                            .contentType(MediaType.APPLICATION_JSON).content("{}"))
                    .andExpect(status().isForbidden());
        } finally {
            audit.detachAppender(appender);
        }

        List<String> messages = appender.list.stream().map(ILoggingEvent::getFormattedMessage).toList();

        assertThat(messages).hasSize(2);
        assertThat(messages.get(0)).contains("401", "POST", "/api/events", "anonymous");
        assertThat(messages.get(1)).contains("403", "POST", "/api/events", "id=1");
        assertThat(String.join(" ", messages)).doesNotContain("Bearer").doesNotContain("eyJ");
    }
}