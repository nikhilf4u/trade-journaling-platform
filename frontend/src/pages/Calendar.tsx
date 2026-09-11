import React, { useEffect, useState } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import {
  Card,
  Row,
  Col,
  Button,
  Space,
  Typography,
  Tooltip,
  Tag,
  Statistic,
  Empty,
  Spin,
  message,
} from 'antd';
import {
  LeftOutlined,
  RightOutlined,
  CalendarOutlined,
  RiseOutlined,
  FallOutlined,
  PercentageOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { analyticsApi } from '../services/analyticsApi';

const { Title, Text } = Typography;

interface DayData {
  trade_date: string;
  trade_count: number;
  total_pnl: number;
  avg_pnl: number;
  win_count: number;
  loss_count: number;
  win_rate: number;
}

export const Calendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [data, setData] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await analyticsApi.getCalendar(
        currentDate.year(),
        currentDate.month() + 1
      );
      setData(result);
    } catch (err) {
      message.error('Failed to load calendar');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentDate]);

  const prevMonth = () => setCurrentDate(currentDate.subtract(1, 'month'));
  const nextMonth = () => setCurrentDate(currentDate.add(1, 'month'));
  const goToToday = () => setCurrentDate(dayjs());

  // Map of date string → DayData
  const dataByDate = new Map<string, DayData>();
  data.forEach((d) => {
    const dateKey = dayjs(d.trade_date).format('YYYY-MM-DD');
    dataByDate.set(dateKey, d);
  });

  // Get all P&L values for color scaling
  const pnls = data.map((d) => Number(d.total_pnl));
  const maxPnl = Math.max(...pnls, 0);
  const minPnl = Math.min(...pnls, 0);
  const maxAbs = Math.max(Math.abs(maxPnl), Math.abs(minPnl), 1);

  // Generate calendar grid
  const startOfMonth = currentDate.startOf('month');
  const endOfMonth = currentDate.endOf('month');
  const startDay = startOfMonth.day(); // 0 = Sunday
  const daysInMonth = endOfMonth.date();

  // ISO week starts Monday — adjust to Monday as first day
  const startOffset = startDay === 0 ? 6 : startDay - 1;

  const days: (dayjs.Dayjs | null)[] = [];
  // Pad before
  for (let i = 0; i < startOffset; i++) days.push(null);
  // Actual days
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(currentDate.date(d));
  }
  // Pad after to complete weeks
  while (days.length % 7 !== 0) days.push(null);

  // Get color for a day
  const getDayColor = (dayData: DayData | undefined) => {
    if (!dayData) return '#f5f5f5';
    const pnl = Number(dayData.total_pnl);
    if (pnl === 0) return '#d9d9d9';
    const intensity = Math.min(Math.abs(pnl) / maxAbs, 1);

    if (pnl > 0) {
      // Green gradient
      const r = Math.round(246 - intensity * 174); // 246 → 72
      const g = Math.round(255 - intensity * 10);  // 255 → 245
      const b = Math.round(237 - intensity * 140); // 237 → 97
      return `rgb(${r}, ${g}, ${b})`;
    } else {
      // Red gradient
      const r = Math.round(255 - intensity * 10);  // 255 → 245
      const g = Math.round(241 - intensity * 170); // 241 → 71
      const b = Math.round(240 - intensity * 170); // 240 → 70
      return `rgb(${r}, ${g}, ${b})`;
    }
  };

  // Get text color (dark or light based on background)
  const getTextColor = (dayData: DayData | undefined) => {
    if (!dayData) return '#8c8c8c';
    const pnl = Number(dayData.total_pnl);
    const intensity = Math.min(Math.abs(pnl) / maxAbs, 1);
    return intensity > 0.4 ? '#ffffff' : '#262626';
  };

  // Compute month stats
  const monthTotal = data.reduce((sum, d) => sum + Number(d.total_pnl), 0);
  const totalTrades = data.reduce((sum, d) => sum + Number(d.trade_count), 0);
  const greenDays = data.filter((d) => Number(d.total_pnl) > 0).length;
  const redDays = data.filter((d) => Number(d.total_pnl) < 0).length;
  const bestDay = data.reduce(
    (best, d) => (Number(d.total_pnl) > Number(best?.total_pnl || -Infinity) ? d : best),
    data[0]
  );
  const worstDay = data.reduce(
    (worst, d) => (Number(d.total_pnl) < Number(worst?.total_pnl || Infinity) ? d : worst),
    data[0]
  );

  return (
    <PageContainer
      header={{
        title: (
          <Space>
            <CalendarOutlined />
            <span>📅 Trading Calendar</span>
          </Space>
        ),
        subTitle: `${data.length} trading day${data.length !== 1 ? 's' : ''} this month`,
      }}
    >
      {/* Month Navigation */}
      <Card className="card-lift" style={{ marginBottom: 20 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Space>
            <Button icon={<LeftOutlined />} onClick={prevMonth} />
            <Title level={4} style={{ margin: 0, minWidth: 200, textAlign: 'center' }}>
              {currentDate.format('MMMM YYYY')}
            </Title>
            <Button icon={<RightOutlined />} onClick={nextMonth} />
          </Space>
          <Button type="primary" onClick={goToToday}>
            Today
          </Button>
        </div>
      </Card>

      {/* Month Summary */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={12} md={6}>
          <Card className="card-lift">
            <Statistic
              title="Month P&L"
              value={monthTotal}
              precision={2}
              prefix={monthTotal >= 0 ? <RiseOutlined /> : <FallOutlined />}
              valueStyle={{ color: monthTotal >= 0 ? '#52c41a' : '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card className="card-lift">
            <Statistic title="Total Trades" value={totalTrades} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card className="card-lift">
            <Statistic
              title="Green / Red Days"
              value={`${greenDays} / ${redDays}`}
              valueStyle={{ fontSize: 20 }}
              prefix={<PercentageOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card className="card-lift">
            <Statistic
              title="Best / Worst Day"
              value={bestDay ? `${Number(bestDay.total_pnl).toFixed(0)} / ${Number(worstDay?.total_pnl || 0).toFixed(0)}` : '—'}
              valueStyle={{ fontSize: 18 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Calendar Grid */}
      <Card className="card-lift">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <Spin size="large" />
          </div>
        ) : (
          <>
            {/* Weekday Headers */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: 8,
                marginBottom: 12,
              }}
            >
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <div
                  key={day}
                  style={{
                    textAlign: 'center',
                    fontWeight: 600,
                    fontSize: 12,
                    color: '#8c8c8c',
                    padding: '8px 0',
                  }}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: 8,
              }}
            >
              {days.map((date, index) => {
                if (!date) {
                  return <div key={index} style={{ height: 90 }} />;
                }

                const dateKey = date.format('YYYY-MM-DD');
                const dayData = dataByDate.get(dateKey);
                const isToday = date.isSame(dayjs(), 'day');
                const bgColor = getDayColor(dayData);
                const textColor = getTextColor(dayData);

                const tooltipContent = dayData ? (
                  <div>
                    <div>
                      <strong>{date.format('MMM DD, YYYY')}</strong>
                    </div>
                    <div>P&L: {Number(dayData.total_pnl).toFixed(2)}</div>
                    <div>Trades: {dayData.trade_count}</div>
                    <div>
                      Win Rate: {Number(dayData.win_rate).toFixed(1)}%
                    </div>
                  </div>
                ) : (
                  <div>{date.format('MMM DD, YYYY')} — No trades</div>
                );

                return (
                  <Tooltip key={index} title={tooltipContent} placement="top">
                    <div
                      onClick={() => {
                        if (dayData) {
                          navigate(`/trades?date=${dateKey}`);
                        }
                      }}
                      style={{
                        background: bgColor,
                        color: textColor,
                        borderRadius: 8,
                        padding: 10,
                        height: 90,
                        cursor: dayData ? 'pointer' : 'default',
                        position: 'relative',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                        border: isToday ? '2px solid #1890ff' : '1px solid #f0f0f0',
                      }}
                      onMouseEnter={(e) => {
                        if (dayData) {
                          e.currentTarget.style.transform = 'scale(1.03)';
                          e.currentTarget.style.boxShadow =
                            '0 4px 12px rgba(0,0,0,0.15)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          opacity: 0.9,
                        }}
                      >
                        {date.date()}
                      </div>
                      {dayData && (
                        <>
                          <div
                            style={{
                              fontSize: 14,
                              fontWeight: 700,
                              marginTop: 4,
                              lineHeight: 1.1,
                            }}
                          >
                            {Number(dayData.total_pnl) >= 0 ? '+' : ''}
                            {Number(dayData.total_pnl).toFixed(0)}
                          </div>
                          <div
                            style={{
                              fontSize: 10,
                              opacity: 0.75,
                              marginTop: 4,
                            }}
                          >
                            {dayData.trade_count} trade
                            {dayData.trade_count !== 1 ? 's' : ''}
                          </div>
                        </>
                      )}
                    </div>
                  </Tooltip>
                );
              })}
            </div>

            {/* Legend */}
            <div
              style={{
                marginTop: 20,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 8,
                fontSize: 12,
                color: '#8c8c8c',
              }}
            >
              <span>Loss</span>
              <div
                style={{
                  width: 20,
                  height: 20,
                  background: 'rgb(245, 71, 70)',
                  borderRadius: 4,
                }}
              />
              <div
                style={{
                  width: 20,
                  height: 20,
                  background: 'rgb(255, 200, 180)',
                  borderRadius: 4,
                }}
              />
              <div
                style={{
                  width: 20,
                  height: 20,
                  background: '#f5f5f5',
                  borderRadius: 4,
                }}
              />
              <div
                style={{
                  width: 20,
                  height: 20,
                  background: 'rgb(180, 240, 180)',
                  borderRadius: 4,
                }}
              />
              <div
                style={{
                  width: 20,
                  height: 20,
                  background: 'rgb(72, 245, 97)',
                  borderRadius: 4,
                }}
              />
              <span>Profit</span>
            </div>
          </>
        )}
      </Card>
    </PageContainer>
  );
};