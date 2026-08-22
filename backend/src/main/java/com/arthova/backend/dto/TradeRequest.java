package com.arthova.backend.dto;

import com.arthova.backend.entity.AssetType;
import com.arthova.backend.entity.TransactionType;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class TradeRequest {
    private AssetType assetType;
    private String symbol;
    private String name;
    private BigDecimal quantity;
    private BigDecimal pricePerUnit;
    private TransactionType transactionType;
    private String metadata;

    /**
     * The date the user actually purchased or sold this asset.
     * This may be in the past (backdated). If null, defaults to today.
     * Used for CAGR, XIRR, and STCG/LTCG tax classification.
     */
    private LocalDate purchaseDate;
}
