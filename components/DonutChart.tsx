'use client';

// Two-segment donut: services (purple) + sales (amber)
// Used on the dashboard for current-month CA breakdown

const CX = 80, CY = 80, R = 58, SW = 17;

function polar(angleDeg: number, r = R) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
}

function arc(startDeg: number, endDeg: number) {
  if (endDeg - startDeg >= 359.9) {
    const top = polar(0);
    const bot = polar(180);
    return `M ${top.x.toFixed(2)} ${top.y.toFixed(2)} A ${R} ${R} 0 1 1 ${bot.x.toFixed(2)} ${bot.y.toFixed(2)} A ${R} ${R} 0 1 1 ${top.x.toFixed(2)} ${top.y.toFixed(2)}`;
  }
  const s = polar(startDeg);
  const e = polar(endDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${R} ${R} 0 ${large} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
}

interface DonutChartProps {
  servicesCA: number;
  salesCA: number;
  centerLabel: string;
  centerSub?: string;
  showSegmentPct?: boolean;
}

export default function DonutChart({ servicesCA, salesCA, centerLabel, centerSub, showSegmentPct }: DonutChartProps) {
  const total = servicesCA + salesCA;
  const servicesDeg = total > 0 ? (servicesCA / total) * 360 : 0;
  const servicesPct = total > 0 ? Math.round((servicesCA / total) * 100) : 0;
  const salesPct    = total > 0 ? Math.round((salesCA    / total) * 100) : 0;

  // Label positions: midpoint of each arc, just outside the ring
  const lblR = R + SW / 2 + 11;
  const servicesMid = polar(servicesDeg / 2, lblR);
  const salesMid    = polar(servicesDeg + (360 - servicesDeg) / 2, lblR);

  return (
    <div className="relative" style={{ width: 160, height: 160 }}>
      <svg width="160" height="160" viewBox="0 0 160 160" overflow="visible">
        {/* Track */}
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="#2A2540" strokeWidth={SW} />

        {total === 0 ? null : salesCA === 0 ? (
          <path d={arc(0, 359.9)} fill="none" stroke="#8B5CF6" strokeWidth={SW}
            strokeLinecap="butt"
            style={{ filter: 'drop-shadow(0 0 7px rgba(139,92,246,0.55))' }} />
        ) : servicesCA === 0 ? (
          <path d={arc(0, 359.9)} fill="none" stroke="#F59E0B" strokeWidth={SW}
            strokeLinecap="butt"
            style={{ filter: 'drop-shadow(0 0 7px rgba(245,158,11,0.45))' }} />
        ) : (
          <>
            {/* Services arc (purple) */}
            <path d={arc(0, servicesDeg)} fill="none" stroke="#8B5CF6" strokeWidth={SW}
              strokeLinecap="butt"
              style={{ filter: 'drop-shadow(0 0 7px rgba(139,92,246,0.5))' }} />
            {/* Sales arc (amber) */}
            <path d={arc(servicesDeg, 360)} fill="none" stroke="#F59E0B" strokeWidth={SW}
              strokeLinecap="butt"
              style={{ filter: 'drop-shadow(0 0 5px rgba(245,158,11,0.4))' }} />

            {/* Segment % labels */}
            {showSegmentPct && servicesPct >= 8 && (
              <text x={servicesMid.x.toFixed(1)} y={servicesMid.y.toFixed(1)}
                textAnchor="middle" dominantBaseline="middle"
                fontSize="9" fontWeight="700" fill="#A78BFA">
                {servicesPct}%
              </text>
            )}
            {showSegmentPct && salesPct >= 8 && (
              <text x={salesMid.x.toFixed(1)} y={salesMid.y.toFixed(1)}
                textAnchor="middle" dominantBaseline="middle"
                fontSize="9" fontWeight="700" fill="#F59E0B">
                {salesPct}%
              </text>
            )}
          </>
        )}
      </svg>

      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-text font-bold text-lg tabular-nums leading-tight">{centerLabel}</p>
        {centerSub && <p className="text-muted text-[10px] mt-0.5">{centerSub}</p>}
      </div>
    </div>
  );
}
