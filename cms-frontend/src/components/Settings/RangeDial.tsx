import React from 'react';
import { describeArc } from './ArcFuctions';

interface RangeDialProps {
  min: number;
  max: number;
  range: { min: number; max: number };
  gradientId: string;
}

export const RangeDial: React.FC<RangeDialProps> = ({
  min,
  max,
  range,
  gradientId,
}) => {
  const mapToAngle = (val: number) => ((val - min) / (max - min)) * 180;
  const radius = 80;
  const center = 100;

  const fullArc = describeArc(center, center, radius, 180, 0);
  const valueArc = describeArc(
    center,
    center,
    radius,
    mapToAngle(range.min) - 180,
    mapToAngle(range.max) - 180
  );

  return (
    <div className="relative">
      <svg viewBox="0 0 200 120" className="w-full">
        <path
          d={fullArc}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="14"
          strokeLinecap="round"
        />
        <path
          d={valueArc}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="14"
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};
