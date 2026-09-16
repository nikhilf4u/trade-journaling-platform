import React, { useEffect, useState } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import {
  Card,
  Row,
  Col,
  Typography,
  Button,
  Space,
  message,
  Table,
  Tag,
  Empty,
} from 'antd';
import {
  ReloadOutlined,
  PercentageOutlined,
  SwapOutlined,
  RiseOutlined,
  ThunderboltOutlined,
  FallOutlined,
  SafetyOutlined,
  WarningOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { AimOutlined } from '@ant-design/icons';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import { analyticsApi, DashboardData } from '../services/analyticsApi';
import { AnimatedStatistic } from '../components/AnimatedStatistic';
import { AnalyticsSkeleton } from '../components/AnalyticsSkeleton';
import { InfoCircleOutlined, TrophyOutlined, FireOutlined } from '@ant-design/icons';
import { Tooltip as AntTooltip } from 'antd';
import { BehavioralAnalysis } from '../components/BehavioralAnalysis';
import {
  AccuracyTooltip,
  RiskRewardTooltip,
  TotalPnLTooltip,
  ExpectancyTooltip,
  ProfitFactorTooltip,
  MaxDrawdownTooltip,
  StopLossAdherenceTooltip,
  AvgPnLTooltip,
  SharpeTooltip,
  SortinoTooltip,
  CalmarTooltip,
  RMultipleTooltip,
  TargetHitRateTooltip,
  CaptureRatioTooltip,
  MissedRTooltip,
  TargetAccuracyTooltip,
  AvgMaeTooltip,
  OptimalStopTooltip,
  MetricTooltip,
} from '../components/metricTooltips';

const { Title, Text } = Typography;

// Wrapper for consistent tooltip placement
const InfoTip: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AntTooltip
    title={children}
    placement="top"
    overlayStyle={{ maxWidth: 420 }}
    color="#1f1f1f"
  >
    <InfoCircleOutlined
      style={{ color: '#8c8c8c', cursor: 'help', marginLeft: 4 }}
    />
  </AntTooltip>
);

export const Analytics: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const dashboard = await analyticsApi.getDashboard();
      setData(dashboard);
    } catch (err: any) {
      message.error('Failed to load analytics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ---------- Loading State ----------
  if (loading) {
    return (
      <PageContainer
        header={{
          title: (
            <Space>
              <span className="live-dot live-dot-yellow" />
              <span>📈 Analytics Dashboard</span>
            </Space>
          ),
          subTitle: 'Loading...',
        }}
      >
        <AnalyticsSkeleton />
      </PageContainer>
    );
  }

  // ---------- Empty State ----------
  if (!data) {
    return (
      <PageContainer
        header={{
          title: (
            <Space>
              <span className="live-dot live-dot-red" />
              <span>📈 Analytics Dashboard</span>
            </Space>
          ),
          extra: [
            <Button key="refresh" icon={<ReloadOutlined />} onClick={loadData}>
              Refresh
            </Button>,
          ],
        }}
      >
        <Empty description="No analytics data available. Log some trades first!" />
      </PageContainer>
    );
  }

  const summary = data.summary || ({} as any);
  const equityCurve = data.equityCurve || [];
  const monthlyPnl = data.monthlyPnl || [];
  const marketPerformance = data.marketPerformance || [];
  const biasPerformance = data.biasPerformance || [];

  // ---------- Market Table Columns ----------
  const marketColumns = [
    {
      title: 'Market',
      dataIndex: 'market',
      key: 'market',
      render: (m: string) => <Tag color="blue">{m}</Tag>,
    },
    { title: 'Trades', dataIndex: 'total_trades', key: 'total_trades' },
    {
      title: 'P&L',
      dataIndex: 'total_pnl',
      key: 'total_pnl',
      render: (v: number) => (
        <Text strong style={{ color: Number(v) >= 0 ? '#52c41a' : '#ff4d4f' }}>
          {Number(v) >= 0 ? '+' : ''}
          {Number(v).toFixed(2)}
        </Text>
      ),
    },
    {
      title: 'Win Rate',
      dataIndex: 'win_rate',
      key: 'win_rate',
      render: (v: number) => (
        <Tag color={Number(v) >= 50 ? 'green' : 'orange'}>
          {Number(v).toFixed(1)}%
        </Tag>
      ),
    },
  ];

  // ---------- Bias Table Columns ----------
  const biasColumns = [
    {
      title: 'HTF Bias',
      dataIndex: 'bias',
      key: 'bias',
      render: (bias: string) => {
        const map: Record<string, { color: string; label: string }> = {
          STRONG_BULLISH: { color: 'green', label: '🟢🟢 Strong Bull' },
          BULLISH: { color: 'green', label: '🟢 Bullish' },
          NEUTRAL: { color: 'default', label: '⚪ Neutral' },
          BEARISH: { color: 'red', label: '🔴 Bearish' },
          STRONG_BEARISH: { color: 'red', label: '🔴🔴 Strong Bear' },
          UNKNOWN: { color: 'default', label: '—' },
        };
        const m = map[bias] || { color: 'default', label: bias };
        return <Tag color={m.color}>{m.label}</Tag>;
      },
    },
    { title: 'Trades', dataIndex: 'trade_count', key: 'trade_count' },
    {
      title: 'P&L',
      dataIndex: 'total_pnl',
      key: 'total_pnl',
      render: (v: number) => (
        <Text strong style={{ color: Number(v) >= 0 ? '#52c41a' : '#ff4d4f' }}>
          {Number(v) >= 0 ? '+' : ''}
          {Number(v).toFixed(2)}
        </Text>
      ),
    },
    {
      title: 'Win Rate',
      dataIndex: 'win_rate',
      key: 'win_rate',
      render: (v: number) => (
        <Tag color={Number(v) >= 50 ? 'green' : 'orange'}>
          {Number(v).toFixed(1)}%
        </Tag>
      ),
    },
  ];

  // ---------- Computed Values ----------
  const accuracy = Number(summary.accuracy || 0);
  const rr = Number(summary.risk_reward_ratio || 0);
  const expectancy = Number(summary.expectancy || 0);

  // ---------- Edge Assessment ----------
  const getEdgeAssessment = () => {
    if (expectancy > 0) {
      return {
        color: '#52c41a',
        icon: '✅',
        text: 'Positive edge. Keep executing.',
        bg: '#f6ffed',
        border: '#b7eb8f',
      };
    } else if (expectancy === 0) {
      return {
        color: '#faad14',
        icon: '⚖️',
        text: 'Break-even. Review your strategy.',
        bg: '#fffbe6',
        border: '#ffe58f',
      };
    }
    return {
      color: '#ff4d4f',
      icon: '⚠️',
      text: 'Negative edge. Stop and reassess.',
      bg: '#fff1f0',
      border: '#ffccc7',
    };
  };

  const edge = getEdgeAssessment();

  return (
    <PageContainer
      header={{
        title: (
          <Space>
            <span className="live-dot" />
            <span>📈 Analytics Dashboard</span>
          </Space>
        ),
        subTitle: 'Performance metrics and insights',
        extra: [
          <Button key="refresh" icon={<ReloadOutlined />} onClick={loadData}>
            Refresh
          </Button>,
        ],
      }}
    >
      {/* ============================================ */}
      {/* KPI Row 1 — The Big 4 */}
      {/* ============================================ */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6} className="fade-in-up stagger-1">
          <Card className="card-lift">
            <AnimatedStatistic
              title={
                <Space>
                  Accuracy
                  <InfoTip>
                    <AccuracyTooltip />
                  </InfoTip>
                </Space>
              }
              value={accuracy}
              suffix="%"
              precision={1}
              prefix={<PercentageOutlined />}
              valueStyle={{
                color: accuracy >= 50 ? '#52c41a' : '#faad14',
              }}
            />
            <Text type="secondary" style={{ fontSize: 11 }}>
              {summary.winning_trades || 0}W / {summary.losing_trades || 0}L
            </Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6} className="fade-in-up stagger-2">
          <Card className="card-lift">
            <AnimatedStatistic
              title={
                <Space>
                  Risk / Reward
                  <InfoTip>
                    <RiskRewardTooltip />
                  </InfoTip>
                </Space>
              }
              value={rr}
              precision={2}
              suffix=":1"
              prefix={<SwapOutlined />}
              valueStyle={{
                color: rr >= 1.5 ? '#52c41a' : '#faad14',
              }}
            />
            <Text type="secondary" style={{ fontSize: 11 }}>
              Win avg {Number(summary.avg_win || 0).toFixed(0)} / Loss avg{' '}
              {Math.abs(Number(summary.avg_loss || 0)).toFixed(0)}
            </Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6} className="fade-in-up stagger-3">
          <Card className="card-lift">
            <AnimatedStatistic
              title={
                <Space>
                  Total P&L
                  <InfoTip>
                    <TotalPnLTooltip />
                  </InfoTip>
                </Space>
              }
              value={Number(summary.total_pnl || 0)}
              precision={2}
              prefix={<RiseOutlined />}
              valueStyle={{
                color: Number(summary.total_pnl) >= 0 ? '#52c41a' : '#ff4d4f',
              }}
            />
            <Text type="secondary" style={{ fontSize: 11 }}>
              Across {summary.total_trades || 0} trades
            </Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6} className="fade-in-up stagger-4">
          <Card className="card-lift">
            <AnimatedStatistic
              title={
                <Space>
                  Expectancy
                  <InfoTip>
                    <ExpectancyTooltip />
                  </InfoTip>
                </Space>
              }
              value={expectancy}
              precision={2}
              prefix={<ThunderboltOutlined />}
              valueStyle={{
                color: expectancy >= 0 ? '#52c41a' : '#ff4d4f',
              }}
            />
            <Text type="secondary" style={{ fontSize: 11 }}>
              Per trade
            </Text>
          </Card>
        </Col>
      </Row>

      {/* ============================================ */}
      {/* KPI Row 2 — Risk & Discipline */}
      {/* ============================================ */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} sm={12} md={6} className="fade-in-up stagger-1">
          <Card className="card-lift">
            <AnimatedStatistic
              title={
                <Space>
                  Profit Factor
                  <InfoTip>
                    <ProfitFactorTooltip />
                  </InfoTip>
                </Space>
              }
              value={Number(summary.profit_factor || 0)}
              precision={2}
              prefix={<FallOutlined />}
              valueStyle={{
                color:
                  Number(summary.profit_factor) >= 1.5 ? '#52c41a' : '#faad14',
              }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6} className="fade-in-up stagger-2">
          <Card className="card-lift">
            <AnimatedStatistic
              title={
                <Space>
                  Max Drawdown
                  <InfoTip>
                    <MaxDrawdownTooltip />
                  </InfoTip>
                </Space>
              }
              value={Math.abs(Number(summary.max_drawdown || 0))}
              precision={2}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6} className="fade-in-up stagger-3">
          <Card className="card-lift">
            <AnimatedStatistic
              title={
                <Space>
                  Stop Loss Adherence
                  <InfoTip>
                    <StopLossAdherenceTooltip />
                  </InfoTip>
                </Space>
              }
              value={Number(summary.adherence_percentage || 0)}
              suffix="%"
              precision={0}
              prefix={<SafetyOutlined />}
              valueStyle={{
                color:
                  Number(summary.adherence_percentage) >= 90
                    ? '#52c41a'
                    : '#faad14',
              }}
            />
            <Text type="secondary" style={{ fontSize: 11 }}>
              {summary.trades_with_stoploss || 0} / {summary.total_trades || 0}{' '}
              trades
            </Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6} className="fade-in-up stagger-4">
          <Card className="card-lift">
            <AnimatedStatistic
              title={
                <Space>
                  Average P&L
                  <InfoTip>
                    <AvgPnLTooltip />
                  </InfoTip>
                </Space>
              }
              value={Number(summary.avg_pnl || 0)}
              precision={2}
              valueStyle={{
                color: Number(summary.avg_pnl) >= 0 ? '#52c41a' : '#ff4d4f',
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* ============================================ */}
      {/* KPI Row 3 — Risk-Adjusted Ratios */}
      {/* ============================================ */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} sm={12} md={8} className="fade-in-up stagger-1">
          <Card className="card-lift">
            <AnimatedStatistic
              title={
                <Space>
                  Sharpe Ratio
                  <InfoTip>
                    <SharpeTooltip />
                  </InfoTip>
                </Space>
              }
              value={Number(summary.sharpe_ratio || 0)}
              precision={2}
              prefix={<TrophyOutlined />}
              valueStyle={{
                color:
                  Number(summary.sharpe_ratio) >= 1.5
                    ? '#52c41a'
                    : Number(summary.sharpe_ratio) >= 1
                    ? '#faad14'
                    : '#ff4d4f',
              }}
            />
            <Text type="secondary" style={{ fontSize: 11 }}>
              {Number(summary.sharpe_ratio) >= 2
                ? 'Excellent'
                : Number(summary.sharpe_ratio) >= 1
                ? 'Good'
                : Number(summary.sharpe_ratio) >= 0
                ? 'Marginal'
                : 'Negative'}
            </Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8} className="fade-in-up stagger-2">
          <Card className="card-lift">
            <AnimatedStatistic
              title={
                <Space>
                  Sortino Ratio
                  <InfoTip>
                    <SortinoTooltip />
                  </InfoTip>
                </Space>
              }
              value={Number(summary.sortino_ratio || 0)}
              precision={2}
              prefix={<RiseOutlined />}
              valueStyle={{
                color:
                  Number(summary.sortino_ratio) >= 2
                    ? '#52c41a'
                    : Number(summary.sortino_ratio) >= 1
                    ? '#faad14'
                    : '#ff4d4f',
              }}
            />
            <Text type="secondary" style={{ fontSize: 11 }}>
              Downside-risk adjusted
            </Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8} className="fade-in-up stagger-3">
          <Card className="card-lift">
            <AnimatedStatistic
              title={
                <Space>
                  Calmar Ratio
                  <InfoTip>
                    <CalmarTooltip />
                  </InfoTip>
                </Space>
              }
              value={Number(summary.calmar_ratio || 0)}
              precision={2}
              prefix={<SafetyOutlined />}
              valueStyle={{
                color:
                  Number(summary.calmar_ratio) >= 0.5
                    ? '#52c41a'
                    : Number(summary.calmar_ratio) >= 0.2
                    ? '#faad14'
                    : '#ff4d4f',
              }}
            />
            <Text type="secondary" style={{ fontSize: 11 }}>
              Return / Drawdown
            </Text>
          </Card>
        </Col>
      </Row>

      {/* ============================================ */}
      {/* Edge Assessment Card */}
      {/* ============================================ */}
      <div className="fade-in-up stagger-5" style={{ marginTop: 20 }}>
        <Card
          style={{
            background: edge.bg,
            borderColor: edge.border,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 16,
            }}
          >
            <div>
              <Title level={4} style={{ margin: 0 }}>
                {edge.icon} Edge Assessment
              </Title>
              <Text style={{ color: edge.color, fontWeight: 600 }}>
                {edge.text}
              </Text>
            </div>
            <div style={{ textAlign: 'right' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Expectancy = (Accuracy × Avg Win) − (Loss Rate × Avg Loss)
              </Text>
              <br />
              <Text strong>
                {accuracy.toFixed(1)}% ×{' '}
                {Number(summary.avg_win || 0).toFixed(0)} −{' '}
                {(100 - accuracy).toFixed(1)}% ×{' '}
                {Math.abs(Number(summary.avg_loss || 0)).toFixed(0)} ={' '}
                <span style={{ color: edge.color }}>
                  {expectancy.toFixed(2)}
                </span>
              </Text>
            </div>
          </div>
        </Card>
      </div>

      {/* ============================================ */}
      {/* ⭐ KPI Row — Missed Trades Analysis */}
      {/* ============================================ */}
      {(summary.missed_count > 0 || summary.taken_count > 0) && (
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} sm={12} md={6} className="fade-in-up stagger-1">
            <Card className="card-lift">
              <AnimatedStatistic
                title={
                  <Space>
                    Missed Trade Rate
                    <AntTooltip title="Percentage of analyzed setups you didn't take. High rate = analysis paralysis or fear.">
                      <InfoCircleOutlined style={{ color: '#8c8c8c' }} />
                    </AntTooltip>
                  </Space>
                }
                value={Number(summary.missed_rate || 0)}
                suffix="%"
                precision={1}
                prefix={<EyeOutlined />}
                valueStyle={{
                  color:
                    Number(summary.missed_rate) <= 20
                      ? '#52c41a'
                      : Number(summary.missed_rate) <= 50
                      ? '#faad14'
                      : '#ff4d4f',
                }}
              />
              <Text type="secondary" style={{ fontSize: 11 }}>
                {summary.missed_count || 0} of {(summary.missed_count || 0) + (summary.taken_count || 0)} setups
              </Text>
            </Card>
          </Col>

          <Col xs={24} sm={12} md={6} className="fade-in-up stagger-2">
            <Card className="card-lift">
              <AnimatedStatistic
                title={
                  <Space>
                    Missed Win Rate
                    <AntTooltip title="Win rate of trades you analyzed but didn't take. Tells you if your analysis was right.">
                      <InfoCircleOutlined style={{ color: '#8c8c8c' }} />
                    </AntTooltip>
                  </Space>
                }
                value={Number(summary.missed_win_rate || 0)}
                suffix="%"
                precision={1}
                valueStyle={{
                  color:
                    Number(summary.missed_win_rate) >= 60
                      ? '#ff4d4f'  // HIGH = bad — you missed good trades!
                      : Number(summary.missed_win_rate) >= 40
                      ? '#faad14'
                      : '#52c41a',
                }}
              />
              <Text type="secondary" style={{ fontSize: 11 }}>
                {summary.missed_wins || 0} would have won
              </Text>
            </Card>
          </Col>

          <Col xs={24} sm={12} md={6} className="fade-in-up stagger-3">
            <Card className="card-lift">
              <AnimatedStatistic
                title={
                  <Space>
                    Missed Opportunity P&L
                    <AntTooltip title="Total P&L you would have made from the trades you didn't take. This is your opportunity cost.">
                      <InfoCircleOutlined style={{ color: '#8c8c8c' }} />
                    </AntTooltip>
                  </Space>
                }
                value={Number(summary.missed_pnl || 0)}
                precision={2}
                valueStyle={{
                  color: Number(summary.missed_pnl) > 0 ? '#ff4d4f' : '#52c41a',
                }}
              />
              <Text type="secondary" style={{ fontSize: 11 }}>
                Real P&L: {Number(summary.taken_pnl || 0).toFixed(2)}
              </Text>
            </Card>
          </Col>

          <Col xs={24} sm={12} md={6} className="fade-in-up stagger-4">
            <Card className="card-lift">
              <AnimatedStatistic
                title={
                  <Space>
                    Analysis Edge
                    <AntTooltip title="Missed win rate vs Taken win rate. If missed > taken, your analysis is better than your execution.">
                      <InfoCircleOutlined style={{ color: '#8c8c8c' }} />
                    </AntTooltip>
                  </Space>
                }
                value={
                  Number(summary.missed_win_rate || 0) -
                  Number(summary.taken_win_rate || 0)
                }
                suffix="%"
                precision={1}
                valueStyle={{
                  color:
                    Number(summary.missed_win_rate) > Number(summary.taken_win_rate)
                      ? '#ff4d4f'
                      : '#52c41a',
                }}
              />
              <Text type="secondary" style={{ fontSize: 11 }}>
                Missed {Number(summary.missed_win_rate || 0).toFixed(0)}% vs Taken {Number(summary.taken_win_rate || 0).toFixed(0)}%
              </Text>
            </Card>
          </Col>
        </Row>
      )}

      {/* ============================================ */}
      {/* Optimal Stop Suggestion Card */}
      {/* ============================================ */}
      {Number(summary.p95_mae_winners) > 0 && (
        <Card
          style={{
            marginTop: 20,
            background: '#f0f5ff',
            borderColor: '#adc6ff',
          }}
          className="card-lift fade-in-up"
        >
          <Row gutter={[16, 16]} align="middle">
            <Col flex="auto">
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Space>
                  <AimOutlined style={{ color: '#1890ff', fontSize: 20 }} />
                  <Text strong style={{ fontSize: 16 }}>
                    🎯 Optimal Stop Suggestion
                  </Text>
                  <InfoTip>
                    <OptimalStopTooltip />
                  </InfoTip>
                </Space>
                <Text>
                  Based on <strong>{summary.sample_size || 0}</strong> winning trades:
                </Text>
                <Space wrap>
                  <Tag color="blue">
                    Avg MAE:{' '}
                    <strong>{Number(summary.avg_mae_winners || 0).toFixed(2)}R</strong>
                  </Tag>
                  <Tag color="orange">
                    P95 MAE:{' '}
                    <strong>{Number(summary.p95_mae_winners || 0).toFixed(2)}R</strong>
                  </Tag>
                  <Tag color="red">
                    Max MAE:{' '}
                    <strong>{Number(summary.max_mae_winners || 0).toFixed(2)}R</strong>
                  </Tag>
                </Space>
                <Text type="secondary">
                  95% of your winning trades experienced max adverse excursion of{' '}
                  <strong>{Number(summary.p95_mae_winners || 0).toFixed(2)}R</strong>.
                  Consider tightening your stops from <strong>1.00R</strong> to{' '}
                  <strong>
                    {Math.max(0.85, Number(summary.p95_mae_winners || 0) + 0.1).toFixed(2)}R
                  </strong>{' '}
                  to cut losses without missing winners.
                </Text>
              </Space>
            </Col>
          </Row>
        </Card>
      )}

      {/* ============================================ */}
      {/* Discipline Matrix */}
      {/* ============================================ */}
      <BehavioralAnalysis summary={summary} />

      {/* ============================================ */}
      {/* KPI Row 5 — MFE & Capture Analysis */}
      {/* ============================================ */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} sm={12} md={6} className="fade-in-up stagger-1">
          <Card className="card-lift">
            <AnimatedStatistic
              title={
                <Space>
                  Capture Ratio
                  <InfoTip>
                    <CaptureRatioTooltip />
                  </InfoTip>
                </Space>
              }
              value={Number(summary.avg_capture_pct || 0)}
              suffix="%"
              precision={1}
              prefix={<TrophyOutlined />}
              valueStyle={{
                color:
                  Number(summary.avg_capture_pct) >= 70
                    ? '#52c41a'
                    : Number(summary.avg_capture_pct) >= 50
                    ? '#faad14'
                    : '#ff4d4f',
              }}
            />
            <Text type="secondary" style={{ fontSize: 11 }}>
              {summary.trades_analyzed || 0} winners analyzed
            </Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6} className="fade-in-up stagger-2">
          <Card className="card-lift">
            <AnimatedStatistic
              title={
                <Space>
                  Avg Missed R
                  <InfoTip>
                    <MissedRTooltip />
                  </InfoTip>
                </Space>
              }
              value={Number(summary.avg_missed_r || 0)}
              precision={2}
              suffix="R"
              prefix={<AimOutlined />}
              valueStyle={{
                color:
                  Number(summary.avg_missed_r) <= 0.5
                    ? '#52c41a'
                    : Number(summary.avg_missed_r) <= 1
                    ? '#faad14'
                    : '#ff4d4f',
              }}
            />
            <Text type="secondary" style={{ fontSize: 11 }}>
              Across {summary.trades_with_missed_r || 0} trades
            </Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6} className="fade-in-up stagger-3">
          <Card className="card-lift">
            <AnimatedStatistic
              title={
                <Space>
                  Target Hit Rate
                  <InfoTip>
                    <TargetHitRateTooltip />
                  </InfoTip>
                </Space>
              }
              value={Number(summary.target_hit_rate || 0)}
              suffix="%"
              precision={1}
              valueStyle={{
                color:
                  Number(summary.target_hit_rate) >= 60
                    ? '#52c41a'
                    : Number(summary.target_hit_rate) >= 40
                    ? '#faad14'
                    : '#ff4d4f',
              }}
            />
            <Text type="secondary" style={{ fontSize: 11 }}>
              {summary.target_hits || 0} of {summary.trades_with_data || 0} trades
            </Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6} className="fade-in-up stagger-4">
          <Card className="card-lift">
            <AnimatedStatistic
              title={
                <Space>
                  Avg MAE (Winners)
                  <InfoTip>
                    <AvgMaeTooltip />
                  </InfoTip>
                </Space>
              }
              value={Number(summary.avg_mae_winners || 0)}
              precision={2}
              suffix="R"
              prefix={<SafetyOutlined />}
              valueStyle={{
                color:
                  Number(summary.avg_mae_winners) <= 0.5
                    ? '#52c41a'
                    : Number(summary.avg_mae_winners) <= 0.8
                    ? '#faad14'
                    : '#ff4d4f',
              }}
            />
            <Text type="secondary" style={{ fontSize: 11 }}>
              {summary.winning_trades_with_mae || 0} winners analyzed
            </Text>
          </Card>
        </Col>
      </Row>

      {/* ============================================ */}
      {/* KPI Row 6 — Target Accuracy */}
      {/* ============================================ */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} sm={12} md={8} className="fade-in-up stagger-1">
          <Card className="card-lift">
            <AnimatedStatistic
              title={
                <Space>
                  Target Accuracy
                  <InfoTip>
                    <TargetAccuracyTooltip />
                  </InfoTip>
                </Space>
              }
              value={Number(summary.avg_mfe_target_ratio || 0)}
              precision={2}
              suffix="x"
              valueStyle={{
                color:
                  Number(summary.avg_mfe_target_ratio) > 1.5
                    ? '#faad14'
                    : Number(summary.avg_mfe_target_ratio) >= 0.9
                    ? '#52c41a'
                    : '#ff4d4f',
              }}
            />
            <Text type="secondary" style={{ fontSize: 11 }}>
              {summary.undertarget_moves > 0
                ? `${summary.undertarget_moves} trades had big missed moves`
                : 'Targets well-calibrated'}
            </Text>
          </Card>
        </Col>
      </Row>

      {/* ============================================ */}
      {/* R-Multiple Distribution */}
      {/* ============================================ */}
      <div className="fade-in-up stagger-6" style={{ marginTop: 20 }}>
        <Card
          title={
            <Space>
              🎯 R-Multiple Distribution
              <InfoTip>
                <RMultipleTooltip />
              </InfoTip>
            </Space>
          }
          className="card-lift"
          extra={
            summary.avg_r_multiple != null && (
              <Space>
                <Tag
                  color={Number(summary.avg_r_multiple) >= 0 ? 'green' : 'red'}
                >
                  Avg: {Number(summary.avg_r_multiple).toFixed(2)}R
                </Tag>
                {summary.best_r != null && (
                  <Tag color="blue">Best: {Number(summary.best_r).toFixed(2)}R</Tag>
                )}
                {summary.worst_r != null && (
                  <Tag color="red">Worst: {Number(summary.worst_r).toFixed(2)}R</Tag>
                )}
              </Space>
            )
          }
        >
          {!data.rMultipleDistribution || data.rMultipleDistribution.length === 0 ? (
            <Empty description="Set stop-losses on your trades to see R-multiple analysis" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.rMultipleDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="bucket" />
                <YAxis />
                <Tooltip formatter={(value: any) => [`${value} trades`, 'Count']} />
                <Bar
                  dataKey="count"
                  fill="#1890ff"
                  name="Trades"
                  radius={[4, 4, 0, 0]}
                  animationDuration={900}
                >
                  {data.rMultipleDistribution.map((entry: any, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.bucket.startsWith('-') || entry.bucket.startsWith('<')
                          ? '#ff4d4f'
                          : '#52c41a'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* ============================================ */}
      {/* KPI Row 4 — Streak Analysis */}
      {/* ============================================ */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} sm={12} md={8} className="fade-in-up stagger-1">
          <Card className="card-lift">
            <AnimatedStatistic
              title="Longest Win Streak"
              value={Number(summary.longest_win_streak || 0)}
              prefix={<FireOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
            <Text type="secondary" style={{ fontSize: 11 }}>
              Consecutive winning trades
            </Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8} className="fade-in-up stagger-2">
          <Card className="card-lift">
            <AnimatedStatistic
              title="Longest Loss Streak"
              value={Number(summary.longest_loss_streak || 0)}
              prefix={<FallOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#ff4d4f' }}
            />
            <Text type="secondary" style={{ fontSize: 11 }}>
              Consecutive losing trades
            </Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8} className="fade-in-up stagger-3">
          <Card className="card-lift">
            <AnimatedStatistic
              title="Current Streak"
              value={Number(summary.current_streak || 0)}
              suffix={summary.current_streak_type || ''}
              prefix={
                summary.current_streak_type === 'WIN' ? (
                  <RiseOutlined style={{ color: '#52c41a' }} />
                ) : (
                  <FallOutlined style={{ color: '#ff4d4f' }} />
                )
              }
              valueStyle={{
                color:
                  summary.current_streak_type === 'WIN' ? '#52c41a' : '#ff4d4f',
              }}
            />
            <Text type="secondary" style={{ fontSize: 11 }}>
              Your active streak
            </Text>
          </Card>
        </Col>
      </Row>

      {/* ============================================ */}
      {/* Day-of-Week Performance */}
      {/* ============================================ */}
      <div className="fade-in-up stagger-6" style={{ marginTop: 20 }}>
        <Card
          title={
            <Space>
              📅 Day-of-Week Performance
              <InfoTip>
                <MetricTooltip
                  title="📅 Day-of-Week Performance"
                  definition="Profit and loss grouped by the day of the week you entered the trade. Reveals hidden patterns — many traders consistently lose money on specific days."
                  ranges={[
                    { label: 'All green', color: 'green' },
                    { label: 'Mixed', color: 'orange' },
                    { label: 'One big red', color: 'red' },
                  ]}
                  tip="If Mondays are consistently red, consider skipping them. Data-driven scheduling is a real edge."
                />
              </InfoTip>
            </Space>
          }
          className="card-lift"
        >
          {!data.dayOfWeekPerformance || data.dayOfWeekPerformance.length === 0 ? (
            <Empty description="No trades yet" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.dayOfWeekPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day_of_week" />
                <YAxis />
                <Tooltip
                  formatter={
                    ((value: any, name?: string) => {
                      if (name === 'Total P&L')
                        return [Number(value).toFixed(2), 'P&L'];
                      return [value, name || ''];
                    }) as any
                  }
                />
                <Legend />
                <Bar
                  dataKey="total_pnl"
                  name="Total P&L"
                  radius={[4, 4, 0, 0]}
                  animationDuration={900}
                >
                  {(data.dayOfWeekPerformance || []).map(
                    (entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={Number(entry.total_pnl) >= 0 ? '#52c41a' : '#ff4d4f'}
                      />
                    )
                  )}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* ============================================ */}
      {/* Equity Curve */}
      {/* ============================================ */}
      <div className="fade-in-up stagger-6" style={{ marginTop: 20 }}>
        <Card
          title={
            <Space>
              📈 Equity Curve
              <InfoTip>
                <MetricTooltip
                  title="📈 Equity Curve"
                  definition="Cumulative P&L over time. Shows how your account has grown (or shrunk) with each trade."
                  tip="Look at the shape, not the number. A smooth upward slope is better than a jagged one, even if the final number is lower — it means you can safely increase size."
                />
              </InfoTip>
            </Space>
          }
          className="card-lift"
        >
          {equityCurve.length === 0 ? (
            <Empty description="No trades yet" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={equityCurve}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(val) => new Date(val).toLocaleDateString()}
                />
                <YAxis />
                <Tooltip
                  formatter={(value: any) => [
                    Number(value).toFixed(2),
                    'Cumulative P&L',
                  ]}
                  labelFormatter={(val) => new Date(val as string).toLocaleString()}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="cumulative_pnl"
                  stroke="#1890ff"
                  strokeWidth={2}
                  dot={false}
                  name="Cumulative P&L"
                  animationDuration={1200}
                  animationEasing="ease-out"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* ============================================ */}
      {/* Monthly P&L */}
      {/* ============================================ */}
      <div className="fade-in-up stagger-6" style={{ marginTop: 20 }}>
        <Card
          title={
            <Space>
              📊 Monthly P&L
              <InfoTip>
                <MetricTooltip
                  title="📊 Monthly P&L"
                  definition="Profit and loss grouped by month. Reveals consistency and seasonality."
                  tip="Look for repeated patterns. If you consistently lose money in a specific month, consider reducing size or sitting out."
                />
              </InfoTip>
            </Space>
          }
          className="card-lift"
        >
          {monthlyPnl.length === 0 ? (
            <Empty description="No monthly data yet" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyPnl}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: any) => Number(value).toFixed(2)} />
                <Legend />
                <Bar
                  dataKey="monthly_pnl"
                  fill="#52c41a"
                  name="Monthly P&L"
                  animationDuration={900}
                  animationEasing="ease-out"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* ============================================ */}
      {/* Market & Bias Tables */}
      {/* ============================================ */}
      <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
        <Col xs={24} lg={12} className="fade-in-up stagger-6">
          <Card
            title={
              <Space>
                🌍 Performance by Market
                <InfoTip>
                  <MetricTooltip
                    title="🌍 Performance by Market"
                    definition="Compares your win rate and P&L across different exchanges (NSE, NASDAQ, etc.)."
                    tip="Most traders have an edge in specific markets. If you're consistently losing in one, stop trading it and double down where you win."
                  />
                </InfoTip>
              </Space>
            }
            className="card-lift"
          >
            {marketPerformance.length === 0 ? (
              <Empty description="No data" />
            ) : (
              <Table
                columns={marketColumns}
                dataSource={marketPerformance}
                rowKey="market"
                pagination={false}
                size="small"
              />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12} className="fade-in-up stagger-6">
          <Card
            title={
              <Space>
                🎯 Performance by HTF Bias
                <InfoTip>
                  <MetricTooltip
                    title="🎯 Performance by HTF Bias"
                    definition="Shows how you perform based on your higher-timeframe directional view (Bullish, Bearish, Neutral)."
                    tip="If you're consistently profitable only when your bias is Bullish, the data says: only trade long. Follow your statistically proven edge."
                  />
                </InfoTip>
              </Space>
            }
            className="card-lift"
          >
            {biasPerformance.length === 0 ? (
              <Empty description="No data" />
            ) : (
              <Table
                columns={biasColumns}
                dataSource={biasPerformance}
                rowKey="bias"
                pagination={false}
                size="small"
              />
            )}
          </Card>
        </Col>
      </Row>
    </PageContainer>
  );
};