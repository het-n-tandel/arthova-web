package com.arthova.backend.service;

import com.arthova.backend.dto.TradeRequest;
import com.arthova.backend.entity.AssetTransaction;
import com.arthova.backend.entity.Holding;
import com.arthova.backend.entity.TransactionType;
import com.arthova.backend.repository.AssetTransactionRepository;
import com.arthova.backend.repository.HoldingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class PortfolioService {

    @Autowired
    private HoldingRepository holdingRepository;

    @Autowired
    private AssetTransactionRepository transactionRepository;

    public List<Holding> getUserHoldings(UUID userId) {
        return holdingRepository.findByUserId(userId);
    }

    @Transactional
    public Holding executeTrade(UUID userId, TradeRequest request) {
        // Resolve the effective purchase date: use user-provided date or default to today
        LocalDate effectivePurchaseDate = request.getPurchaseDate() != null
                ? request.getPurchaseDate()
                : LocalDate.now();

        // Automatic Cash Sweep ONLY applies to market trades (stocks, mutual funds, crypto)
        if (request.getAssetType() == com.arthova.backend.entity.AssetType.stock
                || request.getAssetType() == com.arthova.backend.entity.AssetType.mutual_fund
                || request.getAssetType() == com.arthova.backend.entity.AssetType.crypto) {
            handleCashSweep(userId, request);
        }

        Optional<Holding> existingHolding = holdingRepository.findByUserIdAndSymbol(userId, request.getSymbol());
        Holding holding;

        if (request.getTransactionType() == TransactionType.buy) {
            if (existingHolding.isPresent()) {
                holding = existingHolding.get();
                // Calculate new Weighted Average Cost (WAC)
                BigDecimal oldTotalCost = holding.getAvgCost().multiply(holding.getQuantity());
                BigDecimal newTotalCost = request.getPricePerUnit().multiply(request.getQuantity());
                BigDecimal newQuantity = holding.getQuantity().add(request.getQuantity());
                BigDecimal newAvgCost = newQuantity.compareTo(BigDecimal.ZERO) > 0
                        ? oldTotalCost.add(newTotalCost).divide(newQuantity, 4, RoundingMode.HALF_UP)
                        : request.getPricePerUnit();

                holding.setQuantity(newQuantity);
                holding.setAvgCost(newAvgCost);

                // Keep the earliest purchase date (whichever buy happened first)
                if (holding.getPurchaseDate() == null || effectivePurchaseDate.isBefore(holding.getPurchaseDate())) {
                    holding.setPurchaseDate(effectivePurchaseDate);
                }
            } else {
                holding = new Holding();
                holding.setUserId(userId);
                holding.setAssetType(request.getAssetType());
                holding.setSymbol(request.getSymbol());
                holding.setName(request.getName());
                holding.setQuantity(request.getQuantity());
                holding.setAvgCost(request.getPricePerUnit());
                holding.setMetadata(request.getMetadata() != null ? request.getMetadata() : "{}");
                holding.setPurchaseDate(effectivePurchaseDate);
            }
        } else if (request.getTransactionType() == TransactionType.sell) {
            if (existingHolding.isEmpty()) {
                throw new RuntimeException("Cannot sell an asset you do not own.");
            }
            holding = existingHolding.get();
            if (holding.getQuantity().compareTo(request.getQuantity()) < 0) {
                throw new RuntimeException("Insufficient quantity to sell.");
            }
            BigDecimal newQuantity = holding.getQuantity().subtract(request.getQuantity());
            holding.setQuantity(newQuantity);
        } else {
            throw new IllegalArgumentException("Unsupported transaction type");
        }

        Holding savedHolding = holdingRepository.save(holding);

        // Record the transaction with the user-specified purchase date as executedAt
        AssetTransaction transaction = new AssetTransaction();
        transaction.setHoldingId(savedHolding.getId());
        transaction.setType(request.getTransactionType());
        transaction.setQuantity(request.getQuantity());
        transaction.setPricePerUnit(request.getPricePerUnit());
        transaction.setAmount(request.getQuantity().multiply(request.getPricePerUnit()));
        transaction.setExecutedAt(LocalDateTime.of(effectivePurchaseDate, LocalTime.NOON));
        transactionRepository.save(transaction);

        return savedHolding;
    }

    private void handleCashSweep(UUID userId, TradeRequest request) {
        BigDecimal totalCost = request.getPricePerUnit().multiply(request.getQuantity());
        // Find specifically system "CASH" holding so we never corrupt user's custom cash entries
        Optional<Holding> cashHoldingOpt = holdingRepository.findByUserIdAndSymbol(userId, "CASH");
        Holding cashHolding;

        if (cashHoldingOpt.isEmpty()) {
            cashHolding = new Holding();
            cashHolding.setUserId(userId);
            cashHolding.setAssetType(com.arthova.backend.entity.AssetType.cash);
            cashHolding.setSymbol("CASH");
            cashHolding.setName("Brokerage Cash");
            cashHolding.setQuantity(BigDecimal.ZERO);
            cashHolding.setAvgCost(BigDecimal.ONE);
            cashHolding.setMetadata("{\"type\":\"locker\"}");
        } else {
            cashHolding = cashHoldingOpt.get();
        }

        if (request.getTransactionType() == TransactionType.buy) {
            cashHolding.setQuantity(cashHolding.getQuantity().subtract(totalCost));
        } else if (request.getTransactionType() == TransactionType.sell) {
            cashHolding.setQuantity(cashHolding.getQuantity().add(totalCost));
        }

        holdingRepository.save(cashHolding);
    }
}
