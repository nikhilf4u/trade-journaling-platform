import React from 'react';
import { Card, Row, Col, Skeleton } from 'antd';

export const DashboardSkeleton: React.FC = () => (
  <>
    <Row gutter={[16, 16]}>
      {[1, 2, 3].map((i) => (
        <Col xs={24} md={8} key={i}>
          <Card>
            <Skeleton active paragraph={{ rows: 1 }} />
          </Card>
        </Col>
      ))}
    </Row>
    <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
      {[1, 2, 3, 4].map((i) => (
        <Col xs={24} sm={12} md={6} key={i}>
          <Card>
            <Skeleton active paragraph={{ rows: 1 }} />
          </Card>
        </Col>
      ))}
    </Row>
  </>
);