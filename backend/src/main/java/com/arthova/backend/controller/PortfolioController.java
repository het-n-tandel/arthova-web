package com.arthova.backend.controller;

import com.arthova.backend.dto.TradeRequest;
import com.arthova.backend.entity.Holding;
import com.arthova.backend.service.PortfolioService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/public/portfolio")
public class PortfolioController {

    @Autowired
    private PortfolioService portfolioService;

    private boolean isAuthorized(UUID targetUserId, Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return false;
        }
        try {
            UUID principalId = UUID.fromString(authentication.getName());
            return principalId.equals(targetUserId);
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    @GetMapping("/{userId}")
    public ResponseEntity<?> getHoldings(@PathVariable UUID userId, Authentication authentication) {
        if (!isAuthorized(userId, authentication)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Forbidden", "message", "You are not authorized to view this portfolio"));
        }
        List<Holding> userHoldings = portfolioService.getUserHoldings(userId);
        return ResponseEntity.ok(userHoldings);
    }

    @PostMapping("/{userId}/trade")
    public ResponseEntity<?> executeTrade(
            @PathVariable UUID userId,
            @Valid @RequestBody TradeRequest request,
            Authentication authentication
    ) {
        if (!isAuthorized(userId, authentication)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Forbidden", "message", "You are not authorized to trade on this portfolio"));
        }
        Holding updatedHolding = portfolioService.executeTrade(userId, request);
        return ResponseEntity.ok(updatedHolding);
    }

    @DeleteMapping("/{userId}/holding/{holdingId}")
    public ResponseEntity<?> deleteHolding(
            @PathVariable UUID userId,
            @PathVariable UUID holdingId,
            Authentication authentication
    ) {
        if (!isAuthorized(userId, authentication)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Forbidden", "message", "You are not authorized to modify this portfolio"));
        }
        portfolioService.deleteHolding(userId, holdingId);
        return ResponseEntity.noContent().build();
    }
}
