import axios from 'axios';

const ANALYTICS_API = 'http://localhost:8080';

const unwrap = <T>(response: any): T => response.data?.data ?? response.data;

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
  trades_with_stoploss: number;
  adherence_percentage: number;
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