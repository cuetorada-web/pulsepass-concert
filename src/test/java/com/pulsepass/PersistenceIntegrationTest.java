package com.pulsepass;

import com.pulsepass.domain.*;
import com.pulsepass.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

@Testcontainers
@SpringBootTest
@Transactional
class PersistenceIntegrationTest {

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

    @Autowired private VenueRepository venueRepository;
    @Autowired private EventRepository eventRepository;
    @Autowired private ArtistRepository artistRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private UserProfileRepository userProfileRepository;
    @Autowired private TicketRepository ticketRepository;

    private Venue venue;

    @BeforeEach
    void setUp() {
        venue = venueRepository.save(
                new Venue("VEN-SMR-01", "Marina Convention Center", "Santa Marta",
                        "Calle 1 # 2-30", 5000, true)
        );
    }

    // ---------------------------------------------------------
    // QT-001 / QT-010 se validan implÃƒÂ­citamente: si el contexto
    // levanta y estos tests corren, Flyway ya aplicÃƒÂ³ V1, V2 y V3
    // y Hibernate ya validÃƒÂ³ el esquema (ddl-auto=validate).
    // ---------------------------------------------------------

    @Test
    void debeGuardarYRecuperarVenuePorCodigo() {
        var encontrado = venueRepository.findByCode("VEN-SMR-01");

        assertThat(encontrado).isPresent();
        assertThat(encontrado.get().getCapacity()).isGreaterThan(0);
    }

    // QT-003: Venue 1:N Event
    @Test
    void debeProbarRelacionVenueEvent() {
        Event evento = eventRepository.save(
                new Event("CMF-2026", "Caribbean Music Fest 2026", "Festival de mÃƒÂºsica",
                        EventCategory.MUSIC, EventStatus.PUBLISHED,
                        LocalDateTime.now().plusMonths(2), 0, venue)
        );

        List<Event> eventosDelVenue = eventRepository.findByVenueCode("VEN-SMR-01");

        assertThat(eventosDelVenue).hasSize(1);
        assertThat(eventosDelVenue.get(0).getEventCode()).isEqualTo("CMF-2026");
        assertThat(evento.getVenue().getCode()).isEqualTo("VEN-SMR-01");
    }

    // QT-004: User 1:1 UserProfile
    @Test
    void debeProbarRelacionUserUserProfile() {
        User user = userRepository.save(new User("andrea", "andrea@mail.com", true));

        UserProfile profile = new UserProfile("Andrea", "Gomez", "3001234567",
                "Santa Marta", LocalDate.of(1998, 5, 20));
        user.setProfile(profile);
        userRepository.save(user);

        var recuperado = userRepository.findByUsername("andrea");

        assertThat(recuperado).isPresent();
        assertThat(recuperado.get().getProfile()).isNotNull();
        assertThat(recuperado.get().getProfile().getFirstName()).isEqualTo("Andrea");
    }

    // AC-004: la BD debe impedir un segundo perfil para el mismo usuario
    @Test
    void debeRechazarSegundoPerfilParaElMismoUsuario() {
        User user = userRepository.save(new User("carlos", "carlos@mail.com", true));

        UserProfile primerPerfil = new UserProfile("Carlos", "Ruiz", null, null, null);
        primerPerfil.setUser(user);
        userProfileRepository.saveAndFlush(primerPerfil);

        UserProfile segundoPerfil = new UserProfile("Carlos", "Otro", null, null, null);
        segundoPerfil.setUser(user);

        assertThrows(DataIntegrityViolationException.class,
                () -> userProfileRepository.saveAndFlush(segundoPerfil));
    }

    // QT-005: Event N:M Artist
    @Test
    void debeProbarRelacionEventArtist() {
        Event evento = eventRepository.save(
                new Event("CMF-2026", "Caribbean Music Fest 2026", "Festival",
                        EventCategory.MUSIC, EventStatus.PUBLISHED,
                        LocalDateTime.now().plusMonths(1), 0, venue)
        );

        Artist a1 = artistRepository.save(new Artist("DJ Test Uno", "Colombia", "Electronic", true));
        Artist a2 = artistRepository.save(new Artist("DJ Test Dos", "Mexico", "Synth-Pop", true));

        evento.addArtist(a1);
        evento.addArtist(a2);
        eventRepository.save(evento);

        List<Event> eventosDeArtista = eventRepository.findByArtistStageName("DJ Test Uno");

        assertThat(eventosDeArtista).hasSize(1);
        assertThat(eventosDeArtista.get(0).getArtists()).hasSize(2);
    }

    // QT-006: Ticket -> User y Ticket -> Event
    @Test
    void debeProbarRelacionesDeTicket() {
        Event evento = eventRepository.save(
                new Event("CMF-2026", "Caribbean Music Fest 2026", "Festival",
                        EventCategory.MUSIC, EventStatus.PUBLISHED,
                        LocalDateTime.now().plusMonths(1), 0, venue)
        );
        User user = userRepository.save(new User("laura", "laura@mail.com", true));

        Ticket ticket = ticketRepository.save(
                new Ticket("TCK-0001", TicketType.GENERAL, new BigDecimal("120000"),
                        TicketStatus.RESERVED, LocalDateTime.now(), user, evento)
        );

        assertThat(ticket.getUser().getUsername()).isEqualTo("laura");
        assertThat(ticket.getEvent().getEventCode()).isEqualTo("CMF-2026");
    }

    // QT-007: Query Methods simples y con navegaciÃƒÂ³n
    @Test
    void debeConsultarTicketsPorEmailDeUsuario() {
        Event evento = eventRepository.save(
                new Event("CMF-2026", "Caribbean Music Fest 2026", "Festival",
                        EventCategory.MUSIC, EventStatus.PUBLISHED,
                        LocalDateTime.now().plusMonths(1), 0, venue)
        );
        User user = userRepository.save(new User("andrea", "andrea@mail.com", true));

        ticketRepository.save(new Ticket("TCK-0002", TicketType.VIP, new BigDecimal("250000"),
                TicketStatus.PAID, LocalDateTime.now(), user, evento));

        List<Ticket> tickets = ticketRepository.findByUserEmail("andrea@mail.com");

        assertThat(tickets).hasSize(1);
        assertThat(tickets.get(0).getStatus()).isEqualTo(TicketStatus.PAID);
    }

    // QT-008: consulta JPQL con JOIN y COUNT
    @Test
    void debeContarTicketsPaidDeUnEvento() {
        Event evento = eventRepository.save(
                new Event("CMF-2026", "Caribbean Music Fest 2026", "Festival",
                        EventCategory.MUSIC, EventStatus.PUBLISHED,
                        LocalDateTime.now().plusMonths(1), 0, venue)
        );
        User u1 = userRepository.save(new User("andrea", "andrea@mail.com", true));
        User u2 = userRepository.save(new User("carlos", "carlos@mail.com", true));
        User u3 = userRepository.save(new User("miguel", "miguel@mail.com", true));

        ticketRepository.save(new Ticket("TCK-01", TicketType.VIP, new BigDecimal("250000"),
                TicketStatus.PAID, LocalDateTime.now(), u1, evento));
        ticketRepository.save(new Ticket("TCK-02", TicketType.GENERAL, new BigDecimal("120000"),
                TicketStatus.PAID, LocalDateTime.now(), u2, evento));
        ticketRepository.save(new Ticket("TCK-03", TicketType.VIP, new BigDecimal("250000"),
                TicketStatus.CANCELLED, LocalDateTime.now(), u3, evento));

        long totalPagados = ticketRepository.countPaidTicketsByEventCode("CMF-2026");

        assertThat(totalPagados).isEqualTo(2);
    }

    // QT-009: restricciÃƒÂ³n UNIQUE con saveAndFlush (eventCode duplicado)
    @Test
    void debeRechazarEventCodeDuplicado() {
        eventRepository.saveAndFlush(
                new Event("CMF-2026", "Caribbean Music Fest 2026", "Festival",
                        EventCategory.MUSIC, EventStatus.PUBLISHED,
                        LocalDateTime.now().plusMonths(1), 0, venue)
        );

        Event duplicado = new Event("CMF-2026", "Otro nombre", "Otra desc",
                EventCategory.MUSIC, EventStatus.DRAFT,
                LocalDateTime.now().plusMonths(2), 0, venue);

        assertThrows(DataIntegrityViolationException.class,
                () -> eventRepository.saveAndFlush(duplicado));
    }

    // AC-006: consultar solo PUBLISHED, sin DRAFT ni CANCELLED
    @Test
    void debeConsultarSoloEventosPublicados() {
        eventRepository.save(new Event("EVT-1", "Evento Draft", "desc",
                EventCategory.MUSIC, EventStatus.DRAFT,
                LocalDateTime.now().plusDays(10), 0, venue));

        eventRepository.save(new Event("EVT-2", "Evento Publicado", "desc",
                EventCategory.MUSIC, EventStatus.PUBLISHED,
                LocalDateTime.now().plusDays(5), 0, venue));

        eventRepository.save(new Event("EVT-3", "Evento Cancelado", "desc",
                EventCategory.MUSIC, EventStatus.CANCELLED,
                LocalDateTime.now().plusDays(20), 0, venue));

        List<Event> publicados = eventRepository.findByStatusOrderByEventDateAsc(EventStatus.PUBLISHED);

        assertThat(publicados).hasSize(1);
        assertThat(publicados.get(0).getEventCode()).isEqualTo("EVT-2");
    }
}