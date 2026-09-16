import apiClient from './apiClient';

export interface SummaryStats {
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  accuracy: number;
  total_pnl: number;
  avg_pnl: number;
  avg_win: number;
  avg_loss: number;
  risk_reward_ratio: number;
  profit_factor: number;
  expectancy: number;
  max_drawdown: number;
  adherence_percentage: number;
  trades_with_stoploss: number;
  sharpe_ratio: number;
  sortino_ratio: number;
  calmar_ratio: number;
  trades_with_plan: number;
  avg_r_multiple: number;
  best_r: number;
  worst_r: number;
  longest_win_streak: number;
  longest_loss_streak: number;
  current_streak: number;
  current_streak_type: string;
  avg_capture_pct: number;
  worst_capture_pct: number;
  best_capture_pct: number;
  trades_analyzed: number;
  avg_missed_r: number;
  worst_missed_r: number;
  total_missed_r: number;
  trades_with_missed_r: number;
  avg_mfe_target_ratio: number;
  undertarget_moves: number;
  accurate_targets: number;
  overambitious_targets: number;
  trades_with_data: number;
  target_hits: number;
  target_misses: number;
  target_hit_rate: number;
  winning_trades_with_mae: number;
  avg_mae_winners: number;
  max_mae_winners: number;
  avg_mae_losers: number;
  p95_mae_winners: number;
  p90_mae_winners: number;
  sample_size: number;
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
  taken_count: number;
  taken_pnl: number;
  taken_wins: number;
  taken_avg_pnl: number;
  missed_count: number;
  missed_pnl: number;
  missed_wins: number;
  missed_avg_pnl: number;
  missed_rate: number;
  missed_win_rate: number;
  taken_win_rate: number;
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
  missedReasonBreakdown?: {
  reason_type: string;
  count: number;
  total_pnl: number;
  wins: number;
  win_rate: number;
}[];

missedConfidenceBreakdown?: {
  confidence_level: number;
  count: number;
  total_pnl: number;
  win_rate: number;
}[];
}

const unwrap = <T>(response: any): T => response.data?.data ?? response.data;

export const analyticsApi = {
  getDashboard: async (): Promise<DashboardData> => {
    const response = await apiClient.get('/analytics/dashboard');
    return unwrap<DashboardData>(response);
  },

  getSummary: async (): Promise<SummaryStats> => {
    const response = await apiClient.get('/analytics/summary');
    return unwrap<SummaryStats>(response);
  },

  getEquityCurve: async (): Promise<EquityPoint[]> => {
    const response = await apiClient.get('/analytics/equity-curve');
    return unwrap<EquityPoint[]>(response);
  },

  getMonthly: async (): Promise<MonthlyPnl[]> => {
    const response = await apiClient.get('/analytics/monthly');
    return unwrap<MonthlyPnl[]>(response);
  },

  getMarketPerformance: async (): Promise<MarketPerformance[]> => {
    const response = await apiClient.get('/analytics/market-performance');
    return unwrap<MarketPerformance[]>(response);
  },

  getBiasPerformance: async (): Promise<BiasPerformance[]> => {
    const response = await apiClient.get('/analytics/bias-performance');
    return unwrap<BiasPerformance[]>(response);
  },

  getCalendar: async (year: number, month: number): Promise<any[]> => {
    const response = await apiClient.get('/analytics/calendar', {
      params: { year, month },
    });
    return unwrap<any[]>(response);
  },

  getTradeMfe: async (tradeId: number): Promise<any> => {
    const response = await apiClient.get(`/analytics/trade/${tradeId}/mfe`);
    return unwrap<any>(response);
  },
};