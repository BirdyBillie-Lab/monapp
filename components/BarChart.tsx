'use client';

import { useEffect, useRef } from 'react';

interface BarChartProps {
  data: { label: string; value: number }[];
  activeIndex?: number;
}

export default function BarChart({ data, activeIndex }: BarChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bars = containerRef.current?.querySelectorAll('.bar-inner');
    bars?.forEach((bar, i) => {
      const el = bar as HTMLElement;
      el.style.animationDelay = `${i * 60}ms`;
      el.classList.remove('bar-grow');
      void el.offsetWidth;
      el.classList.add('bar-grow');
    });
  }, [data]);

  return (
    <div ref={containerRef} className="flex items-end justify-between gap-1.5 h-20 px-1">
      {data.map((d, i) => {
        const isActive = i === activeIndex;
        const heightPct = max > 0 ? (d.value / max) * 100 : 0;
        return (
          <div key={d.label} className="flex-1 flex flex-col items-center gap-1.5">
            <div className="w-full flex items-end" style={{ height: '64px' }}>
              <div
                className="bar-inner w-full rounded-t-md"
                style={{
                  height: `${Math.max(heightPct, d.value > 0 ? 4 : 0)}%`,
                  background: isActive
                    ? 'linear-gradient(to top, #8B5CF6, #A78BFA)'
                    : d.value > 0
                    ? 'linear-gradient(to top, #2D2848, #3D3560)'
                    : 'transparent',
                  boxShadow: isActive ? '0 0 8px rgba(139,92,246,0.5)' : 'none',
                  minHeight: d.value > 0 ? '4px' : '0',
                }}
              />
            </div>
            <span
              className={`text-[9px] font-medium uppercase tracking-wide
                ${isActive ? 'text-purple-light' : 'text-muted'}`}
            >
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
