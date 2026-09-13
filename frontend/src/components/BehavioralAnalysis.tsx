import React from 'react';
import {
  Card,
  Row,
  Col,
  Progress,
  Tag,
  Space,
  Typography,
  Statistic,
  Tooltip,
  Alert,
  Divider,
} from 'antd';
import {
  InfoCircleOutlined,
  WarningOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  FireOutlined,
  SafetyCertificateOutlined,
  AimOutlined,
} from '@ant-design/icons';
import {
  MetricTooltip,
  DisciplineScoreTooltip,
  StopLossAdherenceTooltip,
  ExitDisciplineTooltip,
  RiskConsistencyTooltip,
  OvertradingTooltip,
  RevengeTradingTooltip,
  CaptureRatioTooltip,
} from './metricTooltips';

const { Text, Title } = Typography;

interface Props {
  summary: any;
}

// Wrapper for consistent tooltip styling
const InfoTip: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Tooltip
    title={children}
    placement="top"
    overlayStyle={{ maxWidth: 420 }}
    color="#1f1f1f"
  >
    <InfoCircleOutlined
      style={{ color: '#bfbfbf', fontSize: 11, cursor: 'help' }}
    />
  </Tooltip>
);

export const BehavioralAnalysis: React.FC<Props> = ({ summary }) => {
  const score = Number(summary.discipline_score || 0);
  const rating = summary.rating || 'UNKNOWN';

  // ---------- Rating color ----------
  const getRatingColor = () => {
    if (rating === 'EXCELLENT') return '#52c41a';
    if (rating === 'GOOD') return '#1890ff';
    if (rating === 'FAIR') return '#faad14';
    return '#ff4d4f';
  };

  const getRatingLabel = () => {
    if (rating === 'EXCELLENT') return '✅ Excellent';
    if (rating === 'GOOD') return '👍 Good';
    if (rating === 'FAIR') return '⚠️ Fair';
    return '🚨 Needs Work';
  };

  // ---------- Individual scores ----------
  const scores = [
    {
      key: 'stoploss',
      label: 'Stop-Loss Adherence',
      value: Number(summary.stoploss_adherence_score || 0),
      weight: '30%',
      tooltip: <StopLossAdherenceTooltip />,
    },
    {
      key: 'exit',
      label: 'Exit Discipline',
      value: Number(summary.exit_discipline_score || 0),
      weight: '30%',
      tooltip: <ExitDisciplineTooltip />,
    },
    {
      key: 'risk',
      label: 'Risk Consistency',
      value: Number(summary.risk_consistency_score || 0),
      weight: '20%',
      tooltip: <RiskConsistencyTooltip />,
    },
    {
      key: 'overtrading',
      label: 'No Overtrading',
      value: Number(summary.overtrading_score || 0),
      weight: '10%',
      tooltip: <OvertradingTooltip />,
    },
    {
      key: 'revenge',
      label: 'No Revenge Trading',
      value: Number(summary.revenge_trading_score || 0),
      weight: '10%',
      tooltip: <RevengeTradingTooltip />,
    },
  ];

  // ---------- Red flags ----------
  const redFlags: string[] = [];
  if (Number(summary.size_up_after_loss || 0) >= 3) {
    redFlags.push(
      `You sized up after a loss ${summary.size_up_after_loss} times — possible revenge trading`
    );
  }
  if (Number(summary.trades_within_30min_after_loss || 0) >= 3) {
    redFlags.push(
      `You opened ${summary.trades_within_30min_after_loss} trades within 30 min of a loss`
    );
  }
  if (Number(summary.early_profit || 0) > Number(summary.hit_target || 0)) {
    redFlags.push(
      `You exited early on profit ${summary.early_profit} times vs ${summary.hit_target} hits at target`
    );
  }
  if (Number(summary.early_loss || 0) > 0) {
    redFlags.push(
      `You exited early on losses ${summary.early_loss} times — were stops too wide?`
    );
  }
  if (Number(summary.overtrading_days || 0) >= 3) {
    redFlags.push(
      `You had ${summary.overtrading_days} overtrading days (2× your daily average)`
    );
  }

  return (
    <div className="fade-in-up" style={{ marginTop: 20 }}>
      <Card
        title={
          <Space>
            🧠 Discipline Matrix
            <Tooltip
              title={<DisciplineScoreTooltip />}
              placement="top"
              overlayStyle={{ maxWidth: 420 }}
              color="#1f1f1f"
            >
              <InfoCircleOutlined style={{ color: '#8c8c8c', cursor: 'help' }} />
            </Tooltip>
          </Space>
        }
        className="card-lift"
      >
        {/* ============================================ */}
        {/* Top Hero Section: Composite Score */}
        {/* ============================================ */}
        <Row gutter={[24, 16]} align="middle">
          <Col xs={24} md={8}>
            <div style={{ textAlign: 'center' }}>
              <Progress
                type="dashboard"
                percent={Math.round(score)}
                strokeColor={getRatingColor()}
                size={180}
                format={(p) => (
                  <div>
                    <div
                      style={{
                        fontSize: 42,
                        fontWeight: 700,
                        color: getRatingColor(),
                        lineHeight: 1,
                      }}
                    >
                      {p}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: '#8c8c8c',
                        marginTop: 4,
                      }}
                    >
                      Discipline Score
                    </div>
                  </div>
                )}
              />
              <div style={{ marginTop: 12 }}>
                <Tag
                  color={
                    rating === 'EXCELLENT'
                      ? 'green'
                      : rating === 'GOOD'
                      ? 'blue'
                      : rating === 'FAIR'
                      ? 'orange'
                      : 'red'
                  }
                  style={{ fontSize: 14, padding: '4px 12px' }}
                >
                  {getRatingLabel()}
                </Tag>
              </div>
            </div>
          </Col>

          <Col xs={24} md={16}>
            <Title level={5} style={{ marginTop: 0 }}>
              Breakdown
            </Title>
            {scores.map((s) => {
              const color =
                s.value >= 80
                  ? '#52c41a'
                  : s.value >= 60
                  ? '#faad14'
                  : '#ff4d4f';
              return (
                <div key={s.key} style={{ marginBottom: 12 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: 4,
                      alignItems: 'center',
                    }}
                  >
                    <Space>
                      <Text style={{ fontSize: 13 }}>{s.label}</Text>
                      <InfoTip>{s.tooltip}</InfoTip>
                      <Tag style={{ fontSize: 10, margin: 0 }} color="default">
                        {s.weight}
                      </Tag>
                    </Space>
                    <Text strong style={{ color }}>
                      {s.value.toFixed(1)}%
                    </Text>
                  </div>
                  <Progress
                    percent={Math.round(s.value)}
                    strokeColor={color}
                    trailColor="#f0f0f0"
                    showInfo={false}
                    size="small"
                  />
                </div>
              );
            })}
          </Col>
        </Row>

        {/* ============================================ */}
        {/* Red Flags */}
        {/* ============================================ */}
        {redFlags.length > 0 && (
          <>
            <Divider style={{ marginTop: 24, marginBottom: 16 }}>
              <Space>
                <WarningOutlined style={{ color: '#faad14' }} />
                <span>Behavioral Red Flags ({redFlags.length})</span>
                <InfoTip>
                  <MetricTooltip
                    title="🚩 Behavioral Red Flags"
                    definition="Patterns detected in your trade history that suggest emotional or undisciplined trading. These are statistically correlated with account blow-ups."
                    tip="Each flag is actionable. Address them one at a time — usually by adding a rule to your trading plan (e.g., 'no new trades within 30 min of a loss')."
                  />
                </InfoTip>
              </Space>
            </Divider>
            {redFlags.map((flag, i) => (
              <Alert
                key={i}
                type="warning"
                showIcon
                message={flag}
                style={{ marginBottom: 8 }}
              />
            ))}
          </>
        )}

        {redFlags.length === 0 && (
          <>
            <Divider style={{ marginTop: 24, marginBottom: 16 }}>
              <Space>
                <CheckCircleFilled style={{ color: '#52c41a' }} />
                <span>No Behavioral Issues Detected</span>
              </Space>
            </Divider>
            <Alert
              type="success"
              showIcon
              message="Great job! Your trading behavior shows discipline and consistency."
            />
          </>
        )}

        {/* ============================================ */}
        {/* Detail Row */}
        {/* ============================================ */}
        <Divider style={{ marginTop: 24, marginBottom: 16 }} />

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card size="small" style={{ background: '#fafafa' }}>
              <Statistic
                title={
                  <Space>
                    <AimOutlined />
                    Hit Target
                    <InfoTip>
                      <MetricTooltip
                        title="🎯 Hit Target"
                        definition="Number of trades where you exited at your profit target (within 5% tolerance)."
                        tip="High count = disciplined exits at plan. Low count = exiting early or never reaching target."
                      />
                    </InfoTip>
                  </Space>
                }
                value={Number(summary.hit_target || 0)}
                suffix={`/ ${Number(summary.total_trades || 0)}`}
                valueStyle={{ fontSize: 20, color: '#52c41a' }}
              />
              <Text type="secondary" style={{ fontSize: 11 }}>
                Exited at profit target
              </Text>
            </Card>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Card size="small" style={{ background: '#fafafa' }}>
              <Statistic
                title={
                  <Space>
                    <SafetyCertificateOutlined />
                    Hit Stop-Loss
                    <InfoTip>
                      <MetricTooltip
                        title="🛑 Hit Stop-Loss"
                        definition="Number of trades where you exited at your stop-loss (within 5% tolerance)."
                        tip="This is GOOD — it means you honored your risk limit. The only bad stop-loss is the one you didn't set or didn't respect."
                      />
                    </InfoTip>
                  </Space>
                }
                value={Number(summary.hit_stoploss || 0)}
                suffix={`/ ${Number(summary.total_trades || 0)}`}
                valueStyle={{ fontSize: 20, color: '#ff4d4f' }}
              />
              <Text type="secondary" style={{ fontSize: 11 }}>
                Exited at stop-loss (good!)
              </Text>
            </Card>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Card size="small" style={{ background: '#fafafa' }}>
              <Statistic
                title={
                  <Space>
                    <ClockCircleOutlined />
                    Avg Trades/Day
                    <InfoTip>
                      <MetricTooltip
                        title="⏱️ Avg Trades per Day"
                        definition="Your average number of trades on days you traded."
                        tip="Compare this with Max Trades/Day. If the max is > 2× your average, you have overtrading days — usually emotional."
                      />
                    </InfoTip>
                  </Space>
                }
                value={Number(summary.avg_trades_per_day || 0)}
                precision={1}
                valueStyle={{ fontSize: 20 }}
              />
              <Text type="secondary" style={{ fontSize: 11 }}>
                Max: {Number(summary.max_trades_per_day || 0)} in one day
              </Text>
            </Card>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Card size="small" style={{ background: '#fafafa' }}>
              <Statistic
                title={
                  <Space>
                    <FireOutlined />
                    Capture Ratio
                    <InfoTip>
                      <CaptureRatioTooltip />
                    </InfoTip>
                  </Space>
                }
                value={Number(summary.avg_capture_pct || 0)}
                suffix="%"
                precision={1}
                valueStyle={{ fontSize: 20, color: '#1890ff' }}
              />
              <Text type="secondary" style={{ fontSize: 11 }}>
                % of planned profit captured
              </Text>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );
};