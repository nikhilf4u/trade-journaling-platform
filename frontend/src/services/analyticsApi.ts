import axios from 'axios';

const ANALYTICS_API = import.meta.env.VITE_API_URL || '';

const unwrap = <T>(response: any): T => response.data?.data ?? response.data;

export interface SummaryStats {
  // Core
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  accuracy: number;
  total_pnl: number;
  avg_pnl: number;
  avg_win: number;
  avg_loss: number;

  // Risk
  risk_reward_ratio: number;
  profit_factor: number;
  expectancy: number;
  max_drawdown: number;
  adherence_percentage: number;
  trades_with_stoploss: number;

  // Ratios
  sharpe_ratio: number;
  sortino_ratio: number;
  calmar_ratio: number;

  // R-Multiple
  trades_with_plan: number;
  avg_r_multiple: number;
  best_r: number;
  worst_r: number;

  // Streaks
  longest_win_streak: number;
  longest_loss_streak: number;
  current_streak: number;
  current_streak_type: string;

  // Capture / MFE
  avg_capture_pct: number;
  worst_capture_pct: number;
  best_capture_pct: number;
  trades_analyzed: number;

  // Missed R
  avg_missed_r: number;
  worst_missed_r: number;
  total_missed_r: number;
  trades_with_missed_r: number;

  // MFE vs Target
  avg_mfe_target_ratio: number;
  undertarget_moves: number;
  accurate_targets: number;
  overambitious_targets: number;

  // Target Hit
  trades_with_data: number;
  target_hits: number;
  target_misses: number;
  target_hit_rate: number;

  // Behavioral (Discipline Matrix)
  avg_trades_per_day: number;
  max_trades_per_day: number;
  overtrading_days: number;
  total_trading_days: number;
  avg_risk: number;
  risk_stddev: number;
  max_risk: number;
  min_risk: number;
  trades_with_risk: number;
  hit_target: number;
  hit_stoploss: number;
  early_profit: number;
  early_loss: number;
  other: number;
  trades_within_30min_after_loss: number;
  size_up_after_loss: number;
  avg_qty_after_loss: number;
  avg_qty_after_win: number;
  discipline_score: number;
  rating: string;
  stoploss_adherence_score: number;
  exit_discipline_score: number;
  risk_consistency_score: number;
  overtrading_score: number;
  revenge_trading_score: number;
}
export interface EquityPoint {
  date: string;
  cumulative_pnl: number;
}

export interface MonthlyPnl {
  month: string;
  monthly_pnl: number;
  trade_count: number;
}

export interface MarketPerformance {
  market: string;
  total_trades: number;
  total_pnl: number;
  avg_pnl: number;
  win_rate: number;
}

export interface BiasPerformance {
  bias: string;
  trade_count: number;
  total_pnl: number;
  win_rate: number;
}

export interface DashboardData {
  summary: SummaryStats;
  equityCurve: EquityPoint[];
  monthlyPnl: MonthlyPnl[];
  marketPerformance: MarketPerformance[];
  biasPerformance: BiasPerformance[];
  rMultipleDistribution?: { bucket: string; count: number }[]; 
  dayOfWeekPerformance?: {           
    day_of_week: string;
    dow_num: number;
    trade_count: number;
    total_pnl: number;
    avg_pnl: number;
    win_rate: number;
  }[];
}

export const analyticsApi = {
  getDashboard: async (): Promise<DashboardData> => {
    const response = await axios.get(`${ANALYTICS_API}/api/analytics/dashboard`);
    return unwrap<DashboardData>(response);
  },

  getSummary: async (): Promise<SummaryStats> => {
    const response = await axios.get(`${ANALYTICS_API}/api/analytics/summary`);
    return unwrap<SummaryStats>(response);
  },

  getEquityCurve: async (): Promise<EquityPoint[]> => {
    const response = await axios.get(`${ANALYTICS_API}/api/analytics/equity-curve`);
    return unwrap<EquityPoint[]>(response);
  },

  getMonthly: async (): Promise<MonthlyPnl[]> => {
    const response = await axios.get(`${ANALYTICS_API}/api/analytics/monthly`);
    return unwrap<MonthlyPnl[]>(response);
  },

  getMarketPerformance: async (): Promise<MarketPerformance[]> => {
    const response = await axios.get(`${ANALYTICS_API}/api/analytics/market-performance`);
    return unwrap<MarketPerformance[]>(response);
  },

  getBiasPerformance: async (): Promise<BiasPerformance[]> => {
    const response = await axios.get(`${ANALYTICS_API}/api/analytics/bias-performance`);
    return unwrap<BiasPerformance[]>(response);
  },

  getCalendar: async (year: number, month: number): Promise<any[]> => {
  const response = await axios.get(
    `${ANALYTICS_API}/api/analytics/calendar?year=${year}&month=${month}`
  );
  return unwrap<any[]>(response);
},
};