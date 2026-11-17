package com.pulsepass;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import org.slf4j.LoggerFactory;
import java.util.List;
import com.jayway.jsonpath.JsonPath;
import com.pulsepass.domain.Event;
import com.pulsepass.domain.EventCategory;
import com.pulsepass.domain.EventStatus;
import com.pulsepass.domain.Role;
import com.pulsepass.domain.Ticket;
import com.pulsepass.domain.TicketStatus;
import com.pulsepass.domain.TicketType;
import com.pulsepass.domain.User;
import com.pulsepass.domain.UserCredential;
import com.pulsepass.domain.UserRole;
import com.pulsepass.domain.UserRoleId;
import com.pulsepass.domain.Venue;
import com.pulsepass.repository.EventRepository;
import com.pulsepass.repository.TicketRepository;
import com.pulsepass.repository.UserCredentialRepository;
import com.pulsepass.repository.UserRepository;
import com.pulsepass.repository.UserRoleRepository;
import com.pulsepass.repository.VenueRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Testcontainers
@SpringBootTest
class SecurityIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("pulsepass")
            .withUsername("postgres")
            .withPassword("postgres");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    private static final String PASSWORD = "UnaFraseSegura2026!";

    @Autowired private WebApplicationContext context;
    @Autowired private UserRepository userRepository;
    @Autowired private UserCredentialRepository credentialRepository;
    @Autowired private UserRoleRepository roleRepository;
    @Autowired private VenueRepository venueRepository;
    @Autowired private EventRepository eventRepository;
    @Autowired private TicketRepository ticketRepository;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        // Se monta MockMvc con la cadena de filtros REAL de Spring Security
        mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .build();
    }

    // =====================================================================
    // Utilidades
    // =====================================================================

    private static String unique(String prefix) {
        return prefix + UUID.randomUUID().toString().substring(0, 8);
    }

    private static String emailOf(String username) {
        return username + "@email.com";
    }

    private String registrationJson(String username) {
        return """
                {"username":"%s","email":"%s","firstName":"Test","lastName":"User",
                 "city":"Santa Marta","birthDate":"2000-05-10","password":"%s"}
                """.formatted(username, emailOf(username), PASSWORD);
    }

    private Long registerUser(String username) throws Exception {
        String body = mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registrationJson(username)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        return ((Number) JsonPath.read(body, "$.id")).longValue();
    }

    private String loginBody(String identifier, String password) {
        return "{\"identifier\":\"%s\",\"password\":\"%s\"}".formatted(identifier, password);
    }

    /** Login real: devuelve el header "Bearer <jwt>". */
    private String login(String username) throws Exception {
        String body = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginBody(username, PASSWORD)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        String token = JsonPath.read(body, "$.accessToken");
        return "Bearer " + token;
    }

    /** Los roles privilegiados se asignan "administrativamente" (nunca por la API pública). */
    private void giveRole(Long userId, Role role) {
        roleRepository.save(new UserRole(userId, role));
    }

    private Event createEvent(EventStatus status) {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        Venue venue = venueRepository.save(new Venue("VEN-" + suffix, "Venue " + suffix,
                "Santa Marta", "Calle 1 # 2-30", 100, true));

        return eventRepository.save(new Event("EVT-" + suffix, "Festival " + suffix, "Descripcion",
                EventCategory.MUSIC, status, LocalDateTime.now().plusDays(30), 0, venue));
    }

    private Ticket createTicket(Long ownerId, Event event) {
        User owner = userRepository.findById(ownerId).orElseThrow();
        return ticketRepository.save(new Ticket(
                "TKT-" + UUID.randomUUID().toString().substring(0, 8),
                TicketType.GENERAL, new BigDecimal("50000.00"), TicketStatus.PAID,
                LocalDateTime.now(), owner, event));
    }

    private String purchaseJson(String userEmail, String eventCode) {
        return "{\"userEmail\":\"%s\",\"eventCode\":\"%s\",\"type\":\"GENERAL\"}"
                .formatted(userEmail, eventCode);
    }

    // =====================================================================
    // Registro y login
    // =====================================================================

    // FR-SECAUTH-001 / NFR-SEC004
    @Test
    void registrationStoresBcryptHashAndHidesSecrets() throws Exception {
        String username = unique("andrea");

        String body = mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registrationJson(username)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.username").value(username))
                .andExpect(jsonPath("$.password").doesNotExist())
                .andExpect(jsonPath("$.passwordHash").doesNotExist())
                .andReturn().getResponse().getContentAsString();

        Long id = ((Number) JsonPath.read(body, "$.id")).longValue();

        assertThat(body).doesNotContain(PASSWORD);

        UserCredential credential = credentialRepository.findById(id).orElseThrow();
        assertThat(credential.getPasswordHash()).startsWith("$2").isNotEqualTo(PASSWORD);
        assertThat(roleRepository.findRolesByUserId(id)).containsExactly(Role.USER);
    }

    // NFR-SEC009: ningún cliente puede registrarse con un rol privilegiado
    @Test
    void registrationCannotEscalateToPrivilegedRoles() throws Exception {
        String username = unique("mallory");
        String json = """
                {"username":"%s","email":"%s","firstName":"Mal","lastName":"Lory",
                 "birthDate":"2000-05-10","password":"%s",
                 "roles":["ADMIN"],"role":"ADMIN"}
                """.formatted(username, emailOf(username), PASSWORD);

        int statusCode = mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andReturn().getResponse().getStatus();

        // Según la configuración de Jackson se ignora el campo (201) o se rechaza (400):
        // lo que NUNCA puede pasar es que el usuario termine con otro rol que no sea USER.
        assertThat(statusCode).isIn(201, 400);
        userRepository.findByUsername(username).ifPresent(user ->
                assertThat(roleRepository.findRolesByUserId(user.getId())).containsExactly(Role.USER));
    }

    // UC-SEC-02
    @Test
    void loginIssuesATokenThatWorksOnMe() throws Exception {
        String username = unique("andrea");
        Long id = registerUser(username);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginBody(username, PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.expiresIn").value(900))
                .andExpect(jsonPath("$.accessToken").isNotEmpty());

        // También se puede iniciar sesión con el correo
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginBody(emailOf(username), PASSWORD)))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/auth/me").header(HttpHeaders.AUTHORIZATION, login(username)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id.intValue()))
                .andExpect(jsonPath("$.username").value(username))
                .andExpect(jsonPath("$.roles[0]").value("USER"));
    }

    // FR-SECAUTH-003: contraseña incorrecta y usuario inexistente son indistinguibles
    @Test
    void wrongPasswordAndUnknownUserGetTheSameGeneric401() throws Exception {
        String username = unique("andrea");
        registerUser(username);

        String wrongPassword = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginBody(username, "incorrecta-incorrecta")))
                .andExpect(status().isUnauthorized())
                .andReturn().getResponse().getContentAsString();

        String unknownUser = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginBody(unique("fantasma"), PASSWORD)))
                .andExpect(status().isUnauthorized())
                .andReturn().getResponse().getContentAsString();

        String messageWrong = JsonPath.read(wrongPassword, "$.message");
        String messageUnknown = JsonPath.read(unknownUser, "$.message");
        assertThat(messageWrong).isEqualTo(messageUnknown);
    }

    // Usuarios legados (sin credencial) no pueden entrar: no se inventan contraseñas
    @Test
    void legacyUserWithoutCredentialCannotLogin() throws Exception {
        String username = unique("legado");
        userRepository.save(new User(username, emailOf(username), true));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginBody(username, PASSWORD)))
                .andExpect(status().isUnauthorized());
    }

    // =====================================================================
    // Propiedad de tickets (anti-IDOR)
    // =====================================================================

    // T-SEC-009 / T-SEC-011 / UC-SEC-06
    @Test
    void foreignTicketIsForbiddenWhileOwnerCanReadAndCancel() throws Exception {
        String andrea = unique("andrea");
        String carlos = unique("carlos");
        registerUser(andrea);
        Long carlosId = registerUser(carlos);

        String code = createTicket(carlosId, createEvent(EventStatus.PUBLISHED)).getTicketCode();
        String andreaToken = login(andrea);
        String carlosToken = login(carlos);

        // Andrea conoce el código, pero el ticket no es suyo
        mockMvc.perform(get("/api/tickets/" + code).header(HttpHeaders.AUTHORIZATION, andreaToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));

        mockMvc.perform(patch("/api/tickets/" + code + "/cancel")
                        .header(HttpHeaders.AUTHORIZATION, andreaToken))
                .andExpect(status().isForbidden());

        // La autorización ocurre ANTES de mutar: el ticket sigue PAID
        assertThat(ticketRepository.findByTicketCode(code).orElseThrow().getStatus())
                .isEqualTo(TicketStatus.PAID);

        // El dueño sí puede
        mockMvc.perform(get("/api/tickets/" + code).header(HttpHeaders.AUTHORIZATION, carlosToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ticketCode").value(code));

        mockMvc.perform(patch("/api/tickets/" + code + "/cancel")
                        .header(HttpHeaders.AUTHORIZATION, carlosToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));
    }

    // T-SEC-010 / UC-SEC-04 / UC-SEC-05
    @Test
    void userCanBuyForSelfButNotWithAnotherUsersEmail() throws Exception {
        String andrea = unique("andrea");
        String carlos = unique("carlos");
        registerUser(andrea);
        registerUser(carlos);

        Event event = createEvent(EventStatus.PUBLISHED);
        String andreaToken = login(andrea);

        mockMvc.perform(post("/api/tickets")
                        .header(HttpHeaders.AUTHORIZATION, andreaToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(purchaseJson(emailOf(carlos), event.getEventCode())))
                .andExpect(status().isForbidden());

        assertThat(ticketRepository.findByUserEmailIgnoreCaseOrderByPurchaseDateDesc(emailOf(carlos)))
                .isEmpty();

        mockMvc.perform(post("/api/tickets")
                        .header(HttpHeaders.AUTHORIZATION, andreaToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(purchaseJson(emailOf(andrea), event.getEventCode())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.userEmail").value(emailOf(andrea)));
    }

    // T-SEC-012 / T-SEC-013 / UC-SEC-07
    @Test
    void onlyStaffOrAdminCanMarkATicketAsUsed() throws Exception {
        String carlos = unique("carlos");
        String laura = unique("laura");
        Long carlosId = registerUser(carlos);
        Long lauraId = registerUser(laura);
        giveRole(lauraId, Role.STAFF);

        String code = createTicket(carlosId, createEvent(EventStatus.PUBLISHED)).getTicketCode();

        // Ni el dueño (USER) puede marcarlo como usado
        mockMvc.perform(patch("/api/tickets/" + code + "/use")
                        .header(HttpHeaders.AUTHORIZATION, login(carlos)))
                .andExpect(status().isForbidden());
        assertThat(ticketRepository.findByTicketCode(code).orElseThrow().getStatus())
                .isEqualTo(TicketStatus.PAID);

        String lauraToken = login(laura);

        mockMvc.perform(patch("/api/tickets/" + code + "/use")
                        .header(HttpHeaders.AUTHORIZATION, lauraToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("USED"));

        // La segunda vez la rechaza la regla de negocio heredada (409)
        mockMvc.perform(patch("/api/tickets/" + code + "/use")
                        .header(HttpHeaders.AUTHORIZATION, lauraToken))
                .andExpect(status().isConflict());
    }

    // =====================================================================
    // Búsquedas de usuarios
    // =====================================================================

    // T-SEC-015
    @Test
    void userCanOnlySearchTheirOwnDataAndAdminCanSearchAnyone() throws Exception {
        String andrea = unique("andrea");
        String carlos = unique("carlos");
        String root = unique("admin");
        registerUser(andrea);
        registerUser(carlos);
        giveRole(registerUser(root), Role.ADMIN);

        String andreaToken = login(andrea);

        mockMvc.perform(get("/api/users/by-email").param("email", emailOf(carlos))
                        .header(HttpHeaders.AUTHORIZATION, andreaToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/users/by-username").param("username", carlos)
                        .header(HttpHeaders.AUTHORIZATION, andreaToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/users/by-email").param("email", emailOf(andrea))
                        .header(HttpHeaders.AUTHORIZATION, andreaToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(emailOf(andrea)));

        mockMvc.perform(get("/api/users/by-email").param("email", emailOf(carlos))
                        .header(HttpHeaders.AUTHORIZATION, login(root)))
                .andExpect(status().isOk());
    }

    // =====================================================================
    // Eventos
    // =====================================================================

    // UC-SEC-08 / T-SEC-014
    @Test
    void userCannotPublishAnEventButAdminCan() throws Exception {
        String andrea = unique("andrea");
        String root = unique("admin");
        registerUser(andrea);
        giveRole(registerUser(root), Role.ADMIN);

        String code = createEvent(EventStatus.DRAFT).getEventCode();

        mockMvc.perform(patch("/api/events/" + code + "/publish")
                        .header(HttpHeaders.AUTHORIZATION, login(andrea)))
                .andExpect(status().isForbidden());
        assertThat(eventRepository.findByEventCode(code).orElseThrow().getStatus())
                .isEqualTo(EventStatus.DRAFT);

        mockMvc.perform(patch("/api/events/" + code + "/publish")
                        .header(HttpHeaders.AUTHORIZATION, login(root)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PUBLISHED"));
    }

    // T-SEC-017: los borradores no se revelan (404, no 403)
    @Test
    void draftEventsAreHiddenFromThePublicAndVisibleToStaff() throws Exception {
        String andrea = unique("andrea");
        String laura = unique("laura");
        registerUser(andrea);
        giveRole(registerUser(laura), Role.STAFF);

        String draftCode = createEvent(EventStatus.DRAFT).getEventCode();
        String publishedCode = createEvent(EventStatus.PUBLISHED).getEventCode();

        mockMvc.perform(get("/api/events/" + draftCode))
                .andExpect(status().isNotFound());

        mockMvc.perform(get("/api/events/" + draftCode)
                        .header(HttpHeaders.AUTHORIZATION, login(andrea)))
                .andExpect(status().isNotFound());

        mockMvc.perform(get("/api/events/" + draftCode)
                        .header(HttpHeaders.AUTHORIZATION, login(laura)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DRAFT"));

        // Un evento publicado sí es público
        mockMvc.perform(get("/api/events/" + publishedCode))
                .andExpect(status().isOk());
    }

    // =====================================================================
    // Estado y roles se revalidan en cada request
    // =====================================================================

    // T-SEC-016 / UC-SEC-10 / SEC011
    @Test
    void deactivatedUserLosesAccessWithAStillValidToken() throws Exception {
        String username = unique("andrea");
        Long id = registerUser(username);
        String token = login(username);

        mockMvc.perform(get("/api/auth/me").header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk());

        User user = userRepository.findById(id).orElseThrow();
        user.setActive(false);
        userRepository.save(user);

        // El token sigue siendo válido criptográficamente, pero el estado se consulta de nuevo
        mockMvc.perform(get("/api/auth/me").header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginBody(username, PASSWORD)))
                .andExpect(status().isUnauthorized());
    }

    // PRD 12.1: el token no conserva privilegios retirados
    @Test
    void revokedRoleAppliesOnTheNextRequestWithTheSameToken() throws Exception {
        String laura = unique("laura");
        Long lauraId = registerUser(laura);
        giveRole(lauraId, Role.STAFF);

        String eventCode = createEvent(EventStatus.PUBLISHED).getEventCode();
        String token = login(laura);

        mockMvc.perform(get("/api/events/" + eventCode + "/tickets/paid")
                        .header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk());

        roleRepository.deleteById(new UserRoleId(lauraId, Role.STAFF));

        mockMvc.perform(get("/api/events/" + eventCode + "/tickets/paid")
                        .header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isForbidden());
    }
        // NFR-SEC006: el 403 de propiedad (que sale del servicio, no del filtro) también se registra
    @Test
    void foreignTicketDenialIsLogged() throws Exception {
        String andrea = unique("andrea");
        String carlos = unique("carlos");
        registerUser(andrea);
        Long carlosId = registerUser(carlos);
        String code = createTicket(carlosId, createEvent(EventStatus.PUBLISHED)).getTicketCode();
        String andreaToken = login(andrea);

        ch.qos.logback.classic.Logger audit =
                (ch.qos.logback.classic.Logger) LoggerFactory.getLogger("SECURITY_AUDIT");
        ListAppender<ILoggingEvent> appender = new ListAppender<>();
        appender.start();
        audit.addAppender(appender);

        try {
            mockMvc.perform(get("/api/tickets/" + code).header(HttpHeaders.AUTHORIZATION, andreaToken))
                    .andExpect(status().isForbidden());
        } finally {
            audit.detachAppender(appender);
        }

        List<String> messages = appender.list.stream().map(ILoggingEvent::getFormattedMessage).toList();
        assertThat(messages).hasSize(1);
        assertThat(messages.get(0)).contains("403", "GET", "/api/tickets/" + code, "id=");
    }
        // FR-SECTKT-03: la lista de tickets por correo es del propietario o de un ADMIN
    @Test
    void ticketsByUserEmailAreOnlyForTheOwnerOrAnAdmin() throws Exception {
        String andrea = unique("andrea");
        String carlos = unique("carlos");
        String root = unique("admin");
        registerUser(andrea);
        Long carlosId = registerUser(carlos);
        giveRole(registerUser(root), Role.ADMIN);
        createTicket(carlosId, createEvent(EventStatus.PUBLISHED));

        String andreaToken = login(andrea);

        mockMvc.perform(get("/api/tickets/by-user").param("email", emailOf(carlos))
                        .header(HttpHeaders.AUTHORIZATION, andreaToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/tickets/by-user").param("email", emailOf(andrea))
                        .header(HttpHeaders.AUTHORIZATION, andreaToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());

        mockMvc.perform(get("/api/tickets/by-user").param("email", emailOf(carlos))
                        .header(HttpHeaders.AUTHORIZATION, login(root)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].userEmail").value(emailOf(carlos)));
    }

    // FR-SECTKT-02 y 05: STAFF puede ver un ticket ajeno pero no cancelarlo; ADMIN puede ambas
    @Test
    void staffCanReadButNotCancelAForeignTicketWhileAdminCanDoBoth() throws Exception {
        String carlos = unique("carlos");
        String laura = unique("laura");
        String root = unique("admin");
        Long carlosId = registerUser(carlos);
        giveRole(registerUser(laura), Role.STAFF);
        giveRole(registerUser(root), Role.ADMIN);

        String code = createTicket(carlosId, createEvent(EventStatus.PUBLISHED)).getTicketCode();
        String lauraToken = login(laura);

        mockMvc.perform(get("/api/tickets/" + code).header(HttpHeaders.AUTHORIZATION, lauraToken))
                .andExpect(status().isOk());

        mockMvc.perform(patch("/api/tickets/" + code + "/cancel")
                        .header(HttpHeaders.AUTHORIZATION, lauraToken))
                .andExpect(status().isForbidden());
        assertThat(ticketRepository.findByTicketCode(code).orElseThrow().getStatus())
                .isEqualTo(TicketStatus.PAID);

        mockMvc.perform(patch("/api/tickets/" + code + "/cancel")
                        .header(HttpHeaders.AUTHORIZATION, login(root)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));
    }
}