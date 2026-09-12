import React, { useEffect, useState } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { Card, Row, Col, Button, Space } from 'antd';
import {
  UserOutlined,
  DollarOutlined,
  SafetyOutlined,
  UnorderedListOutlined,
  LineChartOutlined,
  RiseOutlined,
  FallOutlined,
  PercentageOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { analyticsApi } from '../services/analyticsApi';
import { AnimatedStatistic } from '../components/AnimatedStatistic';
import { OnboardingCard } from '../components/OnboardingCard';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await analyticsApi.getSummary();
        setSummary(data || {});
      } catch (err) {
        // Silent fail — new users have no trades yet
        console.log('No summary data yet');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <PageContainer
      header={{
         title: (
      <Space>
        <span className="live-dot" />
        <span>📊 Dashboard</span>
      </Space>
    ),
        subTitle: `Welcome back, ${user?.email || 'Trader'}`,
        extra: [
          <Button
            key="trades"
            icon={<UnorderedListOutlined />}
            onClick={() => navigate('/trades')}
          >
            My Trades
          </Button>,
          <Button
            key="analytics"
            type="primary"
            icon={<LineChartOutlined />}
            onClick={() => navigate('/analytics')}
          >
            Analytics
          </Button>,
        ],
      }}
    >
      <OnboardingCard />
      {/* Account Info */}
{/* Account Info */}
<Row gutter={[16, 16]}>
  <Col xs={24} md={8} className="fade-in-up stagger-1">
    <Card className="card-lift">
      <AnimatedStatistic
        title="Total Capital"
        value={user?.totalCapital || 0}
        precision={2}
        prefix={<DollarOutlined />}
        valueStyle={{ color: '#1890ff' }}
      />
    </Card>
  </Col>
  <Col xs={24} md={8} className="fade-in-up stagger-2">
    <Card className="card-lift">
      <AnimatedStatistic
        title="Base Currency"
        value={0}
        prefix={<SafetyOutlined />}
        suffix={user?.baseCurrency || 'USD'}
        valueStyle={{ fontSize: 24, fontWeight: 500, color: '#52c41a' }}
      />
    </Card>
  </Col>
  <Col xs={24} md={8} className="fade-in-up stagger-3">
    <Card className="card-lift">
      <AnimatedStatistic
        title="Account"
        value={0}
        prefix={<UserOutlined />}
        suffix={user?.email || 'N/A'}
        valueStyle={{ fontSize: 14, fontWeight: 500 }}
      />
    </Card>
  </Col>
</Row>

{/* Quick Analytics Preview */}
{!loading && (
  <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
    <Col xs={24} sm={12} md={6} className="fade-in-up stagger-1">
      <Card className="card-lift">
        <AnimatedStatistic
          title="Total Trades"
          value={summary.total_trades || 0}
        />
      </Card>
    </Col>
    <Col xs={24} sm={12} md={6} className="fade-in-up stagger-2">
      <Card className="card-lift">
        <AnimatedStatistic
          title="Accuracy"
          value={summary.accuracy || 0}
          precision={1}
          prefix={<PercentageOutlined />}
          suffix="%"
          valueStyle={{
            color: (summary.accuracy || 0) >= 50 ? '#52c41a' : '#faad14',
          }}
        />
      </Card>
    </Col>
    <Col xs={24} sm={12} md={6} className="fade-in-up stagger-3">
      <Card className="card-lift">
        <AnimatedStatistic
          title="Total P&L"
          value={summary.total_pnl || 0}
          precision={2}
          prefix={
            (summary.total_pnl || 0) >= 0 ? <RiseOutlined /> : <FallOutlined />
          }
          valueStyle={{
            color: (summary.total_pnl || 0) >= 0 ? '#52c41a' : '#ff4d4f',
          }}
        />
      </Card>
    </Col>
    <Col xs={24} sm={12} md={6} className="fade-in-up stagger-4">
      <Card className="card-lift">
        <AnimatedStatistic
          title="Risk / Reward"
          value={summary.risk_reward_ratio || 0}
          precision={2}
          suffix=":1"
          valueStyle={{
            color: (summary.risk_reward_ratio || 0) >= 1.5 ? '#52c41a' : '#faad14',
          }}
        />
      </Card>
    </Col>
  </Row>
)}

      {/* Getting Started prompt */}
      {(summary.total_trades || 0) === 0 && !loading && (
        <Card
          style={{
            marginTop: 16,
            background: '#e6f7ff',
            borderColor: '#91d5ff',
          }}
        >
          <Space direction="vertical" size="middle">
            <strong style={{ fontSize: 16 }}>🚀 Get Started</strong>
            <span>
              You haven't logged any trades yet. Click "My Trades" above to add
              your first trade.
            </span>
            <Button type="primary" onClick={() => navigate('/trades')}>
              Log My First Trade
            </Button>
          </Space>
        </Card>
      )}
    </PageContainer>
  );
};