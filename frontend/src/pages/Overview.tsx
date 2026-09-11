import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import {
  Button,
  Card,
  message,
  Select,
  Image,
  Space,
  Typography,
  Tag,
  Descriptions,
  Divider,
  Empty,
  Spin,
  Statistic,
  Row,
  Col,
  Input,
  Modal,
  Tooltip,
  Alert,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  AimOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  SafetyOutlined,
  FireOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { tradeApi, Trade } from '../services/tradeApi';
import { TradeFormModal } from '../components/TradeFormModal';
import { useTheme } from '../context/ThemeContext';
import { notifySuccess, notifyError } from '../utils/notify';

const { Text, Title } = Typography;

// ============================================================
// Helper calculations
// ============================================================
const calculateHoldTime = (entry?: string, exit?: string): string => {
  if (!entry || !exit) return '—';
  const diffMs = dayjs(exit).diff(dayjs(entry));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    return `${days}d ${remHours}h`;
  }
  return `${hours}h ${minutes}m`;
};

const calculateRiskAmount = (trade: Trade): number | null => {
  if (!trade.stoploss || !trade.entryPrice) return null;
  return Math.abs(trade.entryPrice - trade.stoploss) * trade.quantity;
};

const calculatePlannedRR = (trade: Trade): number | null => {
  if (!trade.stoploss || !trade.target || !trade.entryPrice) return null;
  const risk = Math.abs(trade.entryPrice - trade.stoploss);
  const reward = Math.abs(trade.target - trade.entryPrice);
  if (risk === 0) return null;
  return reward / risk;
};

const calculateRMultiple = (trade: Trade): number | null => {
  if (!trade.stoploss || !trade.entryPrice || trade.pnl == null) return null;
  const riskPerUnit = Math.abs(trade.entryPrice - trade.stoploss);
  const riskAmount = riskPerUnit * trade.quantity;
  if (riskAmount === 0) return null;
  return trade.pnl / riskAmount;
};

// ----------------------------------------------------------
// MFE / MAE analysis
// ----------------------------------------------------------
interface MoveAnalysis {
  potentialMove: number;
  actualMove: number;
  capturedPct: number;
  missedR: number;
  targetHit: boolean | null;
}

const calculateMoveAnalysis = (trade: Trade): MoveAnalysis | null => {
  if (!trade.mfe || !trade.entryPrice) return null;

  const isBuy = trade.direction === 'BUY';
  const potentialMove = isBuy
    ? trade.mfe - trade.entryPrice
    : trade.entryPrice - trade.mfe;
  const actualMove = isBuy
    ? trade.exitPrice - trade.entryPrice
    : trade.entryPrice - trade.exitPrice;
  const capturedPct = potentialMove !== 0 ? (actualMove / potentialMove) * 100 : 0;

  let missedR = 0;
  if (trade.stoploss) {
    const risk = Math.abs(trade.entryPrice - trade.stoploss);
    if (risk > 0) {
      missedR = isBuy
        ? (trade.mfe - trade.exitPrice) / risk
        : (trade.exitPrice - trade.mfe) / risk;
    }
  }

  let targetHit: boolean | null = null;
  if (trade.target) {
    targetHit = isBuy ? trade.mfe >= trade.target : trade.mfe <= trade.target;
  }

  return { potentialMove, actualMove, capturedPct, missedR, targetHit };
};

// ----------------------------------------------------------
// Bias info helper
// ----------------------------------------------------------
const getBiasInfo = (bias?: string) => {
  const map: Record<string, { color: string; label: string }> = {
    STRONG_BULLISH: { color: 'green', label: '🟢🟢 Strong Bullish' },
    BULLISH: { color: 'green', label: '🟢 Bullish' },
    NEUTRAL: { color: 'default', label: '⚪ Neutral' },
    BEARISH: { color: 'red', label: '🔴 Bearish' },
    STRONG_BEARISH: { color: 'red', label: '🔴🔴 Strong Bearish' },
  };
  return map[bias || ''] || { color: 'default', label: bias || '—' };
};

// ============================================================
// Component
// ============================================================
export const Overview: React.FC = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [marketFilter, setMarketFilter] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const { mode } = useTheme();

  // ---------- Load trades ----------
  const loadTrades = useCallback(async () => {
    setLoading(true);
    try {
      const data = await tradeApi.getAll(marketFilter);
      setTrades(data);

      if (data.length > 0 && !selectedTrade) {
        setSelectedTrade(data[0]);
      } else if (data.length > 0 && selectedTrade) {
        const stillExists = data.find((t) => t.id === selectedTrade.id);
        setSelectedTrade(stillExists || data[0]);
      } else if (data.length === 0) {
        setSelectedTrade(null);
      }
    } catch (err) {
      message.error('Failed to load trades');
    } finally {
      setLoading(false);
    }
  }, [marketFilter, selectedTrade]);

  useEffect(() => {
    loadTrades();
  }, [marketFilter]);

  // ---------- Filter trades by search ----------
  const filteredTrades = useMemo(() => {
    if (!searchQuery.trim()) return trades;
    const q = searchQuery.toLowerCase();
    return trades.filter(
      (t) =>
        t.symbol.toLowerCase().includes(q) ||
        t.market.toLowerCase().includes(q) ||
        (t.notes && t.notes.toLowerCase().includes(q))
    );
  }, [trades, searchQuery]);

  // ---------- Delete ----------
  const handleDelete = async (id: number, symbol: string) => {
    Modal.confirm({
      title: 'Delete Trade?',
      content: `Are you sure you want to delete "${symbol}"? This cannot be undone.`,
      okText: 'Delete',
      okButtonProps: { danger: true },
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await tradeApi.delete(id);
          notifySuccess('Trade Deleted', `"${symbol}" removed from journal.`);
          setSelectedTrade(null);
          loadTrades();
        } catch (err: any) {
          notifyError(
            'Delete Failed',
            err.response?.data?.error || 'Could not delete trade'
          );
        }
      },
    });
  };

  // ---------- Computed metrics for selected trade ----------
  const metrics = useMemo(() => {
    if (!selectedTrade) return null;
    return {
      holdTime: calculateHoldTime(selectedTrade.entryDate, selectedTrade.exitDate),
      riskAmount: calculateRiskAmount(selectedTrade),
      plannedRR: calculatePlannedRR(selectedTrade),
      rMultiple: calculateRMultiple(selectedTrade),
      move: calculateMoveAnalysis(selectedTrade),
      bias: getBiasInfo(selectedTrade.longTimeFrameBias),
    };
  }, [selectedTrade]);

  return (
    <PageContainer
      header={{
        title: '📋 Trades Overview',
        subTitle: 'Click any trade to see full details',
        extra: [
          <Button key="refresh" icon={<ReloadOutlined />} onClick={loadTrades} />,
          <Button
            key="add"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingTrade(null);
              setModalOpen(true);
            }}
          >
            Log Trade
          </Button>,
        ],
      }}
    >
      <Row gutter={16}>
        {/* ============================================ */}
        {/* LEFT: Trade List */}
        {/* ============================================ */}
        <Col xs={24} lg={10} xl={9}>
          <Card
            bodyStyle={{ padding: 12 }}
            className="card-lift"
            style={{ height: 'calc(100vh - 200px)', overflow: 'hidden' }}
          >
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              <Input
                placeholder="Search symbol..."
                prefix={<SearchOutlined />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                allowClear
              />
              <Select
                placeholder="Filter by market"
                allowClear
                style={{ width: '100%' }}
                value={marketFilter}
                onChange={setMarketFilter}
                options={[
                  { label: 'NSE', value: 'NSE' },
                  { label: 'BSE', value: 'BSE' },
                  { label: 'NASDAQ', value: 'NASDAQ' },
                  { label: 'NYSE', value: 'NYSE' },
                  { label: 'CRYPTO', value: 'CRYPTO' },
                  { label: 'FX', value: 'FX' },
                ]}
              />
            </Space>

            <div style={{ marginTop: 12 }}>
              {loading ? (
                <div style={{ padding: 40, textAlign: 'center' }}>
                  <Spin />
                </div>
              ) : filteredTrades.length === 0 ? (
                <Empty description="No trades found" style={{ padding: 40 }} />
              ) : (
                <div
                  style={{
                    maxHeight: 'calc(100vh - 380px)',
                    overflowY: 'auto',
                    margin: '0 -12px',
                  }}
                >
                  {filteredTrades.map((trade) => {
                    const isSelected = selectedTrade?.id === trade.id;
                    const isProfit = (trade.pnl ?? 0) >= 0;
                    return (
                      <div
                        key={trade.id}
                        onClick={() => setSelectedTrade(trade)}
                        style={{
                          padding: '10px 12px',
                          cursor: 'pointer',
                          borderLeft: isSelected
                            ? '3px solid #1890ff'
                            : '3px solid transparent',
                          background: isSelected
                            ? mode === 'dark'
                              ? 'rgba(24,144,255,0.15)'
                              : '#e6f7ff'
                            : 'transparent',
                          transition: 'background 0.15s ease',
                          borderBottom: '1px solid #f0f0f0',
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.background =
                              mode === 'dark'
                                ? 'rgba(255,255,255,0.05)'
                                : '#fafafa';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.background = 'transparent';
                          }
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 8,
                          }}
                        >
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <Space size={6}>
                              <Text strong style={{ fontSize: 13 }}>
                                {trade.symbol}
                              </Text>
                              <Tag
                                color="blue"
                                style={{ fontSize: 10, margin: 0 }}
                              >
                                {trade.market}
                              </Tag>
                            </Space>
                            <div style={{ fontSize: 11, color: '#8c8c8c' }}>
                              {dayjs(trade.entryDate).format('MMM DD, YYYY')}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div
                              style={{
                                color: isProfit ? '#52c41a' : '#ff4d4f',
                                fontWeight: 700,
                                fontSize: 14,
                              }}
                            >
                              {isProfit ? '+' : ''}
                              {trade.pnl?.toFixed(0) ?? '0'}
                            </div>
                            <Tag
                              color={trade.direction === 'BUY' ? 'green' : 'red'}
                              style={{ fontSize: 9, margin: 0 }}
                            >
                              {trade.direction}
                            </Tag>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>
        </Col>

        {/* ============================================ */}
        {/* RIGHT: Trade Details */}
        {/* ============================================ */}
        <Col xs={24} lg={14} xl={15}>
          {!selectedTrade ? (
            <Card
              className="card-lift"
              style={{
                height: 'calc(100vh - 200px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="Select a trade to see details"
              />
            </Card>
          ) : (
            <Card
              className="card-lift fade-in"
              style={{ height: 'calc(100vh - 200px)', overflowY: 'auto' }}
              title={
                <Space wrap>
                  <Text strong style={{ fontSize: 18 }}>
                    {selectedTrade.symbol}
                  </Text>
                  <Tag
                    color={selectedTrade.direction === 'BUY' ? 'green' : 'red'}
                  >
                    {selectedTrade.direction === 'BUY' ? '🟢 BUY' : '🔴 SELL'}
                  </Tag>
                  <Tag color="blue">{selectedTrade.market}</Tag>
                  {selectedTrade.instrumentType && (
                    <Tag>{selectedTrade.instrumentType}</Tag>
                  )}
                </Space>
              }
              extra={
                <Space>
                  <Button
                    icon={<EditOutlined />}
                    onClick={() => {
                      setEditingTrade(selectedTrade);
                      setModalOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() =>
                      selectedTrade.id &&
                      handleDelete(selectedTrade.id, selectedTrade.symbol)
                    }
                  >
                    Delete
                  </Button>
                </Space>
              }
            >
              {/* ----------------------------------------
                  Hero P&L Card
                  ---------------------------------------- */}
              <div
                style={{
                  background:
                    (selectedTrade.pnl ?? 0) >= 0
                      ? 'linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)'
                      : 'linear-gradient(135deg, #fff1f0 0%, #ffccc7 100%)',
                  border: `1px solid ${
                    (selectedTrade.pnl ?? 0) >= 0 ? '#b7eb8f' : '#ffa39e'
                  }`,
                  borderRadius: 12,
                  padding: 20,
                  marginBottom: 20,
                }}
              >
                <Row align="middle" gutter={16}>
                  <Col flex="auto">
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      NET P&L
                    </Text>
                    <div
                      style={{
                        fontSize: 42,
                        fontWeight: 700,
                        color:
                          (selectedTrade.pnl ?? 0) >= 0
                            ? '#389e0d'
                            : '#cf1322',
                        lineHeight: 1.1,
                        marginTop: 4,
                      }}
                    >
                      {(selectedTrade.pnl ?? 0) >= 0 ? '+' : ''}
                      {selectedTrade.pnl?.toFixed(2) ?? '0.00'}
                      <span style={{ fontSize: 18, marginLeft: 8 }}>
                        {selectedTrade.quoteCurrency}
                      </span>
                    </div>
                  </Col>
                  {metrics?.rMultiple != null && (
                    <Col>
                      <Tooltip title="Profit divided by initial risk">
                        <div style={{ textAlign: 'center' }}>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            R-Multiple
                          </Text>
                          <div
                            style={{
                              fontSize: 26,
                              fontWeight: 700,
                              color:
                                metrics.rMultiple >= 0 ? '#389e0d' : '#cf1322',
                            }}
                          >
                            {metrics.rMultiple >= 0 ? '+' : ''}
                            {metrics.rMultiple.toFixed(2)}R
                          </div>
                        </div>
                      </Tooltip>
                    </Col>
                  )}
                </Row>
              </div>

              {/* ----------------------------------------
                  Quick Stats
                  ---------------------------------------- */}
              <Row gutter={12} style={{ marginBottom: 20 }}>
                <Col span={8}>
                  <Card size="small" style={{ background: '#fafafa' }}>
                    <Statistic
                      title="Entry"
                      value={selectedTrade.entryPrice}
                      precision={2}
                      valueStyle={{ fontSize: 16 }}
                    />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small" style={{ background: '#fafafa' }}>
                    <Statistic
                      title="Exit"
                      value={selectedTrade.exitPrice}
                      precision={2}
                      valueStyle={{ fontSize: 16 }}
                    />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small" style={{ background: '#fafafa' }}>
                    <Statistic
                      title="Quantity"
                      value={selectedTrade.quantity}
                      valueStyle={{ fontSize: 16 }}
                    />
                  </Card>
                </Col>
              </Row>

              {/* ----------------------------------------
                  Trade Planning
                  ---------------------------------------- */}
              <Divider orientation="left" style={{ marginTop: 8 }}>
                <Space>
                  <AimOutlined />
                  <span>Trade Planning</span>
                </Space>
              </Divider>
              <Descriptions column={2} size="small" bordered>
                <Descriptions.Item label="Stop Loss">
                  {selectedTrade.stoploss != null ? (
                    <Text style={{ color: '#faad14', fontWeight: 600 }}>
                      {selectedTrade.stoploss.toFixed(2)}
                    </Text>
                  ) : (
                    <Text type="secondary">Not set</Text>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Target">
                  {selectedTrade.target != null ? (
                    <Text style={{ color: '#52c41a', fontWeight: 600 }}>
                      {selectedTrade.target.toFixed(2)}
                    </Text>
                  ) : (
                    <Text type="secondary">Not set</Text>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Risk Amount">
                  {metrics?.riskAmount != null ? (
                    <Text style={{ color: '#ff4d4f', fontWeight: 600 }}>
                      -{metrics.riskAmount.toFixed(2)}
                    </Text>
                  ) : (
                    '—'
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Planned R:R">
                  {metrics?.plannedRR != null ? (
                    <Text strong>{metrics.plannedRR.toFixed(2)}:1</Text>
                  ) : (
                    '—'
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="HTF Bias" span={2}>
                  <Tag color={metrics?.bias.color}>{metrics?.bias.label}</Tag>
                </Descriptions.Item>
              </Descriptions>

              {/* ----------------------------------------
                  Move Analysis (MFE)
                  ---------------------------------------- */}
              {metrics?.move && (
                <>
                  <Divider orientation="left" style={{ marginTop: 24 }}>
                    <Space>
                      <TrophyOutlined />
                      <span>Move Analysis</span>
                    </Space>
                  </Divider>

                  <Descriptions column={2} size="small" bordered>
                    <Descriptions.Item label="Best Price (MFE)">
                      <Text style={{ color: '#52c41a', fontWeight: 600 }}>
                        {selectedTrade.mfe?.toFixed(2)}
                      </Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Worst Price (MAE)">
                      {selectedTrade.mae != null ? (
                        <Text style={{ color: '#ff4d4f', fontWeight: 600 }}>
                          {selectedTrade.mae.toFixed(2)}
                        </Text>
                      ) : (
                        <Text type="secondary">—</Text>
                      )}
                    </Descriptions.Item>

                    <Descriptions.Item label="Potential Move">
                      <Text>{metrics.move.potentialMove.toFixed(2)} pts</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Actual Move">
                      <Text strong>{metrics.move.actualMove.toFixed(2)} pts</Text>
                    </Descriptions.Item>

                    <Descriptions.Item label="Captured">
                      <Text
                        strong
                        style={{
                          color:
                            metrics.move.capturedPct >= 70
                              ? '#52c41a'
                              : metrics.move.capturedPct >= 40
                              ? '#faad14'
                              : '#ff4d4f',
                        }}
                      >
                        {metrics.move.capturedPct.toFixed(1)}%
                      </Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Missed R">
                      <Text
                        strong
                        style={{
                          color:
                            metrics.move.missedR > 0.5
                              ? '#faad14'
                              : '#52c41a',
                        }}
                      >
                        {metrics.move.missedR > 0 ? '+' : ''}
                        {metrics.move.missedR.toFixed(2)}R
                      </Text>
                    </Descriptions.Item>

                    {selectedTrade.target && (
                      <Descriptions.Item label="Target Hit?" span={2}>
                        {metrics.move.targetHit === true ? (
                          <Tag color="green">✅ Yes — MFE reached target</Tag>
                        ) : metrics.move.targetHit === false ? (
                          <Tag color="red">❌ No — MFE never reached target</Tag>
                        ) : (
                          <Text type="secondary">—</Text>
                        )}
                      </Descriptions.Item>
                    )}
                  </Descriptions>

                  {/* Missed R Alert */}
                  {metrics.move.missedR > 0.2 && (
                    <Alert
                      type={metrics.move.missedR >= 1 ? 'warning' : 'info'}
                      showIcon
                      icon={<FireOutlined />}
                      style={{ marginTop: 12 }}
                      message={
                        <span>
                          You left{' '}
                          <strong style={{ color: '#faad14' }}>
                            +{metrics.move.missedR.toFixed(2)}R
                          </strong>{' '}
                          on the table.
                          {metrics.move.missedR >= 1
                            ? ' Consider holding longer or using a trailing stop.'
                            : ' Solid exit — only minor left on the table.'}
                        </span>
                      }
                    />
                  )}

                  {metrics.move.missedR <= 0.2 &&
                    metrics.move.capturedPct >= 70 && (
                      <Alert
                        type="success"
                        showIcon
                        style={{ marginTop: 12 }}
                        message="Excellent exit! You captured most of the move."
                      />
                    )}
                </>
              )}

              {/* ----------------------------------------
                  Timeline
                  ---------------------------------------- */}
              <Divider orientation="left" style={{ marginTop: 24 }}>
                <Space>
                  <ClockCircleOutlined />
                  <span>Timeline</span>
                </Space>
              </Divider>
              <Descriptions column={2} size="small" bordered>
                <Descriptions.Item label="Entry Date">
                  {dayjs(selectedTrade.entryDate).format('MMM DD, YYYY HH:mm')}
                </Descriptions.Item>
                <Descriptions.Item label="Exit Date">
                  {dayjs(selectedTrade.exitDate).format('MMM DD, YYYY HH:mm')}
                </Descriptions.Item>
                <Descriptions.Item label="Hold Time" span={2}>
                  <Tag color="blue">{metrics?.holdTime}</Tag>
                </Descriptions.Item>
              </Descriptions>

              {/* ----------------------------------------
                  Screenshots
                  ---------------------------------------- */}
              <Divider orientation="left" style={{ marginTop: 24 }}>
                <Space>
                  <TrophyOutlined />
                  <span>
                    Screenshots ({selectedTrade.screenshots?.length || 0})
                  </span>
                </Space>
              </Divider>
              {selectedTrade.screenshots &&
              selectedTrade.screenshots.length > 0 ? (
                <Image.PreviewGroup>
                  <Space wrap size={[8, 8]}>
                    {selectedTrade.screenshots.map((s, i) => (
                      <Image
                        key={s.id || i}
                        src={s.url}
                        width={120}
                        height={120}
                        style={{
                          objectFit: 'cover',
                          borderRadius: 8,
                          border: '1px solid #f0f0f0',
                        }}
                      />
                    ))}
                  </Space>
                </Image.PreviewGroup>
              ) : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No screenshots"
                />
              )}

              {/* ----------------------------------------
                  Notes
                  ---------------------------------------- */}
              <Divider orientation="left" style={{ marginTop: 24 }}>
                <Space>
                  <SafetyOutlined />
                  <span>Notes</span>
                </Space>
              </Divider>
              {selectedTrade.notes ? (
                <div
                  style={{
                    background: '#fafafa',
                    padding: 16,
                    borderRadius: 8,
                    borderLeft: '3px solid #1890ff',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {selectedTrade.notes}
                </div>
              ) : (
                <Text type="secondary" italic>
                  No notes
                </Text>
              )}
            </Card>
          )}
        </Col>
      </Row>

      <TradeFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={loadTrades}
        editingTrade={editingTrade}
      />
    </PageContainer>
  );
};