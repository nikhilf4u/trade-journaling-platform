package com.tradejournal.tradeservice.repository;

import com.tradejournal.tradeservice.entity.Trade;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TradeRepository extends JpaRepository<Trade, Long> {
    List<Trade> findByUserIdOrderByEntryDateDesc(Long userId);
    List<Trade> findByUserIdAndMarketOrderByEntryDateDesc(Long userId, String market);
    List<Trade> findByUserIdAndIsMissedOrderByEntryDateDesc(Long userId, Boolean isMissed);
    List<Trade> findByUserIdAndMarketAndIsMissedOrderByEntryDateDesc(Long userId, String market, Boolean isMissed);
}