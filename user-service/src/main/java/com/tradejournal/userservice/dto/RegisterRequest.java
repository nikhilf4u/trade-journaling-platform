package com.tradejournal.userservice.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class RegisterRequest {
    public String email;
    public String password;
    public String baseCurrency;
    public BigDecimal totalCapital;
    public BigDecimal riskPerTradePercent;
    public BigDecimal maxDailyLossPercent;
    public BigDecimal maxDrawdownPercent;
}
