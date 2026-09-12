import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import {
  Button,
  Typography,
  Space,
  Card,
  message,
  Select,
  Image,
  Tooltip,
  Modal,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { AgGridReact } from 'ag-grid-react';
import {
  ColDef,
  ModuleRegistry,
  AllCommunityModule,
  ICellRendererParams,
} from 'ag-grid-community';
import { tradeApi, Trade, TradeScreenshot } from '../services/tradeApi';
import { TradeFormModal } from '../components/TradeFormModal';
import { useTheme } from '../context/ThemeContext';
import { EmptyState } from '../components/EmptyState';
import { notifySuccess, notifyError } from '../utils/notify';
import { TradeDetailDrawer } from '../components/TradeDetailDrawer';

// Register all community modules (required for AG Grid v32+)
ModuleRegistry.registerModules([AllCommunityModule]);

const { Text } = Typography;

export const Trades: React.FC = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [marketFilter, setMarketFilter] = useState<string | undefined>(undefined);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const { mode } = useTheme();
  const hasFilter = !!marketFilter;
  // ----------------------------------------------------------
  // Load trades
  // ----------------------------------------------------------
  const loadTrades = useCallback(async () => {
    setLoading(true);
    try {
      const data = await tradeApi.getAll(marketFilter);
      setTrades(data);
    } catch (err: any) {
      message.error('Failed to load trades');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [marketFilter]);

  useEffect(() => {
    loadTrades();
  }, [loadTrades]);

  // ----------------------------------------------------------
  // Delete trade
  // ----------------------------------------------------------
  const handleDelete = async (id: number, symbol: string) => {
    try {
      await tradeApi.delete(id);
      notifySuccess('Trade Deleted', `"${symbol}" has been removed from your journal.`);
      loadTrades();
    } catch (err: any) {
      notifyError('Failed to Delete Trade', err.response?.data?.error || 'An error occurred while deleting the trade.');
    }
  };

  // ----------------------------------------------------------
  // Column definitions
  // ----------------------------------------------------------
  const columnDefs: ColDef<Trade>[] = useMemo<ColDef<Trade>[]>(
    () => [
      {
        field: 'entryDate',
        headerName: 'Date',
        valueFormatter: (params) =>
          params.value ? new Date(params.value).toLocaleDateString() : '—',
        filter: 'agDateColumnFilter',
        width: 110,
      },
      {
        field: 'market',
        headerName: 'Market',
        cellRenderer: (params: ICellRendererParams) => (
          <span
            style={{
              background: '#e6f7ff',
              color: '#1890ff',
              padding: '2px 8px',
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            {params.value}
          </span>
        ),
        width: 100,
      },
        {
            field: 'symbol',
            headerName: 'Symbol',
            filter: true,
            width: 110,
            cellStyle: () => ({ fontWeight: 'bold' }),
        },
      {
        field: 'direction',
        headerName: 'Direction',
        cellRenderer: (params: ICellRendererParams) => (
          <span
            style={{
              color: params.value === 'BUY' ? '#52c41a' : '#ff4d4f',
              fontWeight: 'bold',
            }}
          >
            {params.value === 'BUY' ? '🟢 BUY' : '🔴 SELL'}
          </span>
        ),
        width: 100,
      },
      {
        field: 'entryPrice',
        headerName: 'Entry',
        valueFormatter: (params) => params.value?.toFixed(2) ?? '—',
        width: 90,
        type: 'numericColumn',
      },
      {
        field: 'exitPrice',
        headerName: 'Exit',
        valueFormatter: (params) => params.value?.toFixed(2) ?? '—',
        width: 90,
        type: 'numericColumn',
      },
      {
        field: 'stoploss',
        headerName: 'Stop Loss',
        width: 100,
        type: 'numericColumn',
        valueFormatter: (params) =>
          params.value != null ? params.value.toFixed(2) : '—',
        cellStyle: { color: '#faad14', fontWeight: 500 },
      },
      {
        field: 'target',
        headerName: 'Target',
        width: 100,
        type: 'numericColumn',
        valueFormatter: (params) =>
          params.value != null ? params.value.toFixed(2) : '—',
        cellStyle: { color: '#52c41a', fontWeight: 500 },
      },
      {
        field: 'quantity',
        headerName: 'Qty',
        width: 70,
        type: 'numericColumn',
      },
      {
        field: 'pnl',
        headerName: 'P&L',
        width: 110,
        sort: 'desc',
        cellStyle: (params) => ({
          color: params.value >= 0 ? '#52c41a' : '#ff4d4f',
          fontWeight: 'bold',
        }),
        valueFormatter: (params) =>
          params.value != null
            ? (params.value >= 0 ? '+' : '') + params.value.toFixed(2)
            : '—',
        type: 'numericColumn',
      },
      {
  headerName: 'Missed R',
  width: 100,
  valueGetter: (params) => {
    const t = params.data;
    if (!t?.mfe || !t?.stoploss || !t?.entryPrice) return null;
    const risk = Math.abs(t.entryPrice - t.stoploss);
    if (risk === 0) return null;
    if (t.direction === 'BUY') return (t.mfe - t.exitPrice) / risk;
    return (t.exitPrice - t.mfe) / risk;
  },
  cellRenderer: (params: ICellRendererParams) => {
    const val = params.value;
    if (val == null) return <Text type="secondary">—</Text>;
    const isPositive = val > 0;
    return (
      <Tooltip
        title={
          isPositive
            ? `You could have made ${val.toFixed(2)}R more`
            : `You captured well (or price never went higher)`
        }
      >
        <span
          style={{
            color: isPositive ? '#faad14' : '#52c41a',
            fontWeight: 600,
            fontSize: 12,
          }}
        >
          {isPositive ? '+' : ''}
          {val.toFixed(2)}R
        </span>
      </Tooltip>
    );
  },
},
      {
        field: 'longTimeFrameBias',
        headerName: 'HTF Bias',
        width: 130,
        cellRenderer: (params: ICellRendererParams) => {
          if (!params.value) return <Text type="secondary">—</Text>;
          const biasMap: Record<string, { color: string; label: string }> = {
            STRONG_BULLISH: { color: '#52c41a', label: '🟢🟢 Strong Bull' },
            BULLISH: { color: '#52c41a', label: '🟢 Bullish' },
            NEUTRAL: { color: '#8c8c8c', label: '⚪ Neutral' },
            BEARISH: { color: '#ff4d4f', label: '🔴 Bearish' },
            STRONG_BEARISH: { color: '#ff4d4f', label: '🔴🔴 Strong Bear' },
          };
          const b = biasMap[params.value] || {
            color: '#000',
            label: params.value,
          };
          return (
            <span style={{ color: b.color, fontSize: 12, fontWeight: 500 }}>
              {b.label}
            </span>
          );
        },
      },
      {
        field: 'screenshots',
        headerName: 'Screenshots',
        width: 150,
        sortable: false,
        filter: false,
        cellRenderer: (params: ICellRendererParams) => {
          const screenshots = params.value as TradeScreenshot[] | undefined;
          if (!screenshots || screenshots.length === 0) {
            return <Text type="secondary">—</Text>;
          }
          return (
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <Image.PreviewGroup>
                {screenshots.slice(0, 3).map((s, i) => (
                  <Image
                    key={s.id || i}
                    src={s.url}
                    width={35}
                    height={35}
                    style={{
                      objectFit: 'cover',
                      borderRadius: 4,
                      cursor: 'pointer',
                    }}
                  />
                ))}
              </Image.PreviewGroup>
              {screenshots.length > 3 && (
                <Text type="secondary" style={{ fontSize: 11, marginLeft: 4 }}>
                  +{screenshots.length - 3}
                </Text>
              )}
            </div>
          );
        },
      },
      {
        headerName: 'Actions',
        width: 120,
        sortable: false,
        filter: false,
        pinned: 'right',
        cellRenderer: (params: ICellRendererParams) => (
          <Space size="small">
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={() => {
                setEditingTrade(params.data);
                setModalOpen(true);
              }}
            />
            
<Button
  icon={<DeleteOutlined />}
  size="small"
  danger
  onClick={() => {
    Modal.confirm({
      title: (
        <Space>
          <DeleteOutlined style={{ color: '#ff4d4f' }} />
          <span>Delete Trade?</span>
        </Space>
      ),
      content: (
        <div>
          <p style={{ marginBottom: 8 }}>
            Are you sure you want to delete <strong>{params.data.symbol}</strong>?
          </p>
          <p style={{ color: '#ff4d4f', fontSize: 12, margin: 0 }}>
            ⚠️ This will permanently remove the trade and its screenshots. This action cannot be undone.
          </p>
        </div>
      ),
      okText: 'Delete Trade',
      okButtonProps: { danger: true },
      cancelText: 'Cancel',
      onOk: () => handleDelete(params.data.id, params.data.symbol),
      centered: true,
    });
  }}
/>
          </Space>
        ),
      },
    ],
    []
  );

  // ----------------------------------------------------------
  // Render
  // ----------------------------------------------------------
  return (
    <PageContainer
      header={{
        title: (
      <Space>
        <span className="live-dot" />
        <span>📋 My Trades</span>
      </Space>
    ),
        subTitle: `${trades.length} trade${trades.length !== 1 ? 's' : ''} logged`,
        extra: [
          <Select
            key="filter"
            placeholder="Filter by market"
            allowClear
            style={{ width: 180 }}
            value={marketFilter}
            onChange={setMarketFilter}
            options={[
              { label: 'NSE', value: 'NSE' },
              { label: 'BSE', value: 'BSE' },
              { label: 'NASDAQ', value: 'NASDAQ' },
              { label: 'NYSE', value: 'NYSE' },
              { label: 'CRYPTO', value: 'CRYPTO' },
              { label: 'FX', value: 'FX' },
            ]}
          />,
          <Button
            key="add"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingTrade(null);
              setModalOpen(true);
            }}
          >
            Log New Trade
          </Button>,
        ],
      }}
    >
     <Card bodyStyle={trades.length === 0 ? { padding: 0 } : { padding: 0 }}>
{trades.length === 0 && !loading ? (
  hasFilter ? (
    <EmptyState
      icon="🔍"
      title={`No ${marketFilter} Trades`}
      description={`You don't have any trades in the ${marketFilter} market. Try clearing the filter or logging a new trade.`}
      actionLabel="Clear Filter"
      onAction={() => setMarketFilter(undefined)}
    />
  ) : (
    <EmptyState
      icon="📝"
      title="No Trades Yet"
      description="Start logging your trades to see analytics, patterns, and performance insights."
      actionLabel="+ Log Your First Trade"
      onAction={() => {
        setEditingTrade(null);
        setModalOpen(true);
      }}
    />
  )
) : (
    <div
      className={mode === 'dark' ? 'ag-theme-quartz-dark' : 'ag-theme-quartz'}
      style={{ height: 600, width: '100%' }}
    >
      <AgGridReact<Trade>
  rowData={trades}
  columnDefs={columnDefs}  
  loading={loading}
  pagination={true}
  paginationPageSize={20}
  paginationPageSizeSelector={[10, 20, 50, 100]}
  defaultColDef={{
    resizable: true,
    sortable: true,
    filter: true,
  }}
  animateRows={true}
  suppressCellFocus={true}
  onRowClicked={(event) => {
    // Don't open drawer if the click was on an action button or image
    if (event.event?.target instanceof HTMLElement) {
      const target = event.event.target;
      // Skip if user clicked on button, image, or popconfirm
      if (
        target.closest('button') ||
        target.closest('.ant-image') ||
        target.closest('.ant-popover')
      ) {
        return;
      }
    }
      if (event.data) {
          setSelectedTrade(event.data);
      }
    setDetailDrawerOpen(true);
  }}
  rowStyle={{ cursor: 'pointer' }}
/>
    </div>
  )}
</Card>
      <TradeFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={loadTrades}
        editingTrade={editingTrade}
      />
      <TradeDetailDrawer
  open={detailDrawerOpen}
  trade={selectedTrade}
  onClose={() => {
    setDetailDrawerOpen(false);
    setSelectedTrade(null);
  }}
  onEdit={(trade) => {
    setDetailDrawerOpen(false);
    setEditingTrade(trade);
    setModalOpen(true);
  }}
  onDelete={(trade) => {
    setDetailDrawerOpen(false);
    if (trade.id) {
      handleDelete(trade.id, trade.symbol);
    }
  }}
/>
    </PageContainer>
  );
};