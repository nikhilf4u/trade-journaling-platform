package com.tradejournal.commonlibrary.event;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TradeLoggedEvent {
    private Long tradeId;
    private Long userId;
    private String symbol;
    private String market;
    private String direction;
    private BigDecimal entryPrice;
    private BigDecimal exitPrice;
    private Integer quantity;
    private BigDecimal pnl;
    private Instant entryDate;
}