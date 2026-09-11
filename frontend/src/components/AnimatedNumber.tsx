import React from 'react';
import CountUp from 'react-countup';

interface Props {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const AnimatedNumber: React.FC<Props> = ({
  value,
  decimals = 2,
  prefix = '',
  suffix = '',
  duration = 1.2,
  className,
  style,
}) => {
  return (
    <span className={className} style={style}>
      <CountUp
        end={value}
        decimals={decimals}
        duration={duration}
        prefix={prefix}
        suffix={suffix}
        separator=","
        preserveValue
      />
    </span>
  );
};