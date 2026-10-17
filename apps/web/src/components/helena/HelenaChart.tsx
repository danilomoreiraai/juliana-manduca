import type { HelenaNatalResult } from '@juliana/contracts';
import { bodies, glyphs } from './format';

export const HelenaChart = ({ chart }: { chart: HelenaNatalResult }) => {
  const point = (longitude: number, radius: number) => {
    const angle = ((180 - longitude + chart.ascendant) * Math.PI) / 180;
    return { x: 200 + radius * Math.cos(angle), y: 200 + radius * Math.sin(angle) };
  };
  // Spread labels on a separate ring; leader lines retain the true planetary positions.
  const labels = chart.bodies
    .map((body) => ({ body, angle: body.longitude }))
    .sort((a, b) => a.angle - b.angle);
  for (let iteration = 0; iteration < 30; iteration++) {
    for (let i = 0; i < labels.length; i++) {
      const next = labels[(i + 1) % labels.length];
      const current = labels[i];
      if (!next || !current) continue;
      const gap = (next.angle - current.angle + 360) % 360;
      if (gap < 13) {
        const shift = (13 - gap) / 2;
        current.angle = (current.angle - shift + 360) % 360;
        next.angle = (next.angle + shift) % 360;
      }
    }
  }
  return (
    <svg
      viewBox="0 0 400 400"
      role="img"
      aria-label="Mandala natal: signos, casas e posições planetárias; valores detalhados nas tabelas"
      className="mx-auto w-full max-w-xl text-ivory-100"
    >
      <circle cx="200" cy="200" r="184" fill="none" stroke="currentColor" strokeWidth="1" />
      <circle cx="200" cy="200" r="151" fill="none" stroke="currentColor" opacity=".35" />
      <circle cx="200" cy="200" r="94" fill="none" stroke="currentColor" opacity=".2" />
      {glyphs.map((glyph, i) => (
        <g key={glyph}>
          <line
            {...{
              x1: point(i * 30, 151).x,
              y1: point(i * 30, 151).y,
              x2: point(i * 30, 184).x,
              y2: point(i * 30, 184).y,
            }}
            stroke="currentColor"
            opacity=".4"
          />
          <text
            {...point(i * 30 + 15, 168)}
            fontSize="20"
            textAnchor="middle"
            dominantBaseline="central"
          >
            {glyph}
          </text>
        </g>
      ))}
      {chart.houses.map((cusp, i) => {
        const next = chart.houses[(i + 1) % 12];
        if (next === undefined) return null;
        return (
          <g key={i}>
            <line
              x1={point(cusp, 94).x}
              y1={point(cusp, 94).y}
              x2={point(cusp, 151).x}
              y2={point(cusp, 151).y}
              stroke="currentColor"
              opacity=".35"
            />
            <text
              {...point(cusp + ((next - cusp + 360) % 360) / 2, 103)}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="9"
            >
              {i + 1}
            </text>
          </g>
        );
      })}
      {chart.aspects.map((aspect) => {
        const a = point(chart.bodies.find((body) => body.id === aspect.bodyA)!.longitude, 90);
        const b = point(chart.bodies.find((body) => body.id === aspect.bodyB)!.longitude, 90);
        return (
          <line
            key={`${aspect.bodyA}-${aspect.bodyB}`}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke={[60, 120].includes(aspect.angle) ? '#6d5385' : '#9f5265'}
            opacity=".5"
            strokeWidth=".8"
          />
        );
      })}
      {labels.map(({ body, angle }) => (
        <g key={body.id}>
          <line
            x1={point(body.longitude, 91).x}
            y1={point(body.longitude, 91).y}
            x2={point(angle, 124).x}
            y2={point(angle, 124).y}
            stroke="currentColor"
            opacity=".45"
          />
          <circle
            {...{ cx: point(body.longitude, 91).x, cy: point(body.longitude, 91).y }}
            r="2"
            fill="currentColor"
          />
          <text {...point(angle, 135)} textAnchor="middle" dominantBaseline="central" fontSize="19">
            <title>{bodies[body.id][0]}</title>
            {bodies[body.id][1]}
          </text>
        </g>
      ))}
    </svg>
  );
};
