import React, { useMemo } from 'react';
import {
  Drawer,
  Descriptions,
  Tag,
  Typography,
  Space,
  Button,
  Divider,
  Image,
  Empty,
  Statistic,
  Row,
  Col,
  Card,
  Tooltip,
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  CloseOutlined,
  RiseOutlined,
  FallOutlined,
  ClockCircleOutlined,
  AimOutlined,
  SafetyOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import type { Trade } from '../services/tradeApi';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

interface Props {
  open: boolean;
  trade: Trade | null;
  onClose: () => void;
  onEdit: (trade: Trade) => void;
  onDelete: (trade: Trade) => void;
}

// ---------- Helper calculations ----------
const calculateHoldTime = (entry?: string, exit?: string): string => {
  if (!entry || !exit) return '—';
  const diffMs = dayjs(exit).diff(dayjs(entry));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    return `${days}d ${remHours}h`;
  }
  return `${hours}h ${minutes}m`;
};

const calculateRiskAmount = (trade: Trade): number | null => {
  if (!trade.stoploss || !trade.entryPrice) return null;
  return Math.abs(trade.entryPrice - trade.stoploss) * trade.quantity;
};

const calculatePlannedRR = (trade: Trade): number | null => {
  if (!trade.stoploss || !trade.target || !trade.entryPrice) return null;
  const risk = Math.abs(trade.entryPrice - trade.stoploss);
  const reward = Math.abs(trade.target - trade.entryPrice);
  if (risk === 0) return null;
  return reward / risk;
};

const calculateRMultiple = (trade: Trade): number | null => {
  if (!trade.stoploss || !trade.entryPrice || trade.pnl == null) return null;
  const riskPerUnit = Math.abs(trade.entryPrice - trade.stoploss);
  const riskAmount = riskPerUnit * trade.quantity;
  if (riskAmount === 0) return null;
  return trade.pnl / riskAmount;
};

// ---------- Bias label helper ----------
const getBiasInfo = (bias?: string) => {
  const map: Record<string, { color: string; label: string }> = {
    STRONG_BULLISH: { color: 'green', label: '🟢🟢 Strong Bullish' },
    BULLISH: { color: 'green', label: '🟢 Bullish' },
    NEUTRAL: { color: 'default', label: '⚪ Neutral' },
    BEARISH: { color: 'red', label: '🔴 Bearish' },
    STRONG_BEARISH: { color: 'red', label: '🔴🔴 Strong Bearish' },
  };
  return map[bias || ''] || { color: 'default', label: bias || '—' };
};

export const TradeDetailDrawer: React.FC<Props> = ({
  open,
  trade,
  onClose,
  onEdit,
  onDelete,
}) => {
  const metrics = useMemo(() => {
    if (!trade) return null;
    return {
      holdTime: calculateHoldTime(trade.entryDate, trade.exitDate),
      riskAmount: calculateRiskAmount(trade),
      plannedRR: calculatePlannedRR(trade),
      rMultiple: calculateRMultiple(trade),
    };
  }, [trade]);

  if (!trade) return null;

  const isProfit = (trade.pnl ?? 0) >= 0;
  const bias = getBiasInfo(trade.longTimeFrameBias);

  return (
    <Drawer
      title={
        <Space>
          <Text strong style={{ fontSize: 18 }}>
            {trade.symbol}
          </Text>
          <Tag color={trade.direction === 'BUY' ? 'green' : 'red'}>
            {trade.direction === 'BUY' ? '🟢 BUY' : '🔴 SELL'}
          </Tag>
          <Tag color="blue">{trade.market}</Tag>
        </Space>
      }
      placement="right"
      width={640}
      open={open}
      onClose={onClose}
      closeIcon={<CloseOutlined />}
      extra={
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => onEdit(trade)}
          >
            Edit
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => onDelete(trade)}
          >
            Delete
          </Button>
        </Space>
      }
    >
      {/* ============================================ */}
      {/* P&L Hero Card */}
      {/* ============================================ */}
      <Card
        style={{
          background: isProfit
            ? 'linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)'
            : 'linear-gradient(135deg, #fff1f0 0%, #ffccc7 100%)',
          borderColor: isProfit ? '#b7eb8f' : '#ffa39e',
          marginBottom: 20,
        }}
        styles={{ body: { padding: 20 } }}
      >
        <Row align="middle" gutter={16}>
          <Col flex="auto">
            <Text type="secondary" style={{ fontSize: 13 }}>
              Net Profit / Loss
            </Text>
            <div
              style={{
                fontSize: 36,
                fontWeight: 700,
                color: isProfit ? '#389e0d' : '#cf1322',
                lineHeight: 1.2,
                marginTop: 4,
              }}
            >
              {isProfit ? '+' : ''}
              {trade.pnl?.toFixed(2) ?? '0.00'}
              <span style={{ fontSize: 18, marginLeft: 8, fontWeight: 500 }}>
                {trade.quoteCurrency}
              </span>
            </div>
          </Col>
          <Col>
            {metrics?.rMultiple != null && (
              <Tooltip title="R-Multiple: Profit divided by initial risk">
                <div style={{ textAlign: 'center' }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    R-Multiple
                  </Text>
                  <div
                    style={{
                      fontSize: 24,
                      fontWeight: 700,
                      color: metrics.rMultiple >= 0 ? '#389e0d' : '#cf1322',
                    }}
                  >
                    {metrics.rMultiple >= 0 ? '+' : ''}
                    {metrics.rMultiple.toFixed(2)}R
                  </div>
                </div>
              </Tooltip>
            )}
          </Col>
        </Row>
      </Card>

      {/* ============================================ */}
      {/* Quick Stats */}
      {/* ============================================ */}
      <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
        <Col span={8}>
          <Card size="small" styles={{ body: { padding: 12 } }}>
            <Statistic
              title="Entry"
              value={trade.entryPrice}
              precision={2}
              valueStyle={{ fontSize: 16 }}
              prefix={<RiseOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small" styles={{ body: { padding: 12 } }}>
            <Statistic
              title="Exit"
              value={trade.exitPrice}
              precision={2}
              valueStyle={{ fontSize: 16 }}
              prefix={<FallOutlined style={{ color: '#faad14' }} />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small" styles={{ body: { padding: 12 } }}>
            <Statistic
              title="Quantity"
              value={trade.quantity}
              valueStyle={{ fontSize: 16 }}
            />
          </Card>
        </Col>
      </Row>

      {/* ============================================ */}
      {/* Trade Planning */}
      {/* ============================================ */}
      <Divider orientation="left" style={{ marginTop: 8 }}>
        <Space>
          <AimOutlined />
          <span>Trade Planning</span>
        </Space>
      </Divider>

      <Descriptions column={2} size="small" bordered>
        <Descriptions.Item label="Stop Loss">
          {trade.stoploss != null ? (
            <Text style={{ color: '#faad14', fontWeight: 600 }}>
              {trade.stoploss.toFixed(2)}
            </Text>
          ) : (
            <Text type="secondary">Not set</Text>
          )}
        </Descriptions.Item>
        <Descriptions.Item label="Target">
          {trade.target != null ? (
            <Text style={{ color: '#52c41a', fontWeight: 600 }}>
              {trade.target.toFixed(2)}
            </Text>
          ) : (
            <Text type="secondary">Not set</Text>
          )}
        </Descriptions.Item>
        <Descriptions.Item label="Risk Amount">
          {metrics?.riskAmount != null ? (
            <Text style={{ color: '#ff4d4f', fontWeight: 600 }}>
              -{metrics.riskAmount.toFixed(2)}
            </Text>
          ) : (
            '—'
          )}
        </Descriptions.Item>
        <Descriptions.Item label="Planned R:R">
          {metrics?.plannedRR != null ? (
            <Text style={{ fontWeight: 600 }}>
              {metrics.plannedRR.toFixed(2)}:1
            </Text>
          ) : (
            '—'
          )}
        </Descriptions.Item>
        <Descriptions.Item label="HTF Bias" span={2}>
          <Tag color={bias.color}>{bias.label}</Tag>
        </Descriptions.Item>
      </Descriptions>

      {/* ============================================ */}
      {/* Timeline */}
      {/* ============================================ */}
      <Divider orientation="left" style={{ marginTop: 24 }}>
        <Space>
          <ClockCircleOutlined />
          <span>Timeline</span>
        </Space>
      </Divider>

      <Descriptions column={2} size="small" bordered>
        <Descriptions.Item label="Entry Date">
          {dayjs(trade.entryDate).format('MMM DD, YYYY HH:mm')}
        </Descriptions.Item>
        <Descriptions.Item label="Exit Date">
          {dayjs(trade.exitDate).format('MMM DD, YYYY HH:mm')}
        </Descriptions.Item>
        <Descriptions.Item label="Hold Time" span={2}>
          <Tag color="blue">{metrics?.holdTime}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Instrument" span={2}>
          <Tag>{trade.instrumentType || '—'}</Tag>
        </Descriptions.Item>
      </Descriptions>

      {/* ============================================ */}
      {/* Screenshots */}
      {/* ============================================ */}
      <Divider orientation="left" style={{ marginTop: 24 }}>
        <Space>
          <TrophyOutlined />
          <span>Screenshots ({trade.screenshots?.length || 0})</span>
        </Space>
      </Divider>

      {trade.screenshots && trade.screenshots.length > 0 ? (
        <Image.PreviewGroup>
          <Space wrap size={[8, 8]}>
            {trade.screenshots.map((s, i) => (
              <div key={s.id || i} style={{ textAlign: 'center' }}>
                <Image
                  src={s.url}
                  width={120}
                  height={120}
                  style={{
                    objectFit: 'cover',
                    borderRadius: 8,
                    border: '1px solid #f0f0f0',
                  }}
                />
                {s.label && (
                  <div
                    style={{
                      fontSize: 11,
                      color: '#8c8c8c',
                      marginTop: 4,
                      maxWidth: 120,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {s.label}
                  </div>
                )}
              </div>
            ))}
          </Space>
        </Image.PreviewGroup>
      ) : (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No screenshots attached"
        />
      )}

      {/* ============================================ */}
      {/* Notes */}
      {/* ============================================ */}
      <Divider orientation="left" style={{ marginTop: 24 }}>
        <Space>
          <SafetyOutlined />
          <span>Notes</span>
        </Space>
      </Divider>

      {trade.notes ? (
        <Paragraph
          style={{
            background: '#fafafa',
            padding: 16,
            borderRadius: 8,
            borderLeft: '3px solid #1890ff',
            whiteSpace: 'pre-wrap',
            margin: 0,
          }}
        >
          {trade.notes}
        </Paragraph>
      ) : (
        <Text type="secondary" italic>
          No notes for this trade
        </Text>
      )}
    </Drawer>
  );
};