import React, { useState, useCallback } from 'react';
import { ProLayout } from '@ant-design/pro-components';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  DashboardOutlined,
  UnorderedListOutlined,
  LineChartOutlined,
  LogoutOutlined,
  FundOutlined,
  UserOutlined,
  SearchOutlined,
  SunOutlined,
  MoonOutlined,
  AppstoreOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Dropdown, Button, Tooltip } from 'antd';
import { CommandPalette } from '../components/CommandPalette';
import { useKeyboardShortcut } from '../hooks/useKeyboardShortcut';

const MainLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { mode, toggleTheme } = useTheme();
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Cmd+K / Ctrl+K opens the command palette
  useKeyboardShortcut(
    'k',
    useCallback(() => setCommandPaletteOpen(true), []),
    { meta: true }
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuData = [
    { path: '/dashboard', name: 'Dashboard', icon: <DashboardOutlined /> },
    { path: '/overview', name: 'Overview', icon: <AppstoreOutlined /> },  
    { path: '/trades', name: 'My Trades', icon: <UnorderedListOutlined /> },
    { path: '/analytics', name: 'Analytics', icon: <LineChartOutlined /> },
    { path: '/calendar', name: 'Calendar', icon: <CalendarOutlined /> },     
  ];

  return (
    <>
      <ProLayout
        title="Trade Journal"
        logo={<FundOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
        layout="mix"
        fixSiderbar
        fixedHeader
        location={{ pathname: location.pathname }}
        route={{ routes: menuData }}
        menuItemRender={(item, dom) => <Link to={item.path || '/'}>{dom}</Link>}
        token={{
          sider: {
            colorMenuBackground: mode === 'dark' ? '#141414' : '#001529',
            colorTextMenu: mode === 'dark' ? '#e6e6e6' : '#ffffff',
            colorTextMenuSelected: '#1890ff',
            colorBgMenuItemSelected: 'rgba(24,144,255,0.15)',
          },
          header: {
            colorBgHeader: mode === 'dark' ? '#1f1f1f' : '#ffffff',
            colorHeaderTitle: mode === 'dark' ? '#e6e6e6' : '#000000',
          },
        }}
        actionsRender={() => [
          <Tooltip key="search" title="Search (⌘K)">
            <Button
              type="text"
              onClick={() => setCommandPaletteOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <SearchOutlined />
              <span
                style={{
                  fontSize: 11,
                  color: '#8c8c8c',
                  padding: '2px 6px',
                  border: '1px solid #d9d9d9',
                  borderRadius: 4,
                }}
              >
                ⌘K
              </span>
            </Button>
          </Tooltip>,
          <Tooltip
            key="theme"
            title={mode === 'dark' ? 'Light Mode' : 'Dark Mode'}
          >
            <Button
              type="text"
              icon={mode === 'dark' ? <SunOutlined /> : <MoonOutlined />}
              onClick={toggleTheme}
            />
          </Tooltip>,
        ]}
        avatarProps={{
          icon: <UserOutlined />,
          size: 'small',
          title: user?.email || 'User',
          render: (_, dom) => (
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'logout',
                    icon: <LogoutOutlined />,
                    label: 'Logout',
                    onClick: handleLogout,
                  },
                ],
              }}
            >
              <div style={{ cursor: 'pointer' }}>{dom}</div>
            </Dropdown>
          ),
        }}
        footerRender={() => (
          <div
            style={{
              textAlign: 'center',
              padding: '16px 0',
              color: '#999',
              fontSize: 12,
            }}
          >
            Trade Journal © {new Date().getFullYear()} | Built with Spring Boot + React
          </div>
        )}
      >
        <Outlet />
      </ProLayout>

      <CommandPalette
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onOpenTradeDrawer={(_trade) => {
          // Navigate to trades — the drawer will open once we wire deeper
          navigate('/trades');
        }}
        onCreateTrade={() => navigate('/trades')}
        onCreateBuyTrade={() => navigate('/trades')}
        onCreateSellTrade={() => navigate('/trades')}
      />
    </>
  );
};

export default MainLayout;