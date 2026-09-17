package com.pulsepass.domain;

/**
 * Estado del evento (FR-EVT-003).
 *
 * Ciclo conceptual recomendado por el PRD (sección 9.1):
 *   DRAFT -> PUBLISHED -> SOLD_OUT -> FINISHED
 *                      \-> CANCELLED
 *
 * El MVP NO implementa una máquina de estados en Java (BR-010):
 * las transiciones no se validan aquí, solo se garantiza que el valor
 * persistido pertenezca al catálogo permitido (vía CHECK en PostgreSQL).
 */
public enum EventStatus {
    DRAFT,
    PUBLISHED,
    SOLD_OUT,
    CANCELLED,
    FINISHED
}