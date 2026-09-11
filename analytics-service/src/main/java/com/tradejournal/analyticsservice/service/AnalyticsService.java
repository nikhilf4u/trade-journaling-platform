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
        summary.putAll(getSharpeRatio(userId));
        summary.putAll(getSortinoRatio(userId));
        summary.putAll(getCalmarRatio(userId));
        summary.putAll(getRMultipleStats(userId));
        summary.putAll(getStreakStats(userId));

        summary.putAll(getOvertradingStats(userId));
        summary.putAll(getRiskConsistency(userId));
        summary.putAll(getExitDiscipline(userId));
        summary.putAll(getRevengeTrading(userId));
        summary.putAll(getCaptureRatio(userId));
        summary.putAll(getDisciplineScore(userId));

        dashboard.put("summary", summary);
        dashboard.put("equityCurve", getEquityCurve(userId));
        dashboard.put("monthlyPnl", getMonthlyPnl(userId));
        dashboard.put("marketPerformance", getMarketPerformance(userId));
        dashboard.put("biasPerformance", getBiasPerformance(userId));
        dashboard.put("rMultipleDistribution", getRMultipleDistribution(userId));
        dashboard.put("dayOfWeekPerformance", getDayOfWeekPerformance(userId));
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
                    "summaryStats", "equityCurve", "monthlyPnl", "marketPerformance",
                    "biasPerformance", "maxDrawdown", "stopLossAdherence", "plannedRR",
                    "sharpeRatio", "sortinoRatio", "calmarRatio",
                    "rMultipleStats", "rMultipleDistribution",
                    "streakStats", "dayOfWeekPerformance",
                    // ⭐ Behavioral
                    "overtradingStats", "riskConsistency", "exitDiscipline",
                    "revengeTrading", "captureRatio"
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

    // ================================================================
// 📊 RISK-ADJUSTED RATIOS
// ================================================================
    @Cacheable(value = "sharpeRatio", key = "#userId")
    public Map<String, Object> getSharpeRatio(Long userId) {
        log.info("🔍 DB HIT: Sharpe ratio for user {}", userId);
        Map<String, Object> raw = analyticsRepository.getSharpeRatio(userId);
        return raw != null ? raw : new HashMap<>();
    }

    @Cacheable(value = "sortinoRatio", key = "#userId")
    public Map<String, Object> getSortinoRatio(Long userId) {
        log.info("🔍 DB HIT: Sortino ratio for user {}", userId);
        Map<String, Object> raw = analyticsRepository.getSortinoRatio(userId);
        return raw != null ? raw : new HashMap<>();
    }

    @Cacheable(value = "calmarRatio", key = "#userId")
    public Map<String, Object> getCalmarRatio(Long userId) {
        log.info("🔍 DB HIT: Calmar ratio for user {}", userId);
        Map<String, Object> raw = analyticsRepository.getCalmarRatio(userId);
        return raw != null ? raw : new HashMap<>();
    }

    @Cacheable(value = "rMultipleStats", key = "#userId")
    public Map<String, Object> getRMultipleStats(Long userId) {
        log.info("🔍 DB HIT: R-Multiple stats for user {}", userId);
        Map<String, Object> raw = analyticsRepository.getRMultipleStats(userId);
        return raw != null ? raw : new HashMap<>();
    }

    @Cacheable(value = "rMultipleDistribution", key = "#userId")
    public List<Map<String, Object>> getRMultipleDistribution(Long userId) {
        log.info("🔍 DB HIT: R-Multiple distribution for user {}", userId);
        return analyticsRepository.getRMultipleDistribution(userId);
    }

    @Cacheable(value = "streakStats", key = "#userId")
    public Map<String, Object> getStreakStats(Long userId) {
        log.info("🔍 DB HIT: Streak stats for user {}", userId);
        Map<String, Object> raw = analyticsRepository.getStreakStats(userId);
        return raw != null ? raw : new HashMap<>();
    }

    @Cacheable(value = "dayOfWeekPerformance", key = "#userId")
    public List<Map<String, Object>> getDayOfWeekPerformance(Long userId) {
        log.info("🔍 DB HIT: Day-of-week performance for user {}", userId);
        return analyticsRepository.getDayOfWeekPerformance(userId);
    }

    // ================================================================
// 🚦 BEHAVIORAL METRICS
// ================================================================
    @Cacheable(value = "overtradingStats", key = "#userId")
    public Map<String, Object> getOvertradingStats(Long userId) {
        log.info("🔍 DB HIT: Overtrading stats for user {}", userId);
        Map<String, Object> raw = analyticsRepository.getOvertradingStats(userId);
        return raw != null ? raw : new HashMap<>();
    }

    @Cacheable(value = "riskConsistency", key = "#userId")
    public Map<String, Object> getRiskConsistency(Long userId) {
        log.info("🔍 DB HIT: Risk consistency for user {}", userId);
        Map<String, Object> raw = analyticsRepository.getRiskConsistency(userId);
        return raw != null ? raw : new HashMap<>();
    }

    @Cacheable(value = "exitDiscipline", key = "#userId")
    public Map<String, Object> getExitDiscipline(Long userId) {
        log.info("🔍 DB HIT: Exit discipline for user {}", userId);
        Map<String, Object> raw = analyticsRepository.getExitDiscipline(userId);
        return raw != null ? raw : new HashMap<>();
    }

    @Cacheable(value = "revengeTrading", key = "#userId")
    public Map<String, Object> getRevengeTrading(Long userId) {
        log.info("🔍 DB HIT: Revenge trading for user {}", userId);
        Map<String, Object> raw = analyticsRepository.getRevengeTrading(userId);
        return raw != null ? raw : new HashMap<>();
    }

    @Cacheable(value = "captureRatio", key = "#userId")
    public Map<String, Object> getCaptureRatio(Long userId) {
        log.info("🔍 DB HIT: Capture ratio for user {}", userId);
        Map<String, Object> raw = analyticsRepository.getCaptureRatio(userId);
        return raw != null ? raw : new HashMap<>();
    }

    /**
     * Composite Discipline Score (0-100)
     * Weighted average of:
     *  - Stop-loss adherence (30%)
     *  - Exit discipline (30%)
     *  - Risk consistency (20%)
     *  - No overtrading (10%)
     *  - No revenge trading (10%)
     */
    public Map<String, Object> getDisciplineScore(Long userId) {
        Map<String, Object> result = new HashMap<>();

        try {
            // 1. Stop-loss adherence (0-100)
            Map<String, Object> sla = getStopLossAdherence(userId);
            double stoplossAdherence = toDouble(sla.get("adherence_percentage"));

            // 2. Exit discipline — % of trades that hit target or stoploss
            Map<String, Object> ed = getExitDiscipline(userId);
            double totalExits = toDouble(ed.get("total_trades"));
            double hitTarget = toDouble(ed.get("hit_target"));
            double hitStoploss = toDouble(ed.get("hit_stoploss"));
            double exitDiscipline = totalExits > 0
                    ? ((hitTarget + hitStoploss) / totalExits) * 100.0
                    : 0;

            // 3. Risk consistency — lower stddev relative to avg = higher score
            Map<String, Object> rc = getRiskConsistency(userId);
            double avgRisk = toDouble(rc.get("avg_risk"));
            double stddev = toDouble(rc.get("risk_stddev"));
            double riskConsistency = (avgRisk > 0 && stddev >= 0)
                    ? Math.max(0, 100 - (stddev / avgRisk) * 100.0)
                    : 100;

            // 4. Overtrading — % of days that were NOT overtrading
            Map<String, Object> os = getOvertradingStats(userId);
            double totalDays = toDouble(os.get("total_trading_days"));
            double overtradingDays = toDouble(os.get("overtrading_days"));
            double overtradingScore = totalDays > 0
                    ? ((totalDays - overtradingDays) / totalDays) * 100.0
                    : 100;

            // 5. Revenge trading — % of trades that were NOT revenge
            Map<String, Object> rt = getRevengeTrading(userId);
            double trades = toDouble(getSummaryStats(userId).get("total_trades"));
            double revengeTrades = toDouble(rt.get("trades_within_30min_after_loss"))
                    + toDouble(rt.get("size_up_after_loss"));
            double revengeScore = trades > 0
                    ? Math.max(0, 100 - (revengeTrades / trades) * 100.0)
                    : 100;

            // Weighted composite
            double composite = (stoplossAdherence * 0.30)
                    + (exitDiscipline * 0.30)
                    + (riskConsistency * 0.20)
                    + (overtradingScore * 0.10)
                    + (revengeScore * 0.10);

            result.put("discipline_score", Math.round(composite * 10.0) / 10.0);
            result.put("stoploss_adherence_score", Math.round(stoplossAdherence * 10.0) / 10.0);
            result.put("exit_discipline_score", Math.round(exitDiscipline * 10.0) / 10.0);
            result.put("risk_consistency_score", Math.round(riskConsistency * 10.0) / 10.0);
            result.put("overtrading_score", Math.round(overtradingScore * 10.0) / 10.0);
            result.put("revenge_trading_score", Math.round(revengeScore * 10.0) / 10.0);

            // Rating
            String rating;
            if (composite >= 85) rating = "EXCELLENT";
            else if (composite >= 70) rating = "GOOD";
            else if (composite >= 50) rating = "FAIR";
            else rating = "NEEDS_WORK";
            result.put("rating", rating);

        } catch (Exception e) {
            log.error("Failed to compute discipline score for user {}: {}", userId, e.getMessage());
            result.put("discipline_score", 0);
            result.put("rating", "UNKNOWN");
        }

        return result;
    }

    private double toDouble(Object val) {
        if (val == null) return 0;
        if (val instanceof Number) return ((Number) val).doubleValue();
        try {
            return Double.parseDouble(val.toString());
        } catch (NumberFormatException e) {
            return 0;
        }
    }
}