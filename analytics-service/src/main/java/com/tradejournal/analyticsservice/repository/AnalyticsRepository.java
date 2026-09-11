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

    // ================================================================
// 📊 SHARPE RATIO — Risk-adjusted return (higher is better)
// ================================================================
    @Query(value = """
    SELECT 
        ROUND(
            (
                (AVG(pnl) / NULLIF(STDDEV_SAMP(pnl), 0)) * SQRT(COUNT(*))
            )::NUMERIC,
            2
        ) AS sharpe_ratio
    FROM trades
    WHERE user_id = :userId
    """, nativeQuery = true)
    Map<String, Object> getSharpeRatio(@Param("userId") Long userId);
    // ================================================================
// 📊 SORTINO RATIO — Like Sharpe but only penalizes downside
// ================================================================
    @Query(value = """
    SELECT 
        ROUND(
            (
                AVG(pnl) / NULLIF(
                    STDDEV_SAMP(CASE WHEN pnl < 0 THEN pnl END),
                    0
                ) * SQRT(COUNT(*))
            )::NUMERIC,
            2
        ) AS sortino_ratio
    FROM trades
    WHERE user_id = :userId
    """, nativeQuery = true)
    Map<String, Object> getSortinoRatio(@Param("userId") Long userId);

    // ================================================================
// 📊 CALMAR RATIO — Annual return / Max Drawdown
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
    ),
    dd AS (
        SELECT COALESCE(MAX(running_peak - cum_pnl), 0) AS max_drawdown
        FROM peaks
    )
    SELECT 
        ROUND(
            (
                (SELECT COALESCE(SUM(pnl), 0) FROM trades WHERE user_id = :userId) / 
                NULLIF((SELECT max_drawdown FROM dd), 0)
            )::NUMERIC,
            2
        ) AS calmar_ratio
    """, nativeQuery = true)
    Map<String, Object> getCalmarRatio(@Param("userId") Long userId);
    // ================================================================
// 🎯 R-MULTIPLE STATS — Avg, Best, Worst, Count
// ================================================================
    @Query(value = """
    SELECT 
        COUNT(*) AS trades_with_plan,
        ROUND(
            AVG(pnl / NULLIF(ABS(entry_price - stoploss) * quantity, 0))::NUMERIC,
            2
        ) AS avg_r_multiple,
        ROUND(
            MAX(pnl / NULLIF(ABS(entry_price - stoploss) * quantity, 0))::NUMERIC,
            2
        ) AS best_r,
        ROUND(
            MIN(pnl / NULLIF(ABS(entry_price - stoploss) * quantity, 0))::NUMERIC,
            2
        ) AS worst_r
    FROM trades
    WHERE user_id = :userId
        AND stoploss IS NOT NULL
        AND entry_price != stoploss
    """, nativeQuery = true)
    Map<String, Object> getRMultipleStats(@Param("userId") Long userId);
    // ================================================================
// 📊 R-MULTIPLE DISTRIBUTION — Histogram buckets
// ================================================================
// ================================================================
// 📊 R-MULTIPLE DISTRIBUTION — Histogram buckets
// ================================================================
    @Query(value = """
    WITH bucketed AS (
        SELECT 
            CASE 
                WHEN pnl / NULLIF(ABS(entry_price - stoploss) * quantity, 0) < -1 THEN '< -1R'
                WHEN pnl / NULLIF(ABS(entry_price - stoploss) * quantity, 0) < 0 THEN '-1R to 0'
                WHEN pnl / NULLIF(ABS(entry_price - stoploss) * quantity, 0) < 1 THEN '0 to 1R'
                WHEN pnl / NULLIF(ABS(entry_price - stoploss) * quantity, 0) < 2 THEN '1R to 2R'
                WHEN pnl / NULLIF(ABS(entry_price - stoploss) * quantity, 0) < 3 THEN '2R to 3R'
                ELSE '3R+'
            END AS bucket,
            CASE 
                WHEN pnl / NULLIF(ABS(entry_price - stoploss) * quantity, 0) < -1 THEN 1
                WHEN pnl / NULLIF(ABS(entry_price - stoploss) * quantity, 0) < 0 THEN 2
                WHEN pnl / NULLIF(ABS(entry_price - stoploss) * quantity, 0) < 1 THEN 3
                WHEN pnl / NULLIF(ABS(entry_price - stoploss) * quantity, 0) < 2 THEN 4
                WHEN pnl / NULLIF(ABS(entry_price - stoploss) * quantity, 0) < 3 THEN 5
                ELSE 6
            END AS sort_order
        FROM trades
        WHERE user_id = :userId
            AND stoploss IS NOT NULL
            AND entry_price != stoploss
    )
    SELECT 
        bucket,
        COUNT(*) AS count
    FROM bucketed
    GROUP BY bucket, sort_order
    ORDER BY sort_order
    """, nativeQuery = true)
    List<Map<String, Object>> getRMultipleDistribution(@Param("userId") Long userId);

    // ================================================================
// 🔥 STREAK ANALYSIS — Longest win/loss and current streak
// ================================================================
    @Query(value = """
    WITH numbered AS (
        SELECT 
            id,
            entry_date,
            CASE WHEN pnl > 0 THEN 'W' ELSE 'L' END AS result,
            ROW_NUMBER() OVER (ORDER BY entry_date, id) - 
            ROW_NUMBER() OVER (
                PARTITION BY CASE WHEN pnl > 0 THEN 'W' ELSE 'L' END 
                ORDER BY entry_date, id
            ) AS grp
        FROM trades
        WHERE user_id = :userId
    ),
    streaks AS (
        SELECT result, COUNT(*) AS streak_length
        FROM numbered
        GROUP BY result, grp
    )
    SELECT 
        COALESCE(MAX(CASE WHEN result = 'W' THEN streak_length END), 0) 
            AS longest_win_streak,
        COALESCE(MAX(CASE WHEN result = 'L' THEN streak_length END), 0) 
            AS longest_loss_streak
    FROM streaks
    """, nativeQuery = true)
    Map<String, Object> getStreakStats(@Param("userId") Long userId);

    // ================================================================
// 📅 DAY-OF-WEEK PERFORMANCE
// ================================================================
    @Query(value = """
    SELECT 
        TRIM(TO_CHAR(entry_date, 'Day')) AS day_of_week,
        EXTRACT(DOW FROM entry_date) AS dow_num,
        COUNT(*) AS trade_count,
        ROUND(SUM(pnl), 2) AS total_pnl,
        ROUND(AVG(pnl), 2) AS avg_pnl,
        ROUND(
            SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 
            2
        ) AS win_rate
    FROM trades
    WHERE user_id = :userId
    GROUP BY day_of_week, dow_num
    ORDER BY dow_num
    """, nativeQuery = true)
    List<Map<String, Object>> getDayOfWeekPerformance(@Param("userId") Long userId);

    // ================================================================
// 🚦 OVERTRADING ANALYSIS
// ================================================================
    @Query(value = """
    WITH daily_counts AS (
        SELECT 
            DATE(entry_date) AS day,
            COUNT(*) AS trades_per_day
        FROM trades
        WHERE user_id = :userId
        GROUP BY DATE(entry_date)
    ),
    stats AS (
        SELECT 
            AVG(trades_per_day) AS avg_trades_per_day,
            MAX(trades_per_day) AS max_trades_per_day
        FROM daily_counts
    )
    SELECT 
        (SELECT avg_trades_per_day FROM stats) AS avg_trades_per_day,
        (SELECT max_trades_per_day FROM stats) AS max_trades_per_day,
        (SELECT COUNT(*) FROM daily_counts WHERE trades_per_day > 2 * (SELECT avg_trades_per_day FROM stats)) AS overtrading_days,
        (SELECT COUNT(*) FROM daily_counts) AS total_trading_days
    """, nativeQuery = true)
    Map<String, Object> getOvertradingStats(@Param("userId") Long userId);

    // ================================================================
// 🎯 RISK CONSISTENCY ANALYSIS
// (assumes stoploss is set; risk = |entry - stoploss| * qty)
// ================================================================
    @Query(value = """
    WITH risk_calc AS (
        SELECT 
            ABS(entry_price - stoploss) * quantity AS risk_amount
        FROM trades
        WHERE user_id = :userId
            AND stoploss IS NOT NULL
            AND entry_price != stoploss
    )
    SELECT 
        COUNT(*) AS trades_with_risk,
        ROUND(AVG(risk_amount)::NUMERIC, 2) AS avg_risk,
        ROUND(STDDEV_SAMP(risk_amount)::NUMERIC, 2) AS risk_stddev,
        ROUND(MAX(risk_amount)::NUMERIC, 2) AS max_risk,
        ROUND(MIN(risk_amount)::NUMERIC, 2) AS min_risk
    FROM risk_calc
    """, nativeQuery = true)
    Map<String, Object> getRiskConsistency(@Param("userId") Long userId);

    // ================================================================
// 🎯 EXIT DISCIPLINE — Did you exit at target or stoploss?
// Uses 5% tolerance to account for fills/slippage
// ================================================================
    @Query(value = """
    WITH exits AS (
        SELECT 
            id,
            pnl,
            CASE 
                WHEN target IS NOT NULL 
                    AND ABS(exit_price - target) <= 0.05 * ABS(target - entry_price)
                THEN 'HIT_TARGET'
                
                WHEN stoploss IS NOT NULL 
                    AND ABS(exit_price - stoploss) <= 0.05 * ABS(entry_price - stoploss)
                THEN 'HIT_STOPLOSS'
                
                WHEN pnl > 0 THEN 'EARLY_PROFIT'
                WHEN pnl < 0 THEN 'EARLY_LOSS'
                
                ELSE 'OTHER'
            END AS exit_type
        FROM trades
        WHERE user_id = :userId
    )
    SELECT 
        COUNT(*) AS total_trades,
        COUNT(*) FILTER (WHERE exit_type = 'HIT_TARGET') AS hit_target,
        COUNT(*) FILTER (WHERE exit_type = 'HIT_STOPLOSS') AS hit_stoploss,
        COUNT(*) FILTER (WHERE exit_type = 'EARLY_PROFIT') AS early_profit,
        COUNT(*) FILTER (WHERE exit_type = 'EARLY_LOSS') AS early_loss,
        COUNT(*) FILTER (WHERE exit_type = 'OTHER') AS other
    FROM exits
    """, nativeQuery = true)
    Map<String, Object> getExitDiscipline(@Param("userId") Long userId);

    // ================================================================
// 🔥 REVENGE TRADING DETECTOR
// Detects: trading within 30 min of a loss + sizing up after a loss
// ================================================================
    @Query(value = """
    WITH ordered AS (
        SELECT 
            id,
            entry_date,
            quantity,
            pnl,
            LAG(pnl) OVER (ORDER BY entry_date, id) AS prev_pnl,
            LAG(quantity) OVER (ORDER BY entry_date, id) AS prev_qty,
            LAG(exit_date) OVER (ORDER BY entry_date, id) AS prev_exit_date,
            EXTRACT(EPOCH FROM (
                entry_date - LAG(exit_date) OVER (ORDER BY entry_date, id)
            )) / 60.0 AS mins_since_prev
        FROM trades
        WHERE user_id = :userId
    )
    SELECT 
        COUNT(*) FILTER (WHERE prev_pnl < 0 AND mins_since_prev < 30) 
            AS trades_within_30min_after_loss,
        COUNT(*) FILTER (WHERE prev_pnl < 0 AND quantity > 1.5 * prev_qty) 
            AS size_up_after_loss,
        ROUND(AVG(quantity) FILTER (WHERE prev_pnl < 0)::NUMERIC, 2) 
            AS avg_qty_after_loss,
        ROUND(AVG(quantity) FILTER (WHERE prev_pnl > 0)::NUMERIC, 2) 
            AS avg_qty_after_win
    FROM ordered
    WHERE prev_pnl IS NOT NULL
    """, nativeQuery = true)
    Map<String, Object> getRevengeTrading(@Param("userId") Long userId);

    // ================================================================
// 🗓️ CALENDAR DATA — Daily P&L aggregation
// ================================================================
    @Query(value = """
    SELECT 
        DATE(entry_date) AS trade_date,
        COUNT(*) AS trade_count,
        ROUND(SUM(pnl)::NUMERIC, 2) AS total_pnl,
        ROUND(AVG(pnl)::NUMERIC, 2) AS avg_pnl,
        SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END) AS win_count,
        SUM(CASE WHEN pnl < 0 THEN 1 ELSE 0 END) AS loss_count,
        ROUND(
            (SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END) * 100.0 / COUNT(*))::NUMERIC,
            1
        ) AS win_rate
    FROM trades
    WHERE user_id = :userId
        AND entry_date >= CAST(:startDate AS TIMESTAMP)
        AND entry_date < CAST(:endDate AS TIMESTAMP)
    GROUP BY DATE(entry_date)
    ORDER BY trade_date
    """, nativeQuery = true)
    List<Map<String, Object>> getCalendarData(
            @Param("userId") Long userId,
            @Param("startDate") String startDate,
            @Param("endDate") String endDate
    );

    // ================================================================
// 🎯 TARGET HIT RATE (derived from MFE)
// ================================================================
    @Query(value = """
    WITH analysis AS (
        SELECT 
            id,
            target,
            mfe,
            direction,
            CASE 
                WHEN target IS NULL OR mfe IS NULL THEN NULL
                WHEN direction = 'BUY' AND mfe >= target THEN true
                WHEN direction = 'SELL' AND mfe <= target THEN true
                ELSE false
            END AS target_hit
        FROM trades
        WHERE user_id = :userId
    )
    SELECT 
        COUNT(*) FILTER (WHERE target IS NOT NULL AND mfe IS NOT NULL) AS trades_with_data,
        COUNT(*) FILTER (WHERE target_hit = true) AS target_hits,
        COUNT(*) FILTER (WHERE target_hit = false) AS target_misses,
        ROUND(
            (COUNT(*) FILTER (WHERE target_hit = true) * 100.0 / 
             NULLIF(COUNT(*) FILTER (WHERE target IS NOT NULL AND mfe IS NOT NULL), 0))::NUMERIC,
            1
        ) AS target_hit_rate
    FROM analysis
    """, nativeQuery = true)
    Map<String, Object> getTargetHitStats(@Param("userId") Long userId);

    // ================================================================
// 📊 CAPTURE RATIO — % of the potential move you captured
// ================================================================
    @Query(value = """
    WITH analysis AS (
        SELECT 
            id,
            entry_price,
            exit_price,
            mfe,
            direction,
            CASE 
                WHEN mfe IS NULL OR entry_price IS NULL THEN NULL
                WHEN direction = 'BUY' AND mfe > entry_price 
                    THEN (exit_price - entry_price) / (mfe - entry_price)
                WHEN direction = 'SELL' AND mfe < entry_price 
                    THEN (entry_price - exit_price) / (entry_price - mfe)
                ELSE NULL
            END AS capture_ratio
        FROM trades
        WHERE user_id = :userId
            AND pnl > 0
    )
    SELECT 
        ROUND((AVG(capture_ratio) * 100)::NUMERIC, 1) AS avg_capture_pct,
        ROUND((MIN(capture_ratio) * 100)::NUMERIC, 1) AS worst_capture_pct,
        ROUND((MAX(capture_ratio) * 100)::NUMERIC, 1) AS best_capture_pct,
        COUNT(*) AS trades_analyzed
    FROM analysis
    WHERE capture_ratio IS NOT NULL
    """, nativeQuery = true)
    Map<String, Object> getCaptureRatio(@Param("userId") Long userId);

    // ================================================================
// 💰 MISSED R-MULTIPLES — Extra R left on the table per trade
// ================================================================
    @Query(value = """
    WITH analysis AS (
        SELECT 
            id,
            symbol,
            direction,
            entry_price,
            exit_price,
            mfe,
            stoploss,
            pnl,
            CASE 
                WHEN mfe IS NULL 
                    OR stoploss IS NULL 
                    OR entry_price = stoploss
                THEN NULL
                WHEN direction = 'BUY' THEN
                    ((mfe - exit_price) * quantity) / 
                    NULLIF(ABS(entry_price - stoploss) * quantity, 0)
                WHEN direction = 'SELL' THEN
                    ((exit_price - mfe) * quantity) / 
                    NULLIF(ABS(stoploss - entry_price) * quantity, 0)
                ELSE NULL
            END AS missed_r
        FROM trades
        WHERE user_id = :userId
            AND pnl > 0
    )
    SELECT 
        ROUND(AVG(missed_r)::NUMERIC, 2) AS avg_missed_r,
        ROUND(MAX(missed_r)::NUMERIC, 2) AS worst_missed_r,
        ROUND(SUM(missed_r)::NUMERIC, 2) AS total_missed_r,
        COUNT(*) FILTER (WHERE missed_r > 0) AS trades_with_missed_r
    FROM analysis
    WHERE missed_r IS NOT NULL
    """, nativeQuery = true)
    Map<String, Object> getMissedRAnalysis(@Param("userId") Long userId);

    // ================================================================
// 📊 MFE vs TARGET — Were your targets too conservative?
// ================================================================
    @Query(value = """
    WITH analysis AS (
        SELECT 
            id,
            target,
            mfe,
            entry_price,
            direction,
            CASE 
                WHEN target IS NULL OR mfe IS NULL OR entry_price IS NULL THEN NULL
                WHEN direction = 'BUY' 
                    THEN (mfe - entry_price) / NULLIF(target - entry_price, 0)
                WHEN direction = 'SELL' 
                    THEN (entry_price - mfe) / NULLIF(entry_price - target, 0)
                ELSE NULL
            END AS mfe_to_target_ratio
        FROM trades
        WHERE user_id = :userId
    )
    SELECT 
        ROUND(AVG(mfe_to_target_ratio)::NUMERIC, 2) AS avg_mfe_target_ratio,
        COUNT(*) FILTER (WHERE mfe_to_target_ratio > 1.5) AS undertarget_moves,
        COUNT(*) FILTER (WHERE mfe_to_target_ratio BETWEEN 0.9 AND 1.1) AS accurate_targets,
        COUNT(*) FILTER (WHERE mfe_to_target_ratio < 0.5) AS overambitious_targets
    FROM analysis
    WHERE mfe_to_target_ratio IS NOT NULL
    """, nativeQuery = true)
    Map<String, Object> getMfeVsTarget(@Param("userId") Long userId);

    // ================================================================
// 📋 PER-TRADE MFE ANALYSIS — For displaying in the drawer
// ================================================================
    @Query(value = """
    SELECT 
        t.id,
        t.symbol,
        t.direction,
        t.entry_price,
        t.exit_price,
        t.mfe,
        t.target,
        t.stoploss,
        t.pnl,
        CASE 
            WHEN t.mfe IS NULL THEN NULL
            WHEN t.direction = 'BUY' THEN t.mfe - t.entry_price
            ELSE t.entry_price - t.mfe
        END AS potential_move,
        CASE 
            WHEN t.mfe IS NULL THEN NULL
            WHEN t.direction = 'BUY' THEN t.exit_price - t.entry_price
            ELSE t.entry_price - t.exit_price
        END AS actual_move,
        CASE 
            WHEN t.mfe IS NULL OR t.entry_price = t.stoploss THEN NULL
            WHEN t.direction = 'BUY' THEN 
                ((t.mfe - t.exit_price) * t.quantity) / 
                NULLIF(ABS(t.entry_price - t.stoploss) * t.quantity, 0)
            ELSE 
                ((t.exit_price - t.mfe) * t.quantity) / 
                NULLIF(ABS(t.stoploss - t.entry_price) * t.quantity, 0)
        END AS missed_r
    FROM trades t
    WHERE t.user_id = :userId
        AND t.id = :tradeId
    """, nativeQuery = true)
    Map<String, Object> getTradeMfeAnalysis(
            @Param("userId") Long userId,
            @Param("tradeId") Long tradeId
    );
}