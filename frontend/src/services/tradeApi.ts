import axios from 'axios';

const TRADE_API = 'http://localhost:8080';

export interface TradeScreenshot {
  id?: number;
  url: string;
  label?: string;
}

export interface Trade {
  id?: number;
  userId?: number;
  market: string;
  symbol: string;
  instrumentType?: string;
  direction: 'BUY' | 'SELL';
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  quoteCurrency: string;
  stoploss?: number;
  target?: number;
  longTimeFrameBias?: string;
  pnl?: number;
  entryDate: string;
  exitDate: string;
  notes?: string;
  screenshots?: TradeScreenshot[];
  createdAt?: string;
}

const unwrap = <T>(response: any): T => response.data?.data ?? response.data;

export const tradeApi = {
  getAll: async (market?: string): Promise<Trade[]> => {
    const url = market
      ? `${TRADE_API}/api/trades?market=${market}`
      : `${TRADE_API}/api/trades`;
    const response = await axios.get(url);
    return unwrap<Trade[]>(response);
  },

  getById: async (id: number): Promise<Trade> => {
    const response = await axios.get(`${TRADE_API}/api/trades/${id}`);
    return unwrap<Trade>(response);
  },

  create: async (trade: Trade): Promise<Trade> => {
    const response = await axios.post(`${TRADE_API}/api/trades`, trade);
    return unwrap<Trade>(response);
  },

  update: async (id: number, trade: Trade): Promise<Trade> => {
    const response = await axios.put(`${TRADE_API}/api/trades/${id}`, trade);
    return unwrap<Trade>(response);
  },

  // ⭐ NEW: Delete a trade
  delete: async (id: number): Promise<void> => {
    await axios.delete(`${TRADE_API}/api/trades/${id}`);
  },

  uploadScreenshots: async (
    tradeId: number,
    files: File[]
  ): Promise<{ message: string; uploaded: any[] }> => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    const response = await axios.post(
      `${TRADE_API}/api/trades/${tradeId}/screenshots`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return unwrap<{ message: string; uploaded: any[] }>(response);
  },

  deleteScreenshot: async (tradeId: number, screenshotId: number): Promise<void> => {
    await axios.delete(`${TRADE_API}/api/trades/${tradeId}/screenshots/${screenshotId}`);
  },
};