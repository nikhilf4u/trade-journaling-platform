package com.tradejournal.userservice.entity;

import com.tradejournal.commonlibrary.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User extends BaseEntity {

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String passwordHash;

    @Column(nullable = false)
    private String baseCurrency;

    @Column(nullable = false)
    private BigDecimal totalCapital;

    @Column(nullable = false)
    private BigDecimal riskPerTradePercent;

    @Column(nullable = false)
    private BigDecimal maxDailyLossPercent;

    @Column(nullable = false)
    private BigDecimal maxDrawdownPercent;

    @Column(unique = true)
    private String resetToken;

    private Instant resetTokenExpiry;

}