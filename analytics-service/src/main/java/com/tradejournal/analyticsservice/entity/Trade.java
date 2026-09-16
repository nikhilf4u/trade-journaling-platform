package com.tradejournal.analyticsservice.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Read-only entity for the Analytics Service.
 * Maps to the same `trades` table owned by Trade Service.
 * The Analytics Service never writes to this table.
 */
@Entity
@Table(name = "trades")
@Data
public class Trade {

    @Id
    private Long id;

    @Column(name = "user_id")
    private Long userId;

    private String market;

    private String symbol;

    @Column(name = "instrument_type")
    private String instrumentType;

    private String direction;

    @Column(name = "entry_price")
    private BigDecimal entryPrice;

    @Column(name = "exit_price")
    private BigDecimal exitPrice;

    private Integer quantity;

    @Column(name = "quote_currency")
    private String quoteCurrency;

    // Read-only — PostgreSQL calculates this via GENERATED column
    @Column(insertable = false, updatable = false)
    private BigDecimal pnl;

    @Column(name = "entry_date")
    private Instant entryDate;

    @Column(name = "exit_date")
    private Instant exitDate;

    private BigDecimal stoploss;

    private BigDecimal target;

    @Column(name = "long_time_frame_bias")
    private String longTimeFrameBias;

    @Column(length = 500)
    private String notes;

    @Column(name = "is_missed")
    private Boolean isMissed;

    @Column(name = "missed_reason_type")
    private String missedReasonType;

    @Column(name = "confidence_level")
    private Integer confidenceLevel;
}