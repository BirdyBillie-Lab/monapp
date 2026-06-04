'use client';

import { useEffect, useRef } from 'react';

interface DonutChartProps {
  percent: number;       // 0–100
  label: string;         // centre top line
  sublabel: string;      // centre bottom line
}

const R = 72;
const CIRCUMFERENCE = 2 * Math.PI * R;
const GAP_DEG = 50;                          // degrees of gap at bottom
const ARC_FRACTION = (360 - GAP_DEG) / 360; // usable arc

export default function DonutChart({ percent, label, sublabel }: DonutChartProps) {
  const progressRef = useRef<SVGCircleElement>(null);

  const dashTotal   = CIRCUMFERENCE;
  const dashArc     = CIRCUMFERENCE * ARC_FRACTION;
  const dashFilled  = dashArc * Math.min(percent / 100, 1);
  const dashOffset  = CIRCUMFERENCE - dashFilled;

  // Rotation: start at bottom-left of the gap
  const startRotation = 90 + GAP_DEG / 2;

  const color =
    percent < 70 ? '#8B5CF6' :
    percent < 90 ? '#F59E0B' : '#EF4444';

  useEffect(() => {
    const el = progressRef.current;
    if (!el) return;
    el.style.setProperty('--dash-total', String(CIRCUMFERENCE - dashArc));
    el.style.setProperty('--dash-offset', String(dashOffset));
    el.classList.remove('ring-animate');
    void (el as unknown as HTMLElement).offsetWidth;
    el.classList.add('ring-animate');
  }, [percent]);

  return (
    <div className="relative flex items-center justify-center">
      <svg
        width="200"
        height="200"
        viewBox="0 0 200 200"
        className="overflow-visible"
      >
        {/* Track */}
        <circle
          cx="100" cy="100" r={R}
          fill="none"
          stroke="#2A2540"
          strokeWidth="16"
          strokeDasharray={`${dashArc} ${CIRCUMFERENCE}`}
          strokeDashoffset={CIRCUMFERENCE - dashArc}
          strokeLinecap="round"
          transform={`rotate(${startRotation} 100 100)`}
        />
        {/* Progress */}
        <circle
          ref={progressRef}
          cx="100" cy="100" r={R}
          fill="none"
          stroke={color}
          strokeWidth="16"
          strokeDasharray={`${dashArc} ${CIRCUMFERENCE}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform={`rotate(${startRotation} 100 100)`}
          style={{
            filter: `drop-shadow(0 0 8px ${color}88)`,
            transition: 'stroke 0.5s ease',
          }}
        />
      </svg>

      {/* Centre text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pb-4">
        <span
          className="text-3xl font-bold tabular-nums"
          style={{ color }}
        >
          {Math.round(percent)}%
        </span>
        <span className="text-text text-sm font-semibold mt-0.5">{label}</span>
        <span className="text-muted text-xs">{sublabel}</span>
      </div>
    </div>
  );
}
