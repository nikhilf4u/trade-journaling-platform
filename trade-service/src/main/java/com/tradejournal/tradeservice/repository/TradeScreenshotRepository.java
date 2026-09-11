package com.tradejournal.tradeservice.repository;

import com.tradejournal.tradeservice.entity.TradeScreenshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TradeScreenshotRepository extends JpaRepository<TradeScreenshot, Long> {
    List<TradeScreenshot> findByTradeId(Long tradeId);
}