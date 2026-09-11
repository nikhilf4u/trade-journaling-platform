import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Modal, Input, Typography, Tag, Space, Empty, Divider } from 'antd';
import {
  DashboardOutlined,
  UnorderedListOutlined,
  LineChartOutlined,
  PlusOutlined,
  RiseOutlined,
  FallOutlined,
  SunOutlined,
  MoonOutlined,
  LogoutOutlined,
  SearchOutlined,
  SwapOutlined,
  EnterOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { tradeApi, Trade } from '../services/tradeApi';

const { Text } = Typography;

// ----------------------------------------------------------
// Types
// ----------------------------------------------------------
interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  category: 'Navigation' | 'Actions' | 'Trades';
  keywords: string[];
  onSelect: () => void;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onOpenTradeDrawer?: (trade: Trade) => void;
  onCreateTrade?: () => void;
  onCreateBuyTrade?: () => void;
  onCreateSellTrade?: () => void;
}

const RECENT_KEY = 'commandPaletteRecent';

export const CommandPalette: React.FC<Props> = ({
  open,
  onClose,
  onOpenTradeDrawer,
  onCreateTrade,
  onCreateBuyTrade,
  onCreateSellTrade,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loadingTrades, setLoadingTrades] = useState(false);
  const [recent, setRecent] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    } catch {
      return [];
    }
  });

  const inputRef = useRef<any>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { mode, toggleTheme } = useTheme();

  // ----------------------------------------------------------
  // Load trades when palette opens
  // ----------------------------------------------------------
  useEffect(() => {
    if (!open) return;
    setQuery('');
    setSelectedIndex(0);
    const load = async () => {
      setLoadingTrades(true);
      try {
        const data = await tradeApi.getAll();
        setTrades(data.slice(0, 100)); // limit for perf
      } catch {
        setTrades([]);
      } finally {
        setLoadingTrades(false);
      }
    };
    load();
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  // ----------------------------------------------------------
  // Persist recent actions
  // ----------------------------------------------------------
  const pushRecent = (id: string) => {
    const next = [id, ...recent.filter((r) => r !== id)].slice(0, 5);
    setRecent(next);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  };

  // ----------------------------------------------------------
  // Build command list
  // ----------------------------------------------------------
  const commands: CommandItem[] = useMemo(() => {
    const list: CommandItem[] = [
      // ---------- Navigation ----------
      {
        id: 'nav.dashboard',
        title: 'Go to Dashboard',
        icon: <DashboardOutlined />,
        category: 'Navigation',
        keywords: ['home', 'overview', 'dashboard'],
        onSelect: () => {
          pushRecent('nav.dashboard');
          navigate('/dashboard');
          onClose();
        },
      },
      {
        id: 'nav.trades',
        title: 'Go to My Trades',
        icon: <UnorderedListOutlined />,
        category: 'Navigation',
        keywords: ['journal', 'list', 'trades'],
        onSelect: () => {
          pushRecent('nav.trades');
          navigate('/trades');
          onClose();
        },
      },
      {
        id: 'nav.analytics',
        title: 'Go to Analytics',
        icon: <LineChartOutlined />,
        category: 'Navigation',
        keywords: ['charts', 'kpi', 'performance', 'analytics'],
        onSelect: () => {
          pushRecent('nav.analytics');
          navigate('/analytics');
          onClose();
        },
      },

      // ---------- Actions ----------
      {
        id: 'action.newTrade',
        title: 'Log New Trade',
        subtitle: 'Open the trade form',
        icon: <PlusOutlined />,
        category: 'Actions',
        keywords: ['create', 'add', 'new', 'trade', 'log'],
        onSelect: () => {
          pushRecent('action.newTrade');
          onClose();
          onCreateTrade?.();
        },
      },
      {
        id: 'action.newBuy',
        title: 'Log Buy Trade',
        subtitle: 'Pre-fills direction = BUY',
        icon: <RiseOutlined style={{ color: '#52c41a' }} />,
        category: 'Actions',
        keywords: ['buy', 'long', 'bullish'],
        onSelect: () => {
          pushRecent('action.newBuy');
          onClose();
          onCreateBuyTrade?.();
        },
      },
      {
        id: 'action.newSell',
        title: 'Log Sell Trade',
        subtitle: 'Pre-fills direction = SELL',
        icon: <FallOutlined style={{ color: '#ff4d4f' }} />,
        category: 'Actions',
        keywords: ['sell', 'short', 'bearish'],
        onSelect: () => {
          pushRecent('action.newSell');
          onClose();
          onCreateSellTrade?.();
        },
      },
      {
        id: 'action.toggleTheme',
        title: mode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode',
        icon: mode === 'dark' ? <SunOutlined /> : <MoonOutlined />,
        category: 'Actions',
        keywords: ['theme', 'dark', 'light', 'mode'],
        onSelect: () => {
          pushRecent('action.toggleTheme');
          toggleTheme();
          onClose();
        },
      },
      {
        id: 'action.logout',
        title: 'Logout',
        icon: <LogoutOutlined />,
        category: 'Actions',
        keywords: ['sign out', 'exit', 'logout'],
        onSelect: () => {
          logout();
          navigate('/login');
          onClose();
        },
      },
    ];

    // ---------- Trade Search ----------
    if (query.trim().length >= 1) {
      const q = query.toLowerCase();
      trades
        .filter(
          (t) =>
            t.symbol.toLowerCase().includes(q) ||
            t.market.toLowerCase().includes(q) ||
            (t.notes && t.notes.toLowerCase().includes(q))
        )
        .slice(0, 20)
        .forEach((t) => {
          list.push({
            id: `trade.${t.id}`,
            title: t.symbol,
            subtitle: `${t.market} • ${t.direction} • ${t.quantity} qty • P&L ${
              t.pnl != null ? t.pnl.toFixed(2) : '—'
            }`,
            icon: <SwapOutlined />,
            category: 'Trades',
            keywords: [t.symbol, t.market, t.direction],
            onSelect: () => {
              pushRecent(`trade.${t.id}`);
              onClose();
              onOpenTradeDrawer?.(t);
            },
          });
        });
    }

    return list;
  }, [query, trades, mode, navigate, onClose, logout, toggleTheme, onOpenTradeDrawer, onCreateTrade, onCreateBuyTrade, onCreateSellTrade, recent]);

  // ----------------------------------------------------------
  // Filter commands
  // ----------------------------------------------------------
  const filtered = useMemo(() => {
    if (!query.trim()) {
      // Show recent first, then all others
      const recentItems = recent
        .map((id) => commands.find((c) => c.id === id))
        .filter((c): c is CommandItem => !!c);
      const remaining = commands.filter((c) => !recent.includes(c.id));
      return [...recentItems, ...remaining];
    }
    const q = query.toLowerCase();
    return commands.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.keywords.some((k) => k.toLowerCase().includes(q)) ||
        c.subtitle?.toLowerCase().includes(q)
    );
  }, [commands, query, recent]);

  // ----------------------------------------------------------
  // Group by category
  // ----------------------------------------------------------
  const grouped = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    filtered.forEach((c) => {
      if (!groups[c.category]) groups[c.category] = [];
      groups[c.category].push(c);
    });
    return groups;
  }, [filtered]);

  const flatList = useMemo(() => Object.values(grouped).flat(), [grouped]);

  // ----------------------------------------------------------
  // Keyboard navigation
  // ----------------------------------------------------------
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, flatList.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const item = flatList[selectedIndex];
        if (item) item.onSelect();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, flatList, selectedIndex, onClose]);

  // Auto-scroll selected item into view
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const el = list.querySelector(`[data-index="${selectedIndex}"]`);
    if (el) {
      (el as HTMLElement).scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  // ----------------------------------------------------------
  // Render
  // ----------------------------------------------------------
  let flatIndex = -1;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      closable={false}
      width={640}
      styles={{
        body: { padding: 0 },
        content: { padding: 0, overflow: 'hidden', borderRadius: 12 },
      }}
      maskClosable
      destroyOnClose
      style={{ top: 80 }}
    >
      {/* Search Input */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <SearchOutlined style={{ fontSize: 18, color: '#8c8c8c' }} />
        <Input
          ref={inputRef}
          variant="borderless"
          placeholder="Search trades, navigate, or run commands..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ fontSize: 15, padding: 0 }}
          autoFocus
        />
        <Tag style={{ margin: 0, fontSize: 11 }}>ESC</Tag>
      </div>

      {/* Results */}
      <div
        ref={listRef}
        style={{ maxHeight: 420, overflowY: 'auto', padding: '8px 0' }}
      >
        {flatList.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              loadingTrades ? 'Loading trades...' : 'No results found'
            }
            style={{ padding: '40px 0' }}
          />
        ) : (
          Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <div
                style={{
                  padding: '8px 16px 4px 16px',
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#8c8c8c',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                {category}
              </div>
              {items.map((item) => {
                flatIndex += 1;
                const idx = flatIndex;
                const isSelected = idx === selectedIndex;
                return (
                  <div
                    key={item.id}
                    data-index={idx}
                    onClick={() => item.onSelect()}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    style={{
                      padding: '10px 16px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      background: isSelected ? '#e6f7ff' : 'transparent',
                      borderLeft: isSelected
                        ? '3px solid #1890ff'
                        : '3px solid transparent',
                      transition: 'background 0.1s ease',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 18,
                        color: isSelected ? '#1890ff' : '#595959',
                        display: 'flex',
                      }}
                    >
                      {item.icon}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 500,
                          color: isSelected ? '#1890ff' : '#262626',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.title}
                      </div>
                      {item.subtitle && (
                        <div
                          style={{
                            fontSize: 12,
                            color: '#8c8c8c',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {item.subtitle}
                        </div>
                      )}
                    </div>
                    {isSelected && (
                      <EnterOutlined
                        style={{ fontSize: 12, color: '#1890ff' }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <Divider style={{ margin: 0 }} />
      <div
        style={{
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 11,
          color: '#8c8c8c',
        }}
      >
        <Space size={16}>
          <span>
            <Tag style={{ fontSize: 10, margin: 0 }}>
              <ArrowUpOutlined /> <ArrowDownOutlined />
            </Tag>
            Navigate
          </span>
          <span>
            <Tag style={{ fontSize: 10, margin: 0 }}>↵</Tag>
            Select
          </span>
          <span>
            <Tag style={{ fontSize: 10, margin: 0 }}>ESC</Tag>
            Close
          </span>
        </Space>
        <Text type="secondary" style={{ fontSize: 11 }}>
          {flatList.length} result{flatList.length !== 1 ? 's' : ''}
        </Text>
      </div>
    </Modal>
  );
};