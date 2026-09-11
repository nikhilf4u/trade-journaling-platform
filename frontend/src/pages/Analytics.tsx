import React, { useEffect, useState } from 'react';
import {
  Layout,
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Button,
  Space,
  Spin,
  message,
  Table,
  Tag,
  Empty,
  Divider,
} from 'antd';
import {
  ArrowLeftOutlined,
  ReloadOutlined,
  PercentageOutlined,
  SwapOutlined,
  RiseOutlined,
  ThunderboltOutlined,
  FallOutlined,
  SafetyOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
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
  ResponsiveContainer,
} from 'recharts';
import { analyticsApi, DashboardData } from '../services/analyticsApi';

const { Title, Text } = Typography;
const { Content } = Layout;

export const Analytics: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const navigate = useNavigate();

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

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <Spin size="large" tip="Calculating analytics..." />
      </div>
    );
  }

  if (!data) {
    return (
      <Layout style={{ minHeight: '100vh', padding: 20 }}>
        <Empty description="No analytics data available" />
      </Layout>
    );
  }

  const summary = data.summary || ({} as any);
  const equityCurve = data.equityCurve || [];
  const monthlyPnl = data.monthlyPnl || [];
  const marketPerformance = data.marketPerformance || [];
  const biasPerformance = data.biasPerformance || [];

  // ----------------------------------------------------------
  // Table columns
  // ----------------------------------------------------------
  const marketColumns = [
    {
      title: 'Market',
      dataIndex: 'market',
      key: 'market',
      render: (m: string) => <Tag color="blue">{m}</Tag>,
    },
    {
      title: 'Trades',
      dataIndex: 'total_trades',
      key: 'total_trades',
    },
    {
      title: 'P&L',
      dataIndex: 'total_pnl',
      key: 'total_pnl',
      render: (v: number) => (
        <Text
          strong
          style={{ color: Number(v) >= 0 ? '#52c41a' : '#ff4d4f' }}
        >
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
        <Text
          strong
          style={{ color: Number(v) >= 0 ? '#52c41a' : '#ff4d4f' }}
        >
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

  // ----------------------------------------------------------
  // Accuracy / R:R interpretation
  // ----------------------------------------------------------
  const accuracy = Number(summary.accuracy || 0);
  const rr = Number(summary.risk_reward_ratio || 0);
  const expectancy = Number(summary.expectancy || 0);

  const getEdgeAssessment = () => {
    if (expectancy > 0) {
      return {
        color: '#52c41a',
        icon: '✅',
        text: 'Positive edge. Keep executing.',
      };
    } else if (expectancy === 0) {
      return {
        color: '#faad14',
        icon: '⚖️',
        text: 'Break-even. Review your strategy.',
      };
    }
    return {
      color: '#ff4d4f',
      icon: '⚠️',
      text: 'Negative edge. Stop and reassess.',
    };
  };

  const edge = getEdgeAssessment();

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5', padding: 20 }}>
      <Content>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          <Space>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/dashboard')}
            >
              Back
            </Button>
            <Title level={3} style={{ margin: 0 }}>
              📈 Analytics Dashboard
            </Title>
          </Space>
          <Button icon={<ReloadOutlined />} onClick={loadData}>
            Refresh
          </Button>
        </div>

        {/* ============================================ */}
        {/* Row 1: The Big 4 KPIs */}
        {/* ============================================ */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
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

          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
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

          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Total P&L"
                value={summary.total_pnl || 0}
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

          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
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
        {/* Row 2: Secondary KPIs */}
        {/* ============================================ */}
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Profit Factor"
                value={summary.profit_factor || 0}
                precision={2}
                prefix={<FallOutlined />}
                valueStyle={{
                  color:
                    Number(summary.profit_factor) >= 1.5
                      ? '#52c41a'
                      : '#faad14',
                }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Max Drawdown"
                value={Math.abs(Number(summary.max_drawdown || 0))}
                precision={2}
                prefix={<WarningOutlined />}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Stop Loss Adherence"
                value={summary.adherence_percentage || 0}
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
                {summary.trades_with_stoploss || 0} /{' '}
                {summary.total_trades || 0} trades
              </Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Average P&L"
                value={summary.avg_pnl || 0}
                precision={2}
                valueStyle={{
                  color: Number(summary.avg_pnl) >= 0 ? '#52c41a' : '#ff4d4f',
                }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
  <Card>
    <Statistic
      title="Planned R:R"
      value={summary.avg_planned_rr || 0}
      precision={2}
      suffix=":1"
      prefix={<SwapOutlined />}
      valueStyle={{
        color: Number(summary.avg_planned_rr) >= 2.0 ? '#52c41a' : '#faad14',
      }}
    />
    <Text type="secondary" style={{ fontSize: 11 }}>
      {summary.trades_with_plan || 0} trades planned
    </Text>
  </Card>
</Col>
        </Row>

        {/* ============================================ */}
        {/* Edge Assessment */}
        {/* ============================================ */}
        <Card
          style={{
            marginTop: 20,
            background: '#f6ffed',
            borderColor: '#b7eb8f',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
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
                {accuracy.toFixed(1)}% × {Number(summary.avg_win || 0).toFixed(0)}{' '}
                − {(100 - accuracy).toFixed(1)}% ×{' '}
                {Math.abs(Number(summary.avg_loss || 0)).toFixed(0)} ={' '}
                <span style={{ color: edge.color }}>
                  {expectancy.toFixed(2)}
                </span>
              </Text>
            </div>
          </div>
        </Card>

        {/* ============================================ */}
        {/* Equity Curve */}
        {/* ============================================ */}
        <Card title="📈 Equity Curve" style={{ marginTop: 20 }}>
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
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* ============================================ */}
        {/* Monthly P&L */}
        {/* ============================================ */}
        <Card title="📊 Monthly P&L" style={{ marginTop: 20 }}>
          {monthlyPnl.length === 0 ? (
            <Empty description="No monthly data yet" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyPnl}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value: any) => Number(value).toFixed(2)}
                />
                <Legend />
                <Bar dataKey="monthly_pnl" fill="#52c41a" name="Monthly P&L" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* ============================================ */}
        {/* Market & Bias Tables side by side */}
        {/* ============================================ */}
        <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
          <Col xs={24} lg={12}>
            <Card title="🌍 Performance by Market">
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

          <Col xs={24} lg={12}>
            <Card title="🎯 Performance by HTF Bias">
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
      </Content>
    </Layout>
  );
};