import React, { useEffect, useState } from 'react';
import { Card, Button, Steps, Space, Typography } from 'antd';
import {
  CloseOutlined,
  UnorderedListOutlined,
  LineChartOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Text, Title } = Typography;

const STORAGE_KEY = 'onboardingDismissed';

export const OnboardingCard: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
      setVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <Card
      style={{
        marginBottom: 20,
        background: 'linear-gradient(135deg, #e6f7ff 0%, #f0f5ff 100%)',
        borderColor: '#91d5ff',
        position: 'relative',
      }}
      styles={{
        body: { padding: 24 },
      }}
    >
      <Button
        type="text"
        icon={<CloseOutlined />}
        onClick={handleDismiss}
        style={{ position: 'absolute', top: 8, right: 8 }}
        aria-label="Dismiss"
      />

      <Title level={4} style={{ marginTop: 0 }}>
        👋 Welcome to Your Trade Journal
      </Title>
      <Text type="secondary">
        Here's how to get started in 3 simple steps:
      </Text>

      <Steps
        direction="vertical"
        size="small"
        style={{ marginTop: 20 }}
        items={[
          {
            title: 'Log Your First Trade',
            description: 'Record entry, exit, stop-loss, target, and upload screenshots.',
            icon: <FileTextOutlined style={{ color: '#1890ff' }} />,
          },
          {
            title: 'Track Your Performance',
            description: 'View your Accuracy, Risk/Reward, and P&L in the Analytics dashboard.',
            icon: <LineChartOutlined style={{ color: '#52c41a' }} />,
          },
          {
            title: 'Learn From Patterns',
            description: 'Discover which markets, biases, and setups work best for you.',
            icon: <UnorderedListOutlined style={{ color: '#faad14' }} />,
          },
        ]}
      />

      <Space style={{ marginTop: 16 }}>
        <Button type="primary" onClick={() => navigate('/trades')}>
          Log My First Trade
        </Button>
        <Button type="text" onClick={handleDismiss}>
          Skip Tour
        </Button>
      </Space>
    </Card>
  );
};