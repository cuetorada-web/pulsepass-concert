package com.pulsepass.domain;

/**
 * Estado del ticket (FR-TKT-005).
 *
 * Ciclo conceptual (sección 9.2):
 *   RESERVED -> PAID -> USED
 *            \-> CANCELLED
 *
 * PAID representa un pago ya confirmado por un sistema externo futuro;
 * este MVP no procesa pagos reales.
 */
public enum TicketStatus {
    RESERVED,
    PAID,
    CANCELLED,
    USED
}