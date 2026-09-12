import React from 'react';
import { Statistic } from 'antd';
import CountUp from 'react-countup';

interface Props {
  title: React.ReactNode;
  value: number;
  precision?: number;
  prefix?: React.ReactNode;
  suffix?: string;
  valueStyle?: React.CSSProperties;
  children?: React.ReactNode;
}

export const AnimatedStatistic: React.FC<Props> = ({
                                                     title,
                                                     value,
                                                     precision = 0,
                                                     prefix,
                                                     suffix,
                                                     valueStyle,
                                                     children,
                                                   }) => {
  const formatValue = (val: number) => (
      <CountUp
          end={val}
          decimals={precision}
          duration={1.2}
          separator=","
          preserveValue
      />
  );

  return (
      <>
        <Statistic
            title={title}
            value={value}
            formatter={(val) => formatValue(Number(val))}
            prefix={prefix}
            suffix={suffix}
            valueStyle={valueStyle}
        />
        {children}
      </>
  );
};