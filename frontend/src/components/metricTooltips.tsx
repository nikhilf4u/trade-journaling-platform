import React from 'react';
import { Tag, Divider } from 'antd';

// ============================================================
// Reusable tooltip content wrapper
// ============================================================
interface TooltipContentProps {
  title: string;
  definition: string;
  formula?: string;
  ranges?: { label: string; color: string }[];
  tip?: string;
  width?: number;
}

export const MetricTooltip: React.FC<TooltipContentProps> = ({
  title,
  definition,
  formula,
  ranges,
  tip,
  width = 320,
}) => (
  <div style={{ maxWidth: width }}>
    <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 13 }}>{title}</div>
    <div style={{ fontSize: 12, marginBottom: 6, lineHeight: 1.4 }}>{definition}</div>
    {formula && (
      <div
        style={{
          fontSize: 11,
          fontFamily: 'monospace',
          background: 'rgba(255,255,255,0.1)',
          padding: '4px 6px',
          borderRadius: 4,
          marginBottom: 6,
        }}
      >
        {formula}
      </div>
    )}
    {ranges && ranges.length > 0 && (
      <div style={{ fontSize: 11, marginBottom: 6 }}>
        {ranges.map((r, i) => (
          <div key={i} style={{ marginBottom: 2 }}>
            <Tag color={r.color} style={{ fontSize: 10, margin: 0, minWidth: 60, textAlign: 'center' }}>
              {r.label}
            </Tag>
            <span style={{ marginLeft: 6 }}>{r.color === 'green' ? '✅' : r.color === 'orange' ? '⚠️' : '❌'}</span>
          </div>
        ))}
      </div>
    )}
    {tip && (
      <>
        <Divider style={{ margin: '6px 0', borderColor: 'rgba(255,255,255,0.2)' }} />
        <div style={{ fontSize: 11, fontStyle: 'italic', opacity: 0.9 }}>
          💡 {tip}
        </div>
      </>
    )}
  </div>
);

// ============================================================
// Pre-built tooltips for every metric
// ============================================================

export const AccuracyTooltip = () => (
  <MetricTooltip
    title="🎯 Accuracy (Win Rate)"
    definition="The percentage of your trades that ended in profit. This is your consistency metric — how often you're right."
    formula="Winning Trades ÷ Total Trades × 100"
    ranges={[
      { label: '> 70%', color: 'green' },
      { label: '50–70%', color: 'green' },
      { label: '40–50%', color: 'orange' },
      { label: '< 40%', color: 'red' },
    ]}
    tip="High accuracy isn't everything. A 40% accuracy with 3:1 R:R beats 70% accuracy with 0.5:1 R:R."
  />
);

export const RiskRewardTooltip = () => (
  <MetricTooltip
    title="⚖️ Risk / Reward Ratio"
    definition="How much you make on average when you win, relative to how much you lose on average when you lose."
    formula="Average Win ÷ |Average Loss|"
    ranges={[
      { label: '> 2.0:1', color: 'green' },
      { label: '1.5–2.0:1', color: 'green' },
      { label: '1.0–1.5:1', color: 'orange' },
      { label: '< 1.0:1', color: 'red' },
    ]}
    tip="This is your asymmetry metric. If below 1.0, you're risking more than you make — fix via tighter stops or wider targets."
  />
);

export const TotalPnLTooltip = () => (
  <MetricTooltip
    title="💰 Total P&L"
    definition="Sum of all profits and losses across every trade. This is your bottom line."
    formula="SUM(pnl)"
    tip="The number alone isn't enough — pair it with Max Drawdown to understand how much risk was taken to get here."
  />
);

export const ExpectancyTooltip = () => (
  <MetricTooltip
    title="⚡ Expectancy"
    definition="The expected value of each trade you take. The single most important metric — it combines accuracy, average win, and average loss."
    formula="(Accuracy × Avg Win) − (Loss Rate × Avg Loss)"
    ranges={[
      { label: '> 0', color: 'green' },
      { label: '= 0', color: 'orange' },
      { label: '< 0', color: 'red' },
    ]}
    tip="Positive expectancy means you should trade more. Negative means you should stop and reassess."
  />
);

export const ProfitFactorTooltip = () => (
  <MetricTooltip
    title="📉 Profit Factor"
    definition="The ratio of total profit to total loss. Captures both frequency and magnitude of wins."
    formula="Total Wins ÷ |Total Losses|"
    ranges={[
      { label: '> 2.0', color: 'green' },
      { label: '1.5–2.0', color: 'green' },
      { label: '1.0–1.5', color: 'orange' },
      { label: '< 1.0', color: 'red' },
    ]}
    tip="Above 2.0 = elite edge. Below 1.0 = you're losing money overall. Different from R:R — this is portfolio-wide."
  />
);

export const MaxDrawdownTooltip = () => (
  <MetricTooltip
    title="⚠️ Max Drawdown"
    definition="The largest peak-to-trough decline in your equity curve. How much pain you endured."
    formula="MAX(running peak − current equity)"
    ranges={[
      { label: '< 5%', color: 'green' },
      { label: '5–15%', color: 'green' },
      { label: '15–25%', color: 'orange' },
      { label: '> 25%', color: 'red' },
    ]}
    tip="Most traders quit at 20% drawdown. If your strategy produces higher, you may abandon it before it recovers."
  />
);

export const StopLossAdherenceTooltip = () => (
  <MetricTooltip
    title="🛑 Stop Loss Adherence"
    definition="Percentage of your trades where you set a stop-loss. A behavioral discipline metric, not a performance metric."
    formula="Trades with stoploss ÷ Total Trades × 100"
    ranges={[
      { label: '100%', color: 'green' },
      { label: '90–99%', color: 'green' },
      { label: '75–90%', color: 'orange' },
      { label: '< 75%', color: 'red' },
    ]}
    tip="Traders who consistently set stops avoid catastrophic losses. One undisciplined trade can wipe months of gains."
  />
);

export const AvgPnLTooltip = () => (
  <MetricTooltip
    title="💵 Average P&L"
    definition="The mean profit or loss per trade."
    formula="Total P&L ÷ Total Trades"
    tip="If Average P&L differs greatly from Expectancy, a few outsized trades are skewing your results."
  />
);

export const SharpeTooltip = () => (
  <MetricTooltip
    title="🏆 Sharpe Ratio"
    definition="Risk-adjusted return — measures return per unit of total volatility. Higher is better."
    formula="(Mean Return ÷ StdDev) × √N"
    ranges={[
      { label: '> 2.0', color: 'green' },
      { label: '1.0–2.0', color: 'green' },
      { label: '0–1.0', color: 'orange' },
      { label: '< 0', color: 'red' },
    ]}
    tip="The industry standard for comparing strategies. Above 1.0 is good, above 2.0 is excellent."
  />
);

export const SortinoTooltip = () => (
  <MetricTooltip
    title="📈 Sortino Ratio"
    definition="Like Sharpe, but only penalizes downside volatility. Better for asymmetric strategies (trend following, options)."
    formula="(Mean Return ÷ Downside StdDev) × √N"
    ranges={[
      { label: '> 2.0', color: 'green' },
      { label: '1.0–2.0', color: 'green' },
      { label: '< 1.0', color: 'orange' },
    ]}
    tip="Sortino is usually higher than Sharpe for good strategies because it doesn't penalize positive volatility."
  />
);

export const CalmarTooltip = () => (
  <MetricTooltip
    title="🛡️ Calmar Ratio"
    definition="Total return divided by max drawdown. Measures return per unit of worst-case pain."
    formula="Total Return ÷ Max Drawdown"
    ranges={[
      { label: '> 0.5', color: 'green' },
      { label: '0.2–0.5', color: 'green' },
      { label: '< 0.2', color: 'orange' },
    ]}
    tip="Higher is better. Above 0.5 means your returns are worth the worst drawdown you've experienced."
  />
);

export const RMultipleTooltip = () => (
  <MetricTooltip
    title="🎯 R-Multiple"
    definition="P&L normalized to initial risk. A +2R trade made 2× your risk; a −1R trade lost 1× your risk."
    formula="pnl ÷ (|entry − stoploss| × quantity)"
    ranges={[
      { label: 'Avg > 0.5R', color: 'green' },
      { label: 'Avg 0.3–0.5R', color: 'green' },
      { label: 'Avg 0–0.3R', color: 'orange' },
      { label: 'Avg < 0', color: 'red' },
    ]}
    tip="The gold standard for measuring trade quality. A trend follower with 35% accuracy and 3R average is elite."
  />
);

export const StreakTooltip = () => (
  <MetricTooltip
    title="🔥 Streaks"
    definition="Consecutive wins or losses. Reveals psychological resilience needed and consistency."
    tip="If your longest loss streak is 8, you need to survive 8 losses in a row psychologically. Reduce size during drawdowns."
  />
);

export const TargetHitRateTooltip = () => (
  <MetricTooltip
    title="✅ Target Hit Rate"
    definition="Percentage of trades where the price actually reached your target (regardless of where you exited)."
    formula="(MFE ≥ target) ÷ (Trades with MFE + target) × 100"
    ranges={[
      { label: '> 60%', color: 'green' },
      { label: '40–60%', color: 'orange' },
      { label: '< 40%', color: 'red' },
    ]}
    tip="Low rate = targets too ambitious. High rate with low capture = exiting too early."
  />
);

export const CaptureRatioTooltip = () => (
  <MetricTooltip
    title="🏆 Capture Ratio"
    definition="Of the total favorable move available (MFE), what percentage did you actually capture?"
    formula="(exit − entry) ÷ (MFE − entry) × 100"
    ranges={[
      { label: '> 70%', color: 'green' },
      { label: '40–70%', color: 'orange' },
      { label: '< 40%', color: 'red' },
    ]}
    tip="Above 70% means you're exiting near the peak. Below 40% means you exit way too early. Use trailing stops."
  />
);

export const MissedRTooltip = () => (
  <MetricTooltip
    title="🎯 Missed R"
    definition="Extra R-multiples you left on the table by exiting before the peak. Measures opportunity cost."
    formula="(MFE − exit) ÷ Risk per unit"
    ranges={[
      { label: '< 0.5R', color: 'green' },
      { label: '0.5–1R', color: 'orange' },
      { label: '> 1R', color: 'red' },
    ]}
    tip="High Missed R = exiting too early. Consider a trailing stop or partial exits."
  />
);

export const TargetAccuracyTooltip = () => (
  <MetricTooltip
    title="📏 Target Accuracy"
    definition="How far the price actually moved (MFE) relative to your target. Ratio of 1.0 = targets perfectly calibrated."
    formula="MFE ÷ Target"
    ranges={[
      { label: '≈ 1.0', color: 'green' },
      { label: '> 1.5', color: 'orange' },
      { label: '< 0.5', color: 'red' },
    ]}
    tip="Above 1.5 means your targets are too conservative — you're leaving money on the table. Below 0.5 means they're too ambitious."
  />
);

export const AvgMaeTooltip = () => (
  <MetricTooltip
    title="🛡️ Avg MAE (Winners)"
    definition="Average heat endured on winning trades, in R-multiples. Lower = better entry timing."
    formula="MAE ÷ Risk per unit (avg across winners)"
    ranges={[
      { label: '< 0.5R', color: 'green' },
      { label: '0.5–0.8R', color: 'orange' },
      { label: '> 0.8R', color: 'red' },
    ]}
    tip="Low MAE on winners means your entries are well-timed. High MAE means you're entering too early and letting the market work against you."
  />
);

export const OptimalStopTooltip = () => (
  <MetricTooltip
    title="🎯 Optimal Stop Suggestion"
    definition="Based on your MAE on winners, we suggest a statistically tighter stop distance that preserves 95% of your winners."
    formula="P95(MAE of winners) + buffer"
    tip="If P95 MAE is 0.72R, a stop at 0.82R would still capture 95% of your winners while cutting losses by ~18%. This is data-driven stop placement."
  />
);

export const DisciplineScoreTooltip = () => (
  <MetricTooltip
    title="🧠 Discipline Score"
    definition="Composite score from 5 behavioral metrics: stop-loss adherence, exit discipline, risk consistency, no-overtrading, no-revenge-trading."
    formula="30% SLA + 30% Exit + 20% Risk + 10% Overtrade + 10% Revenge"
    ranges={[
      { label: '≥ 85', color: 'green' },
      { label: '70–84', color: 'green' },
      { label: '50–69', color: 'orange' },
      { label: '< 50', color: 'red' },
    ]}
    tip="This is your 'coaching score'. Discipline precedes profitability — traders who score high here survive long enough to profit."
  />
);

export const OvertradingTooltip = () => (
  <MetricTooltip
    title="🚦 Overtrading"
    definition="Detects days where you traded significantly more than your average. Signals forcing trades / chasing."
    formula="Days with 2× avg trades ÷ Total trading days"
    tip="Overtrading correlates with emotional decisions. If flagged, ask: 'Did I have a valid setup, or was I bored?'"
  />
);

export const RiskConsistencyTooltip = () => (
  <MetricTooltip
    title="📐 Risk Consistency"
    definition="How consistent your position sizing is. Low variance = disciplined; high variance = erratic."
    formula="100 − (StdDev of Risk ÷ Avg Risk × 100)"
    tip="Erratic sizing means you risk 0.5% on some trades and 5% on others. This destroys compounding even with a positive edge."
  />
);

export const ExitDisciplineTooltip = () => (
  <MetricTooltip
    title="🚪 Exit Discipline"
    definition="Percentage of trades where you exited at your target or stop-loss (within 5% tolerance)."
    formula="(Hit Target + Hit Stoploss) ÷ Total Trades × 100"
    ranges={[
      { label: '> 70%', color: 'green' },
      { label: '40–70%', color: 'orange' },
      { label: '< 40%', color: 'red' },
    ]}
    tip="Low score means you're exiting early — either cutting winners short or moving stops. Both signal emotional decisions."
  />
);

export const RevengeTradingTooltip = () => (
  <MetricTooltip
    title="🔥 Revenge Trading"
    definition="Detects entering trades within 30 min of a loss, or sizing up (>1.5×) after a loss. Both are emotional patterns."
    tip="Revenge trading is the #1 account killer. If flagged, impose a 30-minute cooldown after every loss — no exceptions."
  />
);