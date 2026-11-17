package com.pulsepass.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.slf4j.MDC;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class RequestIdFilterTest {

    private static final String UUID_PATTERN =
            "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$";

    private final RequestIdFilter filter = new RequestIdFilter();
    private MockHttpServletRequest request;
    private MockHttpServletResponse response;

    @BeforeEach
    void setUp() {
        MDC.clear();
        request = new MockHttpServletRequest("GET", "/api/events/published");
        response = new MockHttpServletResponse();
    }

    @AfterEach
    void cleanUp() {
        MDC.clear();
    }

    @Test
    void generatesAnIdWhenTheClientSendsNone() throws Exception {
        filter.doFilter(request, response, (req, res) -> { });

        assertThat(response.getHeader(RequestIdFilter.HEADER)).matches(UUID_PATTERN);
    }

    @Test
    void reusesAValidIdSentByTheClient() throws Exception {
        request.addHeader(RequestIdFilter.HEADER, "cliente-123.abc_XYZ");

        filter.doFilter(request, response, (req, res) -> { });

        assertThat(response.getHeader(RequestIdFilter.HEADER)).isEqualTo("cliente-123.abc_XYZ");
    }

    // Un ID con espacios, saltos de línea o demasiado largo se reemplaza (evita falsificar logs)
    @Test
    void replacesAnUnsafeIdInsteadOfCopyingItIntoTheLogs() throws Exception {
        for (String unsafe : new String[]{"con espacios", "x\r\nInjected: yes", "a".repeat(65)}) {
            MockHttpServletRequest req = new MockHttpServletRequest("GET", "/api/events/published");
            MockHttpServletResponse res = new MockHttpServletResponse();
            req.addHeader(RequestIdFilter.HEADER, unsafe);

            filter.doFilter(req, res, (r, s) -> { });

            assertThat(res.getHeader(RequestIdFilter.HEADER)).matches(UUID_PATTERN);
        }
    }

    @Test
    void idIsInTheMdcDuringTheRequestAndRemovedAfterwards() throws Exception {
        String[] seenInsideTheChain = new String[1];
        FilterChain chain = (req, res) -> seenInsideTheChain[0] = MDC.get(RequestIdFilter.MDC_KEY);

        filter.doFilter(request, response, chain);

        assertThat(seenInsideTheChain[0]).isEqualTo(response.getHeader(RequestIdFilter.HEADER));
        assertThat(MDC.get(RequestIdFilter.MDC_KEY)).isNull();
    }

    // Aunque la petición falle, el hilo no debe quedar con un ID ajeno
    @Test
    void idIsRemovedEvenWhenTheChainFails() {
        FilterChain failing = (req, res) -> {
            throw new ServletException("fallo simulado");
        };

        assertThatThrownBy(() -> filter.doFilter(request, response, failing))
                .isInstanceOf(ServletException.class);

        assertThat(MDC.get(RequestIdFilter.MDC_KEY)).isNull();
    }
}