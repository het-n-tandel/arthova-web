package com.arthova.backend.controller;

import com.arthova.backend.service.MarketService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/public/market")
public class MarketController {

    @Autowired
    private MarketService marketService;

    @GetMapping("/suggestions")
    public Map<String, Object> getSuggestions() {
        return marketService.getSuggestedStocks();
    }

    @GetMapping("/search")
    public List<Map<String, String>> searchAssets(@RequestParam String q) {
        return marketService.searchAssets(q);
    }

    @GetMapping("/quote")
    public BigDecimal getQuote(@RequestParam String symbol) {
        return marketService.getQuote(symbol);
    }

    @GetMapping("/delay")
    public Map<String, Object> getDelayed(@RequestParam(defaultValue = "3000") long ms) throws InterruptedException {
        Thread.sleep(Math.min(ms, 10000));
        return Map.of("status", "delayed_response_ok", "delayMs", ms);
    }
}
