package com.arthova.backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.beans.factory.annotation.Autowired;
import com.arthova.backend.service.MarketService;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/public/compare")
@CrossOrigin(origins = "http://localhost:3000")
public class ComparisonController {

    @Autowired
    private MarketService marketService;

    @GetMapping("/dynamic")
    public Map<String, Object> compareDynamic(@RequestParam List<String> symbols) {
        return marketService.getHistoricalComparison(symbols);
    }

    @GetMapping
    public Map<String, Object> compareAssets(@RequestParam String stockSymbol, @RequestParam String mfSymbol) {
        Map<String, Object> response = new HashMap<>();
        
        // Mock data for the comparison feature on the home page
        // In a real application, this would fetch historical data using Yahoo Finance API and an MF API,
        // calculate CAGR, max drawdown, etc., and return the comparison metrics.
        
        Map<String, Object> stockStats = new HashMap<>();
        stockStats.put("symbol", stockSymbol);
        stockStats.put("cagr5Y", 19.3);
        stockStats.put("finalValue", 242100);
        
        Map<String, Object> mfStats = new HashMap<>();
        mfStats.put("symbol", mfSymbol);
        mfStats.put("cagr5Y", 13.1);
        mfStats.put("finalValue", 185400);
        
        response.put("stock", stockStats);
        response.put("mutualFund", mfStats);
        response.put("investmentAmount", 100000);
        
        return response;
    }
}
