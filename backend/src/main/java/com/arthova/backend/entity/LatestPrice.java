package com.arthova.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "latest_prices")
public class LatestPrice {

    @Id
    private String symbol;

    @Column(name = "latest_price", nullable = false)
    private BigDecimal latestPrice;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
