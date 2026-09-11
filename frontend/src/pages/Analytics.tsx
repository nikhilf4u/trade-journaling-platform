import React, { useEffect, useState } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import {
  Card,
  Row,
  Col,
  Typography,
  Button,
  Space,
  Spin,
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
} from '@ant-design/icons';
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
const { Title, Text } = Typography;

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
              title="Accuracy"
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
              title="Risk / Reward"
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
              title="Total P&L"
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
              title="Expectancy"
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
              title="Profit Factor"
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
              title="Max Drawdown"
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
              title="Stop Loss Adherence"
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
              title="Average P&L"
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
{/* Discipline Matrix */}
{/* ============================================ */}
<BehavioralAnalysis summary={summary} />


      {/* ============================================ */}
      {/* Equity Curve */}
      {/* ============================================ */}
      <div className="fade-in-up stagger-6" style={{ marginTop: 20 }}>
        <Card title="📈 Equity Curve" className="card-lift">
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
                  labelFormatter={(val) => new Date(val).toLocaleString()}
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
        <Card title="📊 Monthly P&L" className="card-lift">
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
          <Card title="🌍 Performance by Market" className="card-lift">
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
          <Card title="🎯 Performance by HTF Bias" className="card-lift">
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
            <AntTooltip title="Risk-adjusted return. > 1 is good, > 2 is excellent.">
              <InfoCircleOutlined style={{ color: '#8c8c8c' }} />
            </AntTooltip>
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
            <AntTooltip title="Like Sharpe but only penalizes downside volatility.">
              <InfoCircleOutlined style={{ color: '#8c8c8c' }} />
            </AntTooltip>
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
            <AntTooltip title="Total return divided by max drawdown.">
              <InfoCircleOutlined style={{ color: '#8c8c8c' }} />
            </AntTooltip>
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
{/* R-Multiple Distribution */}
{/* ============================================ */}
<div className="fade-in-up stagger-6" style={{ marginTop: 20 }}>
  <Card
    title={
      <Space>
        🎯 R-Multiple Distribution
        <Tooltip title="How much you make/lose per unit of risk. A +2R trade means you made 2× your risk.">
          <InfoCircleOutlined style={{ color: '#8c8c8c' }} />
        </Tooltip>
      </Space>
    }
    className="card-lift"
    extra={
      summary.avg_r_multiple != null && (
        <Space>
          <Tag color={Number(summary.avg_r_multiple) >= 0 ? 'green' : 'red'}>
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
          <Tooltip
            formatter={(value: any) => [`${value} trades`, 'Count']}
          />
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
                fill={entry.bucket.startsWith('-') || entry.bucket.startsWith('<') ? '#ff4d4f' : '#52c41a'}
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
          color: summary.current_streak_type === 'WIN' ? '#52c41a' : '#ff4d4f',
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
    title="📅 Day-of-Week Performance"
    className="card-lift"
    extra={
      <Tooltip title="P&L by day. Spot which days you should avoid trading.">
        <InfoCircleOutlined style={{ color: '#8c8c8c' }} />
      </Tooltip>
    }
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
            formatter={(value: any, name: string) => {
              if (name === 'Total P&L') return [Number(value).toFixed(2), 'P&L'];
              return [value, name];
            }}
          />
          <Legend />
          <Bar
            dataKey="total_pnl"
            name="Total P&L"
            radius={[4, 4, 0, 0]}
            animationDuration={900}
          >
            {(data.dayOfWeekPerformance || []).map((entry: any, index: number) => (
              <Cell
                key={`cell-${index}`}
                fill={Number(entry.total_pnl) >= 0 ? '#52c41a' : '#ff4d4f'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    )}
  </Card>
</div>
    </PageContainer>
  );
};