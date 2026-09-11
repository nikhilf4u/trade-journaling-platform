package com.tradejournal.analyticsservice.repository;

import com.tradejournal.analyticsservice.entity.Trade;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

@Repository
public interface AnalyticsRepository extends JpaRepository<Trade, Long> {

    // ================================================================
    // 🎯 SUMMARY STATS — Accuracy, R:R, Profit Factor, Expectancy
    // ================================================================
    @Query(value = """
        SELECT 
            COUNT(*) AS total_trades,
            COALESCE(SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END), 0) AS winning_trades,
            COALESCE(SUM(CASE WHEN pnl < 0 THEN 1 ELSE 0 END), 0) AS losing_trades,
            
            -- Accuracy (% winning trades)
            CASE 
                WHEN COUNT(*) = 0 THEN 0 
                ELSE ROUND(SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2)
            END AS accuracy,
            
            -- Total P&L
            COALESCE(SUM(pnl), 0) AS total_pnl,
            
            -- Average P&L per trade
            COALESCE(AVG(pnl), 0) AS avg_pnl,
            
            -- Average Win
            COALESCE(AVG(CASE WHEN pnl > 0 THEN pnl END), 0) AS avg_win,
            
            -- Average Loss
            COALESCE(AVG(CASE WHEN pnl < 0 THEN pnl END), 0) AS avg_loss,
            
            -- Risk/Reward Ratio = Avg Win / |Avg Loss|
            CASE 
                WHEN COALESCE(AVG(CASE WHEN pnl < 0 THEN pnl END), 0) = 0 THEN 0
                ELSE ROUND(
                    COALESCE(AVG(CASE WHEN pnl > 0 THEN pnl END), 0) / 
                    ABS(AVG(CASE WHEN pnl < 0 THEN pnl END)),
                    2
                )
            END AS risk_reward_ratio,
            
            -- Profit Factor = Sum(Wins) / |Sum(Losses)|
            CASE 
                WHEN COALESCE(SUM(CASE WHEN pnl < 0 THEN ABS(pnl) END), 0) = 0 THEN 0
                ELSE ROUND(
                    COALESCE(SUM(CASE WHEN pnl > 0 THEN pnl END), 0) / 
                    NULLIF(SUM(CASE WHEN pnl < 0 THEN ABS(pnl) END), 0),
                    2
                )
            END AS profit_factor,
            
            -- Expectancy = (WinRate × AvgWin) - (LossRate × |AvgLoss|)
            CASE 
                WHEN COUNT(*) = 0 THEN 0
                ELSE ROUND(
                    (SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END) * 1.0 / COUNT(*)) * 
                    COALESCE(AVG(CASE WHEN pnl > 0 THEN pnl END), 0) -
                    (SUM(CASE WHEN pnl < 0 THEN 1 ELSE 0 END) * 1.0 / COUNT(*)) * 
                    ABS(COALESCE(AVG(CASE WHEN pnl < 0 THEN pnl END), 0)),
                    2
                )
            END AS expectancy
        FROM trades
        WHERE user_id = :userId
        """, nativeQuery = true)
    Map<String, Object> getSummaryStats(@Param("userId") Long userId);

    // ================================================================
    // 📈 EQUITY CURVE — Cumulative P&L over time (Window Function)
    // ================================================================
    @Query(value = """
        SELECT 
            entry_date AS date,
            SUM(pnl) OVER (ORDER BY entry_date, id) AS cumulative_pnl
        FROM trades
        WHERE user_id = :userId
        ORDER BY entry_date, id
        """, nativeQuery = true)
    List<Map<String, Object>> getEquityCurve(@Param("userId") Long userId);

    // ================================================================
    // 📊 MONTHLY P&L — Grouped by month
    // ================================================================
    @Query(value = """
        SELECT 
            TO_CHAR(entry_date, 'YYYY-MM') AS month,
            COALESCE(SUM(pnl), 0) AS monthly_pnl,
            COUNT(*) AS trade_count
        FROM trades
        WHERE user_id = :userId
        GROUP BY TO_CHAR(entry_date, 'YYYY-MM')
        ORDER BY month
        """, nativeQuery = true)
    List<Map<String, Object>> getMonthlyPnl(@Param("userId") Long userId);

    // ================================================================
    // 🌍 MARKET PERFORMANCE — Grouped by market
    // ================================================================
    @Query(value = """
        SELECT 
            market,
            COUNT(*) AS total_trades,
            COALESCE(SUM(pnl), 0) AS total_pnl,
            ROUND(COALESCE(AVG(pnl), 0), 2) AS avg_pnl,
            ROUND(
                SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 
                2
            ) AS win_rate
        FROM trades
        WHERE user_id = :userId
        GROUP BY market
        ORDER BY total_pnl DESC
        """, nativeQuery = true)
    List<Map<String, Object>> getMarketPerformance(@Param("userId") Long userId);

    // ================================================================
    // 🎯 BIAS PERFORMANCE — Grouped by higher-timeframe bias
    // ================================================================
    @Query(value = """
        SELECT 
            COALESCE(long_time_frame_bias, 'UNKNOWN') AS bias,
            COUNT(*) AS trade_count,
            COALESCE(SUM(pnl), 0) AS total_pnl,
            ROUND(
                SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 
                2
            ) AS win_rate
        FROM trades
        WHERE user_id = :userId
        GROUP BY long_time_frame_bias
        ORDER BY total_pnl DESC
        """, nativeQuery = true)
    List<Map<String, Object>> getBiasPerformance(@Param("userId") Long userId);

    // ================================================================
    // 📉 MAX DRAWDOWN — Worst peak-to-trough decline
    // ================================================================
    @Query(value = """
        WITH equity AS (
            SELECT 
                entry_date,
                SUM(pnl) OVER (ORDER BY entry_date, id) AS cum_pnl
            FROM trades
            WHERE user_id = :userId
        ),
        peaks AS (
            SELECT 
                cum_pnl,
                MAX(cum_pnl) OVER (ORDER BY entry_date, cum_pnl) AS running_peak
            FROM equity
        )
        SELECT 
            COALESCE(MAX(running_peak - cum_pnl), 0) AS max_drawdown
        FROM peaks
        """, nativeQuery = true)
    Map<String, Object> getMaxDrawdown(@Param("userId") Long userId);

    // ================================================================
    // 🛑 STOP LOSS ADHERENCE — % of trades with stoploss set
    // ================================================================
    @Query(value = """
        SELECT 
            COUNT(*) AS total_trades,
            SUM(CASE WHEN stoploss IS NOT NULL THEN 1 ELSE 0 END) AS trades_with_stoploss,
            CASE 
                WHEN COUNT(*) = 0 THEN 0
                ELSE ROUND(
                    SUM(CASE WHEN stoploss IS NOT NULL THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 
                    2
                )
            END AS adherence_percentage
        FROM trades
        WHERE user_id = :userId
        """, nativeQuery = true)
    Map<String, Object> getStopLossAdherence(@Param("userId") Long userId);

    // ================================================================
// 🎯 PLANNED R:R — Avg planned risk/reward from stoploss + target
// ================================================================
    @Query(value = """
    SELECT 
        COUNT(*) AS total_trades,
        SUM(CASE WHEN stoploss IS NOT NULL AND target IS NOT NULL THEN 1 ELSE 0 END) 
            AS trades_with_plan,
        ROUND(AVG(
            CASE 
                WHEN stoploss IS NOT NULL 
                AND target IS NOT NULL 
                AND ABS(entry_price - stoploss) > 0
                THEN ABS(target - entry_price) / ABS(entry_price - stoploss)
            END
        ), 2) AS avg_planned_rr
    FROM trades
    WHERE user_id = :userId
    """, nativeQuery = true)
    Map<String, Object> getPlannedRR(@Param("userId") Long userId);
}