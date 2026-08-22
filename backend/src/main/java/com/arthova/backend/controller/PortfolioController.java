package com.arthova.backend.controller;

import com.arthova.backend.dto.TradeRequest;
import com.arthova.backend.entity.Holding;
import com.arthova.backend.service.PortfolioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.CrossOrigin;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/public/portfolio")
@CrossOrigin(origins = "http://localhost:3000")
public class PortfolioController {

    @Autowired
    private PortfolioService portfolioService;

    @GetMapping("/{userId}")
    public ResponseEntity<List<Holding>> getHoldings(@PathVariable UUID userId) {
        return ResponseEntity.ok(portfolioService.getUserHoldings(userId));
    }

    @PostMapping("/{userId}/trade")
    public ResponseEntity<Holding> executeTrade(@PathVariable UUID userId, @RequestBody TradeRequest request) {
        try {
            Holding updatedHolding = portfolioService.executeTrade(userId, request);
            return ResponseEntity.ok(updatedHolding);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }
}
