package com.tradejournal.tradeservice.entity;

import com.tradejournal.commonlibrary.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "trades")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = false)
public class Trade extends BaseEntity {

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String market;

    @Column(nullable = false)
    private String symbol;

    private String instrumentType;

    @Column(nullable = false)
    private String direction;

    @Column(nullable = false)
    private BigDecimal entryPrice;

    @Column(nullable = false)
    private BigDecimal exitPrice;

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false)
    private String quoteCurrency;

    // ⭐ NEW: Stop Loss
    @Column(precision = 15, scale = 2)
    private BigDecimal stoploss;

    // ⭐ Target (Take Profit) — the price at which you plan to exit
    @Column(precision = 15, scale = 2)
    private BigDecimal target;

    @Column(name = "mfe")
    private BigDecimal mfe;

    @Column(name = "mae")
    private BigDecimal mae;

    // ⭐ NEW: Long-Time Frame Bias (higher timeframe view)
    @Column(length = 30)
    private String longTimeFrameBias;

    // ⭐ Auto-calculated P&L (PostgreSQL GENERATED column)
    // ⭐ Direction-aware P&L — computed by PostgreSQL
    @Column(
            columnDefinition = """
        DECIMAL(15,2) GENERATED ALWAYS AS (
            CASE 
                WHEN direction = 'BUY'  THEN (exit_price - entry_price) * quantity
                WHEN direction = 'SELL' THEN (entry_price - exit_price) * quantity
                ELSE 0
            END
        ) STORED
    """,
            insertable = false,
            updatable = false
    )
    private BigDecimal pnl;

    @Column(nullable = false)
    private Instant entryDate;

    @Column(nullable = false)
    private Instant exitDate;

    @Column(length = 500)
    private String notes;

    // ⭐ NEW: Multiple screenshots via One-to-Many
    @OneToMany(mappedBy = "trade", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @Builder.Default
    private List<TradeScreenshot> screenshots = new ArrayList<>();
}