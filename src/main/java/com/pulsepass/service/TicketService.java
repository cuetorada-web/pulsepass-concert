package com.pulsepass.service;

import com.pulsepass.dto.request.PurchaseTicketRequest;
import com.pulsepass.dto.response.TicketResponse;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;

public interface TicketService {

    // FR-SECTKT-01: USER, y el email del request debe ser el del principal
    @PreAuthorize("hasRole('USER') and @authz.isCurrentUserEmail(#request.userEmail())")
    TicketResponse purchase(PurchaseTicketRequest request);

    // FR-SECTKT-02: propietario, o STAFF/ADMIN
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN') or @authz.isTicketOwner(#ticketCode)")
    TicketResponse findByCode(String ticketCode);

    // FR-SECTKT-03: propietario, o ADMIN
    @PreAuthorize("hasRole('ADMIN') or @authz.isCurrentUserEmail(#email)")
    List<TicketResponse> findByUserEmail(String email);

    // FR-SECTKT-04
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    List<TicketResponse> findPaidTicketsByEvent(String eventCode);

    // FR-SECTKT-05: propietario o ADMIN; las reglas de cancelación siguen en el Service
    @PreAuthorize("hasRole('ADMIN') or @authz.isTicketOwner(#ticketCode)")
    TicketResponse cancel(String ticketCode);

    // FR-SECTKT-06
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    TicketResponse markAsUsed(String ticketCode);
}