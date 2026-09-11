import React, { useState } from 'react';
import { Form, Input, Button, Typography, Card, message, InputNumber, Select } from 'antd';
import { UserOutlined, LockOutlined, DollarOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const { Title } = Typography;

export const Register: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      await register(values);
      message.success('Registration successful! Redirecting...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err: any) {
      message.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '90vh', padding: '20px' }}>
      <Card style={{ width: 450 }}>
        <Title level={3} style={{ textAlign: 'center' }}>✍️ Create Account</Title>
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item label="Email" name="email" rules={[{ required: true, type: 'email' }]}>
            <Input prefix={<UserOutlined />} placeholder="your@email.com" size="large" />
          </Form.Item>
          <Form.Item label="Password" name="password" rules={[{ required: true, min: 6 }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="Min 6 characters" size="large" />
          </Form.Item>
          <Form.Item label="Base Currency" name="baseCurrency" initialValue="USD">
            <Select size="large">
              <Select.Option value="USD">USD ($)</Select.Option>
              <Select.Option value="INR">INR (₹)</Select.Option>
              <Select.Option value="EUR">EUR (€)</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="Total Capital" name="totalCapital" initialValue={50000}>
            <InputNumber prefix={<DollarOutlined />} style={{ width: '100%' }} size="large" min={100} step={1000} />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <Form.Item label="Risk %" name="riskPerTradePercent" initialValue={1.0}>
              <InputNumber style={{ width: '100%' }} size="large" min={0.1} step={0.1} />
            </Form.Item>
            <Form.Item label="Daily Loss %" name="maxDailyLossPercent" initialValue={3.0}>
              <InputNumber style={{ width: '100%' }} size="large" min={0.1} step={0.1} />
            </Form.Item>
            <Form.Item label="Drawdown %" name="maxDrawdownPercent" initialValue={10.0}>
              <InputNumber style={{ width: '100%' }} size="large" min={0.1} step={0.1} />
            </Form.Item>
          </div>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block size="large">
              Register
            </Button>
          </Form.Item>
        </Form>
        <div style={{ textAlign: 'center' }}>
          <Link to="/login">Already have an account? Sign in</Link>
        </div>
      </Card>
    </div>
  );
};