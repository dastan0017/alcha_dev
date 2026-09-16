import { useState } from 'react';
import { App, Button, Card, Form, Input } from 'antd';
import { Navigate, useNavigate } from 'react-router-dom';
import type { LoginInput } from '@alcha/shared';
import { useAuth } from '../auth/AuthContext';

export function LoginPage() {
  const { login, user, ready } = useAuth();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);

  if (ready && user) {
    return <Navigate to="/leads" replace />;
  }

  const onFinish = async (values: LoginInput) => {
    setLoading(true);
    try {
      await login(values);
      navigate('/leads', { replace: true });
    } catch {
      message.error('Неверный email или пароль');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', background: '#F4F0F8' }}>
      <Card style={{ width: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 20, fontWeight: 800, fontSize: 24 }}>
          alcha<span style={{ color: '#5B34C9' }}>.dev</span> CRM
        </div>
        <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, type: 'email', message: 'Введите email' }]}
          >
            <Input autoComplete="username" placeholder="admin@alcha.dev" />
          </Form.Item>
          <Form.Item
            name="password"
            label="Пароль"
            rules={[{ required: true, message: 'Введите пароль' }]}
          >
            <Input.Password autoComplete="current-password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading}>
            Войти
          </Button>
        </Form>
      </Card>
    </div>
  );
}
