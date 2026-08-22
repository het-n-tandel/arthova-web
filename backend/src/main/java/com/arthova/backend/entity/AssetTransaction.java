package com.arthova.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "asset_transactions")
public class AssetTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "holding_id", nullable = false)
    private UUID holdingId;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false)
    private TransactionType type;

    @Column(nullable = false)
    private BigDecimal quantity;

    @Column(name = "price_per_unit", nullable = false)
    private BigDecimal pricePerUnit;

    @Column(nullable = false)
    private BigDecimal amount;

    /**
     * The actual date the user purchased/sold the asset.
     * Users can backdate this to reflect their real investment history.
     * This is used for STCG/LTCG tax classification and CAGR calculations.
     */
    @Column(name = "executed_at", nullable = false)
    private LocalDateTime executedAt;
}
