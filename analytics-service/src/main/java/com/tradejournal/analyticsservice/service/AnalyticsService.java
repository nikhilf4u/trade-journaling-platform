package com.tradejournal.analyticsservice.service;

import com.tradejournal.analyticsservice.repository.AnalyticsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnalyticsService {

    private final AnalyticsRepository analyticsRepository;

    // ============================================================
    // HELPERS — normalize JPA return types before caching
    // ============================================================
    private Map<String, Object> normalizeMap(Map<String, Object> raw) {
        if (raw == null) return new HashMap<>();
        return new LinkedHashMap<>(raw);
    }

    private List<Map<String, Object>> normalizeList(List<Map<String, Object>> raw) {
        if (raw == null) return new ArrayList<>();
        List<Map<String, Object>> result = new ArrayList<>(raw.size());
        for (Map<String, Object> item : raw) {
            result.add(new LinkedHashMap<>(item));
        }
        return result;
    }

    // ============================================================
    // SUMMARY STATS
    // ============================================================
    @Cacheable(value = "summaryStats", key = "#userId")
    public Map<String, Object> getSummaryStats(Long userId) {
        log.info("🔍 DB HIT: Fetching summary stats for user {}", userId);
        return normalizeMap(analyticsRepository.getSummaryStats(userId));
    }

    // ============================================================
    // EQUITY CURVE
    // ============================================================
    @Cacheable(value = "equityCurve", key = "#userId")
    public List<Map<String, Object>> getEquityCurve(Long userId) {
        log.info("🔍 DB HIT: Fetching equity curve for user {}", userId);
        return normalizeList(analyticsRepository.getEquityCurve(userId));
    }

    // ============================================================
    // MONTHLY P&L
    // ============================================================
    @Cacheable(value = "monthlyPnl", key = "#userId")
    public List<Map<String, Object>> getMonthlyPnl(Long userId) {
        log.info("🔍 DB HIT: Fetching monthly P&L for user {}", userId);
        return normalizeList(analyticsRepository.getMonthlyPnl(userId));
    }

    // ============================================================
    // MARKET PERFORMANCE
    // ============================================================
    @Cacheable(value = "marketPerformance", key = "#userId")
    public List<Map<String, Object>> getMarketPerformance(Long userId) {
        log.info("🔍 DB HIT: Fetching market performance for user {}", userId);
        return normalizeList(analyticsRepository.getMarketPerformance(userId));
    }

    // ============================================================
    // BIAS PERFORMANCE
    // ============================================================
    @Cacheable(value = "biasPerformance", key = "#userId")
    public List<Map<String, Object>> getBiasPerformance(Long userId) {
        log.info("🔍 DB HIT: Fetching bias performance for user {}", userId);
        return normalizeList(analyticsRepository.getBiasPerformance(userId));
    }

    // ============================================================
    // MAX DRAWDOWN
    // ============================================================
    @Cacheable(value = "maxDrawdown", key = "#userId")
    public Map<String, Object> getMaxDrawdown(Long userId) {
        log.info("🔍 DB HIT: Fetching max drawdown for user {}", userId);
        return normalizeMap(analyticsRepository.getMaxDrawdown(userId));
    }

    // ============================================================
    // STOP LOSS ADHERENCE
    // ============================================================
    @Cacheable(value = "stopLossAdherence", key = "#userId")
    public Map<String, Object> getStopLossAdherence(Long userId) {
        log.info("🔍 DB HIT: Fetching stop-loss adherence for user {}", userId);
        return normalizeMap(analyticsRepository.getStopLossAdherence(userId));
    }

    // ============================================================
    // PLANNED R:R
    // ============================================================
    @Cacheable(value = "plannedRR", key = "#userId")
    public Map<String, Object> getPlannedRR(Long userId) {
        log.info("🔍 DB HIT: Fetching planned R:R for user {}", userId);
        return normalizeMap(analyticsRepository.getPlannedRR(userId));
    }

    // ============================================================
    // RISK-ADJUSTED RATIOS
    // ============================================================
    @Cacheable(value = "sharpeRatio", key = "#userId")
    public Map<String, Object> getSharpeRatio(Long userId) {
        log.info("🔍 DB HIT: Fetching Sharpe ratio for user {}", userId);
        return normalizeMap(analyticsRepository.getSharpeRatio(userId));
    }

    @Cacheable(value = "sortinoRatio", key = "#userId")
    public Map<String, Object> getSortinoRatio(Long userId) {
        log.info("🔍 DB HIT: Fetching Sortino ratio for user {}", userId);
        return normalizeMap(analyticsRepository.getSortinoRatio(userId));
    }

    @Cacheable(value = "calmarRatio", key = "#userId")
    public Map<String, Object> getCalmarRatio(Long userId) {
        log.info("🔍 DB HIT: Fetching Calmar ratio for user {}", userId);
        return normalizeMap(analyticsRepository.getCalmarRatio(userId));
    }

    // ============================================================
    // R-MULTIPLE
    // ============================================================
    @Cacheable(value = "rMultipleStats", key = "#userId")
    public Map<String, Object> getRMultipleStats(Long userId) {
        log.info("🔍 DB HIT: Fetching R-Multiple stats for user {}", userId);
        return normalizeMap(analyticsRepository.getRMultipleStats(userId));
    }

    @Cacheable(value = "rMultipleDistribution", key = "#userId")
    public List<Map<String, Object>> getRMultipleDistribution(Long userId) {
        log.info("🔍 DB HIT: Fetching R-Multiple distribution for user {}", userId);
        return normalizeList(analyticsRepository.getRMultipleDistribution(userId));
    }

    // ============================================================
    // STREAKS
    // ============================================================
    @Cacheable(value = "streakStats", key = "#userId")
    public Map<String, Object> getStreakStats(Long userId) {
        log.info("🔍 DB HIT: Fetching streak stats for user {}", userId);
        return normalizeMap(analyticsRepository.getStreakStats(userId));
    }

    // ============================================================
    // DAY-OF-WEEK PERFORMANCE
    // ============================================================
    @Cacheable(value = "dayOfWeekPerformance", key = "#userId")
    public List<Map<String, Object>> getDayOfWeekPerformance(Long userId) {
        log.info("🔍 DB HIT: Fetching day-of-week performance for user {}", userId);
        return normalizeList(analyticsRepository.getDayOfWeekPerformance(userId));
    }

    // ============================================================
    // TARGET HIT STATS
    // ============================================================
    @Cacheable(value = "targetHitStats", key = "#userId")
    public Map<String, Object> getTargetHitStats(Long userId) {
        log.info("🔍 DB HIT: Fetching target hit stats for user {}", userId);
        return normalizeMap(analyticsRepository.getTargetHitStats(userId));
    }

    // ============================================================
    // MISSED R ANALYSIS
    // ============================================================
    @Cacheable(value = "missedRAnalysis", key = "#userId")
    public Map<String, Object> getMissedRAnalysis(Long userId) {
        log.info("🔍 DB HIT: Fetching missed R analysis for user {}", userId);
        return normalizeMap(analyticsRepository.getMissedRAnalysis(userId));
    }

    // ============================================================
    // MFE vs TARGET
    // ============================================================
    @Cacheable(value = "mfeVsTarget", key = "#userId")
    public Map<String, Object> getMfeVsTarget(Long userId) {
        log.info("🔍 DB HIT: Fetching MFE vs Target for user {}", userId);
        return normalizeMap(analyticsRepository.getMfeVsTarget(userId));
    }

    // ============================================================
    // CAPTURE RATIO
    // ============================================================
    @Cacheable(value = "captureRatio", key = "#userId")
    public Map<String, Object> getCaptureRatio(Long userId) {
        log.info("🔍 DB HIT: Fetching capture ratio for user {}", userId);
        return normalizeMap(analyticsRepository.getCaptureRatio(userId));
    }

    // ============================================================
    // BEHAVIORAL METRICS
    // ============================================================
    @Cacheable(value = "overtradingStats", key = "#userId")
    public Map<String, Object> getOvertradingStats(Long userId) {
        log.info("🔍 DB HIT: Overtrading stats for user {}", userId);
        return normalizeMap(analyticsRepository.getOvertradingStats(userId));
    }

    @Cacheable(value = "riskConsistency", key = "#userId")
    public Map<String, Object> getRiskConsistency(Long userId) {
        log.info("🔍 DB HIT: Risk consistency for user {}", userId);
        return normalizeMap(analyticsRepository.getRiskConsistency(userId));
    }

    @Cacheable(value = "exitDiscipline", key = "#userId")
    public Map<String, Object> getExitDiscipline(Long userId) {
        log.info("🔍 DB HIT: Exit discipline for user {}", userId);
        return normalizeMap(analyticsRepository.getExitDiscipline(userId));
    }

    @Cacheable(value = "revengeTrading", key = "#userId")
    public Map<String, Object> getRevengeTrading(Long userId) {
        log.info("🔍 DB HIT: Revenge trading for user {}", userId);
        return normalizeMap(analyticsRepository.getRevengeTrading(userId));
    }

    // ============================================================
    // MAE ANALYSIS
    // ============================================================
    @Cacheable(value = "maeStats", key = "#userId")
    public Map<String, Object> getMaeStats(Long userId) {
        log.info("🔍 DB HIT: MAE stats for user {}", userId);
        return normalizeMap(analyticsRepository.getMaeStats(userId));
    }

    @Cacheable(value = "optimalStopSuggestion", key = "#userId")
    public Map<String, Object> getOptimalStopSuggestion(Long userId) {
        log.info("🔍 DB HIT: Optimal stop suggestion for user {}", userId);
        return normalizeMap(analyticsRepository.getOptimalStopSuggestion(userId));
    }

    // ============================================================
    // DISCIPLINE SCORE (composite)
    // ============================================================
    public Map<String, Object> getDisciplineScore(Long userId) {
        Map<String, Object> result = new HashMap<>();
        try {
            Map<String, Object> sla = getStopLossAdherence(userId);
            double stoplossAdherence = toDouble(sla.get("adherence_percentage"));

            Map<String, Object> ed = getExitDiscipline(userId);
            double totalExits = toDouble(ed.get("total_trades"));
            double hitTarget = toDouble(ed.get("hit_target"));
            double hitStoploss = toDouble(ed.get("hit_stoploss"));
            double exitDiscipline = totalExits > 0
                    ? ((hitTarget + hitStoploss) / totalExits) * 100.0 : 0;

            Map<String, Object> rc = getRiskConsistency(userId);
            double avgRisk = toDouble(rc.get("avg_risk"));
            double stddev = toDouble(rc.get("risk_stddev"));
            double riskConsistency = (avgRisk > 0 && stddev >= 0)
                    ? Math.max(0, 100 - (stddev / avgRisk) * 100.0) : 100;

            Map<String, Object> os = getOvertradingStats(userId);
            double totalDays = toDouble(os.get("total_trading_days"));
            double overtradingDays = toDouble(os.get("overtrading_days"));
            double overtradingScore = totalDays > 0
                    ? ((totalDays - overtradingDays) / totalDays) * 100.0 : 100;

            Map<String, Object> rt = getRevengeTrading(userId);
            double trades = toDouble(getSummaryStats(userId).get("total_trades"));
            double revengeTrades = toDouble(rt.get("trades_within_30min_after_loss"))
                    + toDouble(rt.get("size_up_after_loss"));
            double revengeScore = trades > 0
                    ? Math.max(0, 100 - (revengeTrades / trades) * 100.0) : 100;

            double composite = (stoplossAdherence * 0.30) + (exitDiscipline * 0.30)
                    + (riskConsistency * 0.20) + (overtradingScore * 0.10)
                    + (revengeScore * 0.10);

            result.put("discipline_score", Math.round(composite * 10.0) / 10.0);
            result.put("stoploss_adherence_score", Math.round(stoplossAdherence * 10.0) / 10.0);
            result.put("exit_discipline_score", Math.round(exitDiscipline * 10.0) / 10.0);
            result.put("risk_consistency_score", Math.round(riskConsistency * 10.0) / 10.0);
            result.put("overtrading_score", Math.round(overtradingScore * 10.0) / 10.0);
            result.put("revenge_trading_score", Math.round(revengeScore * 10.0) / 10.0);

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

    // ============================================================
    // CALENDAR DATA
    // ============================================================
    @Cacheable(value = "calendarData", key = "#userId + ':' + #year + ':' + #month")
    public List<Map<String, Object>> getCalendarData(Long userId, int year, int month) {
        log.info("🔍 DB HIT: Calendar data for user {} ({}/{})", userId, year, month);

        LocalDate startDate = LocalDate.of(year, month, 1);
        LocalDate endDate = startDate.plusMonths(1);
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

        List<Map<String, Object>> raw = analyticsRepository.getCalendarData(
                userId,
                startDate.atStartOfDay().format(fmt),
                endDate.atStartOfDay().format(fmt)
        );
        return normalizeList(raw);
    }

    // ============================================================
    // PER-TRADE MFE ANALYSIS
    // ============================================================
    public Map<String, Object> getTradeMfeAnalysis(Long userId, Long tradeId) {
        log.info("🔍 DB HIT: MFE analysis for trade {} (user {})", tradeId, userId);
        return normalizeMap(analyticsRepository.getTradeMfeAnalysis(userId, tradeId));
    }

    @Cacheable(value = "missedTradeComparison", key = "#userId")
    public Map<String, Object> getMissedTradeComparison(Long userId) {
        log.info("🔍 DB HIT: Missed trade comparison for user {}", userId);
        return normalizeMap(analyticsRepository.getMissedTradeComparison(userId));
    }

    @Cacheable(value = "missedReasonBreakdown", key = "#userId")
    public List<Map<String, Object>> getMissedReasonBreakdown(Long userId) {
        log.info("🔍 DB HIT: Missed reason breakdown for user {}", userId);
        return normalizeList(analyticsRepository.getMissedReasonBreakdown(userId));
    }

    @Cacheable(value = "missedConfidenceBreakdown", key = "#userId")
    public List<Map<String, Object>> getMissedConfidenceBreakdown(Long userId) {
        log.info("🔍 DB HIT: Missed confidence breakdown for user {}", userId);
        return normalizeList(analyticsRepository.getMissedConfidenceBreakdown(userId));
    }

    // ============================================================
    // FULL DASHBOARD
    // ============================================================
    public Map<String, Object> getDashboard(Long userId) {
        Map<String, Object> dashboard = new HashMap<>();

        Map<String, Object> summary = new HashMap<>(getSummaryStats(userId));
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
        summary.putAll(getTargetHitStats(userId));
        summary.putAll(getMissedRAnalysis(userId));
        summary.putAll(getMfeVsTarget(userId));
        summary.putAll(getMaeStats(userId));
        summary.putAll(getOptimalStopSuggestion(userId));
        summary.putAll(getMissedTradeComparison(userId));

        dashboard.put("summary", summary);
        dashboard.put("equityCurve", getEquityCurve(userId));
        dashboard.put("monthlyPnl", getMonthlyPnl(userId));
        dashboard.put("marketPerformance", getMarketPerformance(userId));
        dashboard.put("biasPerformance", getBiasPerformance(userId));
        dashboard.put("rMultipleDistribution", getRMultipleDistribution(userId));
        dashboard.put("dayOfWeekPerformance", getDayOfWeekPerformance(userId));
        dashboard.put("missedReasonBreakdown", getMissedReasonBreakdown(userId));
        dashboard.put("missedConfidenceBreakdown", getMissedConfidenceBreakdown(userId));

        return dashboard;
    }

    // ============================================================
    // CACHE INVALIDATION
    // ============================================================
    @CacheEvict(
            value = {
                    "summaryStats", "equityCurve", "monthlyPnl", "marketPerformance",
                    "biasPerformance", "maxDrawdown", "stopLossAdherence", "plannedRR",
                    "sharpeRatio", "sortinoRatio", "calmarRatio",
                    "rMultipleStats", "rMultipleDistribution",
                    "streakStats", "dayOfWeekPerformance",
                    "targetHitStats", "missedRAnalysis", "mfeVsTarget", "captureRatio",
                    "overtradingStats", "riskConsistency", "exitDiscipline", "revengeTrading",
                    "maeStats", "optimalStopSuggestion",
                    "calendarData","missedTradeComparison",
                    "missedReasonBreakdown",
                    "missedConfidenceBreakdown"
            },
            key = "#userId"
    )
    public void invalidateUserCache(Long userId) {
        log.info("🔥 Cache invalidated for user {}", userId);
    }
}