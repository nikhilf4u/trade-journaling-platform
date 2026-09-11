package com.tradejournal.tradeservice.entity;

import com.tradejournal.commonlibrary.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "trade_screenshots")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = false)
public class TradeScreenshot extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trade_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore  // Prevents infinite recursion in JSON
    private Trade trade;

    @Column(nullable = false, length = 500)
    private String url;

    @Column(length = 100)
    private String label;  // Optional: "Entry", "Exit", "Analysis"
}