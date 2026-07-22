import { Button, Layout, Menu } from 'antd';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  AppstoreOutlined,
  BuildOutlined,
  DashboardOutlined,
  DollarOutlined,
  GlobalOutlined,
  HeartOutlined,
  HistoryOutlined,
  HomeOutlined,
  InboxOutlined,
  LogoutOutlined,
  PictureOutlined,
  ProjectOutlined,
  SettingOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useAuth } from '../auth/AuthContext';

const items = [
  { key: '/', icon: <DashboardOutlined />, label: 'Дашборд' },
  { key: '/home', icon: <HomeOutlined />, label: 'Главная' },
  { key: '/services', icon: <AppstoreOutlined />, label: 'Услуги' },
  { key: '/pricing', icon: <DollarOutlined />, label: 'Цены' },
  { key: '/projects', icon: <ProjectOutlined />, label: 'Работы' },
  { key: '/about', icon: <UserOutlined />, label: 'Обо мне' },
  { key: '/experience', icon: <HistoryOutlined />, label: 'Опыт' },
  { key: '/stack', icon: <BuildOutlined />, label: 'Стек' },
  { key: '/hobbies', icon: <HeartOutlined />, label: 'Вне работы' },
  { key: '/settings', icon: <SettingOutlined />, label: 'Настройки' },
  { key: '/seo', icon: <GlobalOutlined />, label: 'SEO' },
  { key: '/leads', icon: <InboxOutlined />, label: 'Заявки' },
  { key: '/media', icon: <PictureOutlined />, label: 'Медиа' },
];

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const selected =
    items.find((i) => i.key !== '/' && location.pathname.startsWith(i.key))?.key ?? '/';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Sider
        theme="light"
        width={240}
        breakpoint="lg"
        collapsedWidth={0}
        style={{ borderRight: '1px solid rgba(23,18,31,0.08)' }}
      >
        <div style={{ padding: '20px 24px', fontWeight: 800, fontSize: 20 }}>
          alcha<span style={{ color: '#5B34C9' }}>.dev</span>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selected]}
          items={items}
          onClick={(e) => navigate(e.key)}
          style={{ borderInlineEnd: 'none' }}
        />
      </Layout.Sider>
      <Layout>
        <Layout.Header
          style={{
            background: '#fff',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 16,
            borderBottom: '1px solid rgba(23,18,31,0.08)',
            paddingInline: 24,
          }}
        >
          <span style={{ color: '#5F5768' }}>{user?.email}</span>
          <Button icon={<LogoutOutlined />} onClick={() => logout()}>
            Выйти
          </Button>
        </Layout.Header>
        <Layout.Content
          style={{ padding: 24, width: '100%', maxWidth: 1200, margin: '0 auto' }}
        >
          <Outlet />
        </Layout.Content>
      </Layout>
    </Layout>
  );
}
