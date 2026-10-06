package com.pulsepass.service;

import com.pulsepass.domain.TicketType;
import com.pulsepass.exception.BusinessRuleException;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Component
public class TicketPriceCalculator {

    private static final BigDecimal BASE_PRICE = new BigDecimal("50000");

    public BigDecimal calculate(TicketType type) {

        BigDecimal multiplier = switch (type) {
            case GENERAL   -> BigDecimal.ONE;
            case STUDENT   -> new BigDecimal("0.70");
            case VIP       -> new BigDecimal("2.00");
            case BACKSTAGE -> new BigDecimal("3.00");
            default -> throw new BusinessRuleException("Unsupported ticket type: " + type);
        };

        return BASE_PRICE.multiply(multiplier).setScale(2, RoundingMode.HALF_UP);
    }
}