package com.arthova.backend.service;

import org.springframework.stereotype.Service;
import yahoofinance.Stock;
import yahoofinance.YahooFinance;
import yahoofinance.histquotes.HistoricalQuote;
import yahoofinance.histquotes.Interval;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Calendar;

@Service
public class MarketService {

    private static final List<String> TOP_SUGGESTED_STOCKS = Arrays.asList(
            "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "ICICIBANK.NS",
            "SBIN.NS", "BHARTIARTL.NS", "ITC.NS", "L&T.NS", "BAJFINANCE.NS",
            "HUL.NS", "AXISBANK.NS", "KOTAKBANK.NS", "ASIANPAINT.NS", "MARUTI.NS",
            "SUNPHARMA.NS", "TITAN.NS", "ULTRACEMCO.NS", "TATAMOTORS.NS", "WIPRO.NS",
            "HCLTECH.NS", "NTPC.NS", "TATASTEEL.NS", "POWERGRID.NS", "ONGC.NS"
    );

    private static CacheEntry suggestionsCache = null;

    public Map<String, Object> getSuggestedStocks() {
        if (suggestionsCache != null && !suggestionsCache.isExpired()) {
            return suggestionsCache.data;
        }

        Map<String, Object> result = new HashMap<>();
        try {
            Map<String, Stock> stocks = YahooFinance.get(TOP_SUGGESTED_STOCKS.toArray(new String[0]));
            List<Map<String, Object>> suggestedList = new ArrayList<>();
            
            for (String symbol : TOP_SUGGESTED_STOCKS) {
                Stock stock = stocks.get(symbol);
                if (stock != null) {
                    Map<String, Object> stockData = new HashMap<>();
                    stockData.put("symbol", stock.getSymbol());
                    stockData.put("name", stock.getName());
                    stockData.put("price", stock.getQuote().getPrice());
                    stockData.put("change", stock.getQuote().getChangeInPercent());
                    suggestedList.add(stockData);
                }
            }
            result.put("suggestions", suggestedList);
            suggestionsCache = new CacheEntry(result);
        } catch (IOException | RuntimeException e) {
            e.printStackTrace();
            System.out.println("Yahoo Finance blocked. Using Mock Data for Suggestions.");
            // Fallback mock data
            List<Map<String, Object>> suggestedList = new ArrayList<>();
            for (String symbol : TOP_SUGGESTED_STOCKS) {
                Map<String, Object> stockData = new HashMap<>();
                stockData.put("symbol", symbol);
                stockData.put("name", symbol.replace(".NS", "") + " Ltd");
                double mockPrice = 100 + (Math.abs(symbol.hashCode()) % 2900);
                double mockChange = (Math.random() * 4) - 2; // -2 to +2
                stockData.put("price", BigDecimal.valueOf(mockPrice));
                stockData.put("change", BigDecimal.valueOf(mockChange));
                suggestedList.add(stockData);
            }
            result.put("suggestions", suggestedList);
            suggestionsCache = new CacheEntry(result); // Cache the mock so it's fast
        }
        return result;
    }

    // Basic search simulation - in a real app you'd hit a dedicated search endpoint
    // yahoofinance-api doesn't have a built-in search by name, so we use a predefined map or external API
    public List<Map<String, String>> searchAssets(String query) {
        // Simplified mockup for demonstration. We'll return hardcoded results matching the query
        List<Map<String, String>> results = new ArrayList<>();
        if (query == null || query.trim().isEmpty()) return results;
        
        String q = query.toLowerCase();
        if ("tata".contains(q) || "tcs".contains(q)) {
            results.add(Map.of("symbol", "TCS.NS", "name", "Tata Consultancy Services"));
            results.add(Map.of("symbol", "TATAMOTORS.NS", "name", "Tata Motors"));
        }
        if ("reliance".contains(q)) {
            results.add(Map.of("symbol", "RELIANCE.NS", "name", "Reliance Industries"));
        }
        if ("hdfc".contains(q)) {
            results.add(Map.of("symbol", "HDFCBANK.NS", "name", "HDFC Bank"));
        }
        return results;
    }

    public BigDecimal getQuote(String symbol) {
        try {
            Stock stock = YahooFinance.get(symbol);
            if (stock != null && stock.getQuote() != null) {
                return stock.getQuote().getPrice();
            }
        } catch (IOException | RuntimeException e) {
            System.out.println("Yahoo Finance blocked. Using Mock Data for Quote: " + symbol);
        }
        // Fallback mock price
        double mockPrice = 100 + (Math.abs(symbol.hashCode()) % 2900);
        return BigDecimal.valueOf(mockPrice);
    }

    // Simple cache to prevent 429 Too Many Requests
    private static final Map<String, CacheEntry> comparisonCache = new java.util.concurrent.ConcurrentHashMap<>();

    private static class CacheEntry {
        Map<String, Object> data;
        long timestamp;
        CacheEntry(Map<String, Object> data) {
            this.data = data;
            this.timestamp = System.currentTimeMillis();
        }
        boolean isExpired() {
            return System.currentTimeMillis() - timestamp > 5 * 60 * 1000; // 5 minutes cache
        }
    }

    public Map<String, Object> getHistoricalComparison(List<String> symbols) {
        String cacheKey = String.join(",", symbols);
        CacheEntry cached = comparisonCache.get(cacheKey);
        if (cached != null && !cached.isExpired()) {
            return cached.data;
        }

        Map<String, Object> result = new HashMap<>();
        try {
            Calendar from = Calendar.getInstance();
            from.add(Calendar.YEAR, -1); // 1 Year historical data

            Map<String, Stock> stocks = YahooFinance.get(symbols.toArray(new String[0]), from, Interval.DAILY);
            
            // We need to format data for the frontend chart (e.g. { date: '2023-01-01', RELIANCE: 100, TCS: 100 })
            // To make a comparison fair, we'll normalize everything to base 100 on the first day
            
            Map<String, Map<String, Object>> chartDataByDate = new TreeMap<>(); // sorted by date
            Map<String, BigDecimal> basePrices = new HashMap<>();

            for (String symbol : symbols) {
                Stock stock = stocks.get(symbol);
                if (stock == null) continue;
                
                List<HistoricalQuote> history = stock.getHistory();
                if (history == null || history.isEmpty()) continue;
                
                // Sort history chronologically
                history.sort(Comparator.comparing(HistoricalQuote::getDate));
                
                // Set base price for normalization
                basePrices.put(symbol, history.get(0).getClose());

                for (HistoricalQuote quote : history) {
                    if (quote.getClose() == null) continue;
                    
                    String dateStr = LocalDate.ofInstant(quote.getDate().toInstant(), ZoneId.systemDefault()).toString();
                    chartDataByDate.putIfAbsent(dateStr, new HashMap<>());
                    
                    // Normalize to 100 base index
                    BigDecimal normalized = quote.getClose()
                            .divide(basePrices.get(symbol), 4, java.math.RoundingMode.HALF_UP)
                            .multiply(new BigDecimal("100"));
                            
                    chartDataByDate.get(dateStr).put(symbol.replace(".NS", ""), normalized.doubleValue());
                }
            }

            List<Map<String, Object>> finalChartData = new ArrayList<>();
            for (Map.Entry<String, Map<String, Object>> entry : chartDataByDate.entrySet()) {
                Map<String, Object> point = new HashMap<>();
                point.put("date", entry.getKey());
                point.putAll(entry.getValue());
                finalChartData.add(point);
            }
            
            result.put("chartData", finalChartData);
            result.put("symbols", symbols.stream().map(s -> s.replace(".NS", "")).collect(Collectors.toList()));
            
            // Save to cache
            comparisonCache.put(cacheKey, new CacheEntry(result));
            
        } catch (IOException | RuntimeException e) {
            System.out.println("Yahoo Finance blocked. Using Mock Data for Chart.");
            List<Map<String, Object>> finalChartData = new ArrayList<>();
            Calendar cal = Calendar.getInstance();
            cal.add(Calendar.YEAR, -1);
            
            double[] currentPrices = new double[symbols.size()];
            for (int i = 0; i < symbols.size(); i++) currentPrices[i] = 100.0; // Base 100

            for (int i = 0; i < 250; i++) { // ~250 trading days
                cal.add(Calendar.DAY_OF_YEAR, 1);
                // Skip weekends
                if (cal.get(Calendar.DAY_OF_WEEK) == Calendar.SATURDAY || cal.get(Calendar.DAY_OF_WEEK) == Calendar.SUNDAY) {
                    continue;
                }
                
                Map<String, Object> point = new HashMap<>();
                point.put("date", String.format("%tF", cal));
                
                for (int j = 0; j < symbols.size(); j++) {
                    String cleanSymbol = symbols.get(j).replace(".NS", "");
                    // Random walk
                    currentPrices[j] = currentPrices[j] * (1 + ((Math.random() * 0.04) - 0.018));
                    point.put(cleanSymbol, currentPrices[j]);
                }
                finalChartData.add(point);
            }
            
            result.put("chartData", finalChartData);
            result.put("symbols", symbols.stream().map(s -> s.replace(".NS", "")).collect(Collectors.toList()));
            comparisonCache.put(cacheKey, new CacheEntry(result));
        }
        return result;
    }
}
