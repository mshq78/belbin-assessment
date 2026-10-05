import React from 'react';
import { ScoredRole } from '../types';
import { toFarsiDigits } from '../utils/number';

interface RadarChartProps {
  roles: ScoredRole[];
  size?: number;
}

export const RadarChart: React.FC<RadarChartProps> = ({ roles, size = 380 }) => {
  // 9 roles arranged symmetrically
  const count = roles.length;
  const center = size / 2;
  const radius = size * 0.36; // leave room for labels

  // Angle step: start at -Math.PI / 2 (top)
  const getCoordinates = (index: number, valueRatio: number) => {
    const angle = (Math.PI * 2 / count) * index - Math.PI / 2;
    const r = radius * valueRatio;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
      angle,
    };
  };

  // Concentric levels
  const levels = [0.25, 0.5, 0.75, 1.0];

  // Polygon points for data
  const dataPolygonPoints = roles
    .map((role, idx) => {
      const ratio = Math.max(0, Math.min(100, role.finalScore)) / 100;
      const { x, y } = getCoordinates(idx, ratio);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="w-full flex justify-center items-center py-2 select-none overflow-visible">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="w-full max-w-[400px] h-auto overflow-visible"
      >
        {/* Background Concentric Grid Polygons */}
        {levels.map((lvl) => {
          const points = roles
            .map((_, idx) => {
              const { x, y } = getCoordinates(idx, lvl);
              return `${x},${y}`;
            })
            .join(' ');
          return (
            <polygon
              key={lvl}
              points={points}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="1"
              strokeDasharray={lvl === 1 ? 'none' : '3 3'}
            />
          );
        })}

        {/* Axis lines from center */}
        {roles.map((_, idx) => {
          const { x, y } = getCoordinates(idx, 1);
          return (
            <line
              key={idx}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="#cbd5e1"
              strokeWidth="1"
            />
          );
        })}

        {/* Data Area Fill and Stroke */}
        <polygon
          points={dataPolygonPoints}
          fill="rgba(51, 65, 85, 0.25)"
          stroke="#1e293b"
          strokeWidth="2.5"
          className="transition-all duration-300"
        />

        {/* Data Points */}
        {roles.map((role, idx) => {
          const ratio = Math.max(0, Math.min(100, role.finalScore)) / 100;
          const { x, y } = getCoordinates(idx, ratio);
          return (
            <circle
              key={role.code}
              cx={x}
              cy={y}
              r="4"
              fill="#0f172a"
              stroke="#ffffff"
              strokeWidth="1.5"
            />
          );
        })}

        {/* Vertex Labels */}
        {roles.map((role, idx) => {
          const labelCoord = getCoordinates(idx, 1.22);
          const isTop = labelCoord.y < center - 40;
          const isBottom = labelCoord.y > center + 40;
          const textAnchor =
            Math.abs(labelCoord.x - center) < 20
              ? 'middle'
              : labelCoord.x > center
              ? 'start'
              : 'end';

          return (
            <g key={role.code} transform={`translate(${labelCoord.x}, ${labelCoord.y})`}>
              <text
                textAnchor={textAnchor}
                className="text-[11px] font-bold fill-slate-800"
                dy={isTop ? '-0.3em' : isBottom ? '0.8em' : '0.3em'}
              >
                {role.persianTitle}
              </text>
              <text
                textAnchor={textAnchor}
                className="text-[10px] font-medium fill-slate-500"
                dy={isTop ? '0.9em' : isBottom ? '2.0em' : '1.4em'}
              >
                {toFarsiDigits(role.displayScore)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
