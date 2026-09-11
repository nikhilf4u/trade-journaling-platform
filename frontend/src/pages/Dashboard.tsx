import React from 'react';
import { Card, Typography, Row, Col, Statistic, Button, Layout, Space } from 'antd';
import {
  LogoutOutlined,
  UserOutlined,
  DollarOutlined,
  SafetyOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LineChartOutlined } from '@ant-design/icons';

const { Title } = Typography;
const { Content } = Layout;

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5', padding: 20 }}>
      <Content>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          <Title level={2}>📊 Trade Journal Dashboard</Title>
          <Space>
  <Button
    type="primary"
    icon={<LineChartOutlined />}
    onClick={() => navigate('/analytics')}
    style={{ background: '#52c41a', borderColor: '#52c41a' }}
  >
    Analytics
  </Button>
  <Button
    type="primary"
    icon={<UnorderedListOutlined />}
    onClick={() => navigate('/trades')}
  >
    My Trades
  </Button>
  <Button icon={<LogoutOutlined />} onClick={handleLogout} danger>
    Logout
  </Button>
</Space>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Card>
              <Statistic
                title="Welcome"
                value={user?.email || 'N/A'}
                prefix={<UserOutlined />}
                valueStyle={{ fontSize: 18 }}
              />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card>
              <Statistic
                title="Total Capital"
                value={user?.totalCapital || 0}
                prefix={<DollarOutlined />}
                precision={2}
              />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card>
              <Statistic
                title="Base Currency"
                value={user?.baseCurrency || 'USD'}
                prefix={<SafetyOutlined />}
              />
            </Card>
          </Col>
        </Row>

        <Card
          style={{
            marginTop: 20,
            background: '#e6f7ff',
            borderColor: '#91d5ff',
          }}
        >
          <Typography.Text strong>
            ✅ Phase 2 complete! You can log trades, upload screenshots, and
            track P&L.
          </Typography.Text>
          <br />
          <Typography.Text type="secondary">
            🚀 Phase 3 (Analytics with Kafka + Redis) coming next.
          </Typography.Text>
        </Card>
      </Content>
    </Layout>
  );
};