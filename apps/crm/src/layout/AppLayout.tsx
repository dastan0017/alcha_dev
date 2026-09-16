import { useState } from 'react';
import { Button, Layout, Menu, Tooltip } from 'antd';
import { Outlet, useLocation, useMatch, useNavigate } from 'react-router-dom';
import {
  DesktopOutlined,
  FileSearchOutlined,
  InboxOutlined,
  LogoutOutlined,
  PictureOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useAuth } from '../auth/AuthContext';

const items = [
  { key: '/site', icon: <DesktopOutlined />, label: 'Сайт' },
  { key: '/leads', icon: <InboxOutlined />, label: 'Заявки' },
  { key: '/media', icon: <PictureOutlined />, label: 'Медиа' },
  { key: '/seo', icon: <FileSearchOutlined />, label: 'SEO' },
  { key: '/settings', icon: <SettingOutlined />, label: 'Настройки' },
];

const siderStyle = { borderRight: '1px solid rgba(23,18,31,0.08)' };

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div
      style={{
        padding: compact ? '20px 0' : '20px 24px',
        textAlign: compact ? 'center' : 'left',
        fontWeight: 800,
        fontSize: 20,
        whiteSpace: 'nowrap',
      }}
    >
      {compact ? 'a' : 'alcha'}
      <span style={{ color: '#5B34C9' }}>{compact ? '.' : '.dev'}</span>
    </div>
  );
}

function Nav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const selected = items.find((i) => pathname.startsWith(i.key))?.key;

  return (
    <Menu
      mode="inline"
      selectedKeys={selected ? [selected] : []}
      items={items}
      onClick={(e) => navigate(e.key)}
      style={{ borderInlineEnd: 'none' }}
    />
  );
}

/** `/site`: a collapsible icon rail and a full-bleed content area owned by the editor. */
function EditorShell() {
  const { logout } = useAuth();
  const [collapsed, setCollapsed] = useState(true);

  return (
    <Layout hasSider style={{ height: '100vh' }}>
      <Layout.Sider
        theme="light"
        width={240}
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        collapsedWidth={64}
        style={siderStyle}
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Logo compact={collapsed} />
          <Nav />
          <Tooltip title="Выйти" placement="right">
            <Button
              type="text"
              icon={<LogoutOutlined />}
              aria-label="Выйти"
              onClick={() => logout()}
              style={{ margin: 'auto auto 12px' }}
            />
          </Tooltip>
        </div>
      </Layout.Sider>
      <Layout.Content style={{ height: '100vh', overflow: 'hidden' }}>
        <Outlet />
      </Layout.Content>
    </Layout>
  );
}

function PageShell() {
  const { user, logout } = useAuth();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Sider theme="light" width={240} breakpoint="lg" collapsedWidth={0} style={siderStyle}>
        <Logo />
        <Nav />
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

export function AppLayout() {
  return useMatch('/site/*') ? <EditorShell /> : <PageShell />;
}
