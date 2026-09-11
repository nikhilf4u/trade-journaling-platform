import React from 'react';
import { Button, Typography, Space } from 'antd';

const { Title, Text } = Typography;

interface Props {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<Props> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 20px',
        textAlign: 'center',
      }}
    >
      {/* Icon Circle */}
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 36,
          color: '#1890ff',
          marginBottom: 20,
        }}
      >
        {icon || '📋'}
      </div>

      <Title level={4} style={{ margin: 0 }}>
        {title}
      </Title>

      {description && (
        <Text
          type="secondary"
          style={{ marginTop: 8, maxWidth: 400, fontSize: 14 }}
        >
          {description}
        </Text>
      )}

      {actionLabel && onAction && (
        <Space style={{ marginTop: 24 }}>
          <Button type="primary" size="large" onClick={onAction}>
            {actionLabel}
          </Button>
        </Space>
      )}
    </div>
  );
};