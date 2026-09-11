import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Layout,
  Button,
  Typography,
  Space,
  Card,
  message,
  Select,
  Image,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  ArrowLeftOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { AgGridReact } from 'ag-grid-react';
import {
  ColDef,
  ModuleRegistry,
  AllCommunityModule,
  ICellRendererParams,
} from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { tradeApi, Trade, TradeScreenshot } from '../services/tradeApi';
import { TradeFormModal } from '../components/TradeFormModel';

// Register all community modules (required for AG Grid v32+)
ModuleRegistry.registerModules([AllCommunityModule]);

const { Title, Text } = Typography;
const { Content } = Layout;

export const Trades: React.FC = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [marketFilter, setMarketFilter] = useState<string | undefined>(undefined);
  const navigate = useNavigate();

  // ----------------------------------------------------------------
  // Load trades from backend
  // ----------------------------------------------------------------
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

  // ----------------------------------------------------------------
  // Delete trade
  // ----------------------------------------------------------------
  const handleDelete = async (id: number, symbol: string) => {
    try {
      await tradeApi.delete(id);
      message.success(`Trade "${symbol}" deleted successfully`);
      loadTrades(); // Refresh the table
    } catch (err: any) {
      message.error(err.response?.data?.error || 'Failed to delete trade');
    }
  };

  // ----------------------------------------------------------------
  // AG Grid column definitions
  // ----------------------------------------------------------------
  const columnDefs = useMemo<ColDef<Trade>[]>(
    (): ColDef<Trade>[] => [
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
        cellStyle: { fontWeight: 'bold' },
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
                    style={{ objectFit: 'cover', borderRadius: 4, cursor: 'pointer' }}
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
      // ⭐ ACTIONS COLUMN (Edit + Delete)
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
              type="default"
              onClick={() => {
                setEditingTrade(params.data);
                setModalOpen(true);
              }}
            />
            <Popconfirm
              title="Delete this trade?"
              description={`Delete "${params.data.symbol}"? This cannot be undone.`}
              onConfirm={() => handleDelete(params.data.id, params.data.symbol)}
              okText="Yes, Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
            >
              <Button icon={<DeleteOutlined />} size="small" danger />
            </Popconfirm>
          </Space>
        ),
      },
    ],
    []
  );

  // ----------------------------------------------------------------
  // Render
  // ----------------------------------------------------------------
  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5', padding: 20 }}>
      <Content>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          <Space>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/dashboard')}
            >
              Back
            </Button>
            <Title level={3} style={{ margin: 0 }}>
              📊 My Trades
            </Title>
          </Space>

          <Space>
            <Select
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
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingTrade(null);
                setModalOpen(true);
              }}
            >
              Log New Trade
            </Button>
          </Space>
        </div>

        {/* AG Grid Table */}
        <Card bodyStyle={{ padding: 0 }}>
          <div
            className="ag-theme-alpine"
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
            />
          </div>
        </Card>

        {/* Create/Edit Trade Modal */}
        <TradeFormModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSuccess={loadTrades}
          editingTrade={editingTrade}
        />
      </Content>
    </Layout>
  );
};