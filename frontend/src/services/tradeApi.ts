import apiClient from './apiClient';

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
  mfe?: number;
  mae?: number;
  pnl?: number;
  entryDate: string;
  exitDate: string;
  notes?: string;
  screenshots?: TradeScreenshot[];
  longTimeFrameBias?: string;
  createdAt?: string;
  isMissed?: boolean;
  missedReasonType?: string;
  missedReason?: string;
  confidenceLevel?: number;
}

const unwrap = <T>(response: any): T => response.data?.data ?? response.data;

export const tradeApi = {
getAll: async (market?: string, type?: 'taken' | 'missed'): Promise<Trade[]> => {
  const params: any = {};
  if (market) params.market = market;
  if (type) params.type = type;
  const response = await apiClient.get('/trades', { params });
  return unwrap<Trade[]>(response);
},

  getById: async (id: number): Promise<Trade> => {
    const response = await apiClient.get(`/trades/${id}`);
    return unwrap<Trade>(response);
  },

  create: async (trade: Trade): Promise<Trade> => {
    const response = await apiClient.post('/trades', trade);
    return unwrap<Trade>(response);
  },

  update: async (id: number, trade: Trade): Promise<Trade> => {
    const response = await apiClient.put(`/trades/${id}`, trade);
    return unwrap<Trade>(response);
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/trades/${id}`);
  },

  uploadScreenshots: async (
    tradeId: number,
    files: File[]
  ): Promise<{ message: string; uploaded: any[] }> => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    const response = await apiClient.post(
      `/trades/${tradeId}/screenshots`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return unwrap<{ message: string; uploaded: any[] }>(response);
  },

  deleteScreenshot: async (tradeId: number, screenshotId: number): Promise<void> => {
    await apiClient.delete(`/trades/${tradeId}/screenshots/${screenshotId}`);
  },
};