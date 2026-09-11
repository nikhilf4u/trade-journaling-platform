import React, { useState } from 'react';
import { Form, Input, Button, Typography, Card, message } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';

const { Title } = Typography;
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081';

export const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: { newPassword: string }) => {
    if (!token) {
      message.error('Invalid or missing reset token.');
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/auth/reset-password`, {
        token: token,
        newPassword: values.newPassword,
      });
      message.success('Password reset successfully!');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err: any) {
      message.error(err.response?.data?.error || 'Failed to reset password. Token may have expired.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Card style={{ width: 400, textAlign: 'center' }}>
          <Title level={3}>❌ Invalid Link</Title>
          <p>The password reset link is missing or invalid.</p>
          <Link to="/forgot-password">Request a new link</Link>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
      <Card style={{ width: 400 }}>
        <Title level={3} style={{ textAlign: 'center' }}>Reset Password</Title>
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item label="New Password" name="newPassword" rules={[{ required: true, min: 6 }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="Enter new password" size="large" />
          </Form.Item>
          <Form.Item label="Confirm Password" name="confirmPassword" dependencies={['newPassword']}
            rules={[
              { required: true },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Passwords do not match'));
                },
              }),
            ]}>
            <Input.Password placeholder="Confirm new password" size="large" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block size="large">
            Reset Password
          </Button>
        </Form>
      </Card>
    </div>
  );
};