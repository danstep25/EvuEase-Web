import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { barChartMax, buildYTicks } from './analytics-chart.helpers';
import type { AnalyticsCountLabel } from './analytics.models';

export type BarChartColorVariant = 'purple' | 'blue' | 'teal';

@Component({
  selector: 'app-analytics-bar-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './analytics-bar-chart.component.html',
  styleUrl: './analytics-bar-chart.component.scss'
})
export class AnalyticsBarChartComponent {
  @Input({ required: true }) chartKey!: string;
  @Input({ required: true }) items: readonly AnalyticsCountLabel[] = [];
  @Input() variant: BarChartColorVariant = 'purple';
  @Input() labelsSmall = false;

  hoveredIndex: number | null = null;

  get yTicks(): number[] {
    return buildYTicks(this.max, 4);
  }

  get max(): number {
    return barChartMax(this.items.map((i) => i.count));
  }

  get columnCount(): number {
    return Math.max(this.items.length, 1);
  }

  barHeightPercent(count: number): number {
    return this.max > 0 ? (count / this.max) * 100 : 0;
  }

  gridLineY(tick: number): number {
    const ticks = this.yTicks;
    const min = ticks[ticks.length - 1] ?? 0;
    const max = ticks[0] ?? 1;
    const range = max - min || 1;
    return 100 - ((tick - min) / range) * 100;
  }

  verticalLineX(index: number): number {
    return (index / this.columnCount) * 100;
  }

  isHovered(index: number): boolean {
    return this.hoveredIndex === index;
  }

  onColumnEnter(index: number): void {
    this.hoveredIndex = index;
  }

  onColumnLeave(): void {
    this.hoveredIndex = null;
  }

  trackItem(_i: number, item: AnalyticsCountLabel): string {
    return item.label;
  }

  trackTick(tick: number): number {
    return tick;
  }
}
