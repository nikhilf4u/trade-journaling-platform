package com.tradejournal.analyticsservice.service;

import com.tradejournal.analyticsservice.repository.AnalyticsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnalyticsService {

    private final AnalyticsRepository analyticsRepository;

    // ================================================================
    // 📊 SUMMARY STATS (Accuracy, R:R, Profit Factor, Expectancy)
    // ================================================================
    @Cacheable(value = "summaryStats", key = "#userId")
    public Map<String, Object> getSummaryStats(Long userId) {
        log.info("🔍 DB HIT: Fetching summary stats for user {}", userId);
        Map<String, Object> raw = analyticsRepository.getSummaryStats(userId);
        return raw != null ? raw : new HashMap<>();
    }

    // ================================================================
    // 📈 EQUITY CURVE
    // ================================================================
    @Cacheable(value = "equityCurve", key = "#userId")
    public List<Map<String, Object>> getEquityCurve(Long userId) {
        log.info("🔍 DB HIT: Fetching equity curve for user {}", userId);
        return analyticsRepository.getEquityCurve(userId);
    }

    // ================================================================
    // 📊 MONTHLY P&L
    // ================================================================
    @Cacheable(value = "monthlyPnl", key = "#userId")
    public List<Map<String, Object>> getMonthlyPnl(Long userId) {
        log.info("🔍 DB HIT: Fetching monthly P&L for user {}", userId);
        return analyticsRepository.getMonthlyPnl(userId);
    }

    // ================================================================
    // 🌍 MARKET PERFORMANCE
    // ================================================================
    @Cacheable(value = "marketPerformance", key = "#userId")
    public List<Map<String, Object>> getMarketPerformance(Long userId) {
        log.info("🔍 DB HIT: Fetching market performance for user {}", userId);
        return analyticsRepository.getMarketPerformance(userId);
    }

    // ================================================================
    // 🎯 BIAS PERFORMANCE
    // ================================================================
    @Cacheable(value = "biasPerformance", key = "#userId")
    public List<Map<String, Object>> getBiasPerformance(Long userId) {
        log.info("🔍 DB HIT: Fetching bias performance for user {}", userId);
        return analyticsRepository.getBiasPerformance(userId);
    }

    // ================================================================
    // 📉 MAX DRAWDOWN
    // ================================================================
    @Cacheable(value = "maxDrawdown", key = "#userId")
    public Map<String, Object> getMaxDrawdown(Long userId) {
        log.info("🔍 DB HIT: Fetching max drawdown for user {}", userId);
        Map<String, Object> raw = analyticsRepository.getMaxDrawdown(userId);
        return raw != null ? raw : new HashMap<>();
    }

    // ================================================================
    // 🛑 STOP LOSS ADHERENCE
    // ================================================================
    @Cacheable(value = "stopLossAdherence", key = "#userId")
    public Map<String, Object> getStopLossAdherence(Long userId) {
        log.info("🔍 DB HIT: Fetching stop-loss adherence for user {}", userId);
        Map<String, Object> raw = analyticsRepository.getStopLossAdherence(userId);
        return raw != null ? raw : new HashMap<>();
    }

    // ================================================================
    // 🎯 FULL DASHBOARD — Everything in one call
    // ================================================================
    public Map<String, Object> getDashboard(Long userId) {
        Map<String, Object> dashboard = new HashMap<>();

        Map<String, Object> summary = new HashMap<>(getSummaryStats(userId));
        // Merge in drawdown + adherence so the frontend gets them in one shot
        summary.putAll(getMaxDrawdown(userId));
        summary.putAll(getStopLossAdherence(userId));
        summary.putAll(getPlannedRR(userId));

        dashboard.put("summary", summary);
        dashboard.put("equityCurve", getEquityCurve(userId));
        dashboard.put("monthlyPnl", getMonthlyPnl(userId));
        dashboard.put("marketPerformance", getMarketPerformance(userId));
        dashboard.put("biasPerformance", getBiasPerformance(userId));

        return dashboard;
    }

    // ================================================================
    // 🔥 CACHE INVALIDATION — Called by Kafka consumer
    // ================================================================
    /**
     * Evict all analytics caches for a specific user.
     * Triggered when a trade is created, updated, or deleted.
     */
    @CacheEvict(
            value = {
                    "summaryStats",
                    "equityCurve",
                    "monthlyPnl",
                    "marketPerformance",
                    "biasPerformance",
                    "maxDrawdown",
                    "stopLossAdherence",
                    "plannedRR"
            },
            key = "#userId"
    )
    public void invalidateUserCache(Long userId) {
        log.info("🔥 Cache invalidated for user {}", userId);
    }

    // ================================================================
// 🎯 PLANNED R:R
// ================================================================
    @Cacheable(value = "plannedRR", key = "#userId")
    public Map<String, Object> getPlannedRR(Long userId) {
        log.info("🔍 DB HIT: Fetching planned R:R for user {}", userId);
        Map<String, Object> raw = analyticsRepository.getPlannedRR(userId);
        return raw != null ? raw : new HashMap<>();
    }
}