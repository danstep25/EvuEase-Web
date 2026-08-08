export interface ChartPoint {
  readonly x: number;
  readonly y: number;
}

export interface LineSeriesPoint extends ChartPoint {
  readonly yEval: number;
  readonly yCharge: number;
}

export interface GridColumnHover {
  readonly index: number;
  readonly left: number;
  readonly width: number;
  readonly centerX: number;
}

export const LINE_CHART = {
  width: 560,
  height: 220,
  padLeft: 48,
  padRight: 20,
  padTop: 24,
  padBottom: 44,
  plotBottom: 196
} as const;

export function buildYTicks(maxValue: number, divisions = 4): number[] {
  const max = Math.max(divisions, Math.ceil(maxValue / divisions) * divisions);
  const step = max / divisions;
  return Array.from({ length: divisions + 1 }, (_, i) => Math.round(max - step * i));
}

export function barChartMax(counts: readonly number[]): number {
  const max = Math.max(0, ...counts);
  if (max <= 4) {
    return 4;
  }
  if (max <= 8) {
    return 8;
  }
  return Math.ceil(max / 4) * 4;
}

export function smoothLinePath(points: readonly ChartPoint[]): string {
  if (points.length === 0) {
    return '';
  }
  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y}`;
  }

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const cx = (p0.x + p1.x) / 2;
    d += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
  }
  return d;
}

export function lineColumnBands(points: readonly ChartPoint[]): GridColumnHover[] {
  if (points.length === 0) {
    return [];
  }

  const { padLeft, padRight, width } = LINE_CHART;
  const rightEdge = width - padRight;

  return points.map((p, i) => {
    const prevX = i === 0 ? padLeft : (points[i - 1].x + p.x) / 2;
    const nextX = i === points.length - 1 ? rightEdge : (p.x + points[i + 1].x) / 2;
    return {
      index: i,
      left: prevX,
      width: nextX - prevX,
      centerX: p.x
    };
  });
}
