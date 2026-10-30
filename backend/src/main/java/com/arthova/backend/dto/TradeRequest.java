package com.arthova.backend.dto;

import com.arthova.backend.entity.AssetType;
import com.arthova.backend.entity.TransactionType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class TradeRequest {

    @NotNull(message = "Asset type is required")
    private AssetType assetType;

    private String symbol;
    private String name;

    @NotNull(message = "Quantity is required")
    @Positive(message = "Quantity must be strictly greater than zero")
    private BigDecimal quantity;

    @NotNull(message = "Price per unit is required")
    @Positive(message = "Price per unit must be strictly greater than zero")
    private BigDecimal pricePerUnit;

    @NotNull(message = "Transaction type is required (buy or sell)")
    private TransactionType transactionType;

    private String metadata;

    /**
     * The date the user actually purchased or sold this asset.
     * This may be in the past (backdated). If null, defaults to today.
     * Used for CAGR, XIRR, and STCG/LTCG tax classification.
     */
    private LocalDate purchaseDate;
}
