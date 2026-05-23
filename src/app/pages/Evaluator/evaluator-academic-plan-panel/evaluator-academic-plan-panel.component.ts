import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type {
  AcademicPlanCourseRow,
  AcademicPlanCourseStatus,
  AcademicPlanTermBlock,
  StudentAcademicPlan
} from '../student-permanent-records/evaluator-student-academic.models';

export interface AcademicPlanFilteredTerm extends AcademicPlanTermBlock {
  readonly visible: boolean;
}

@Component({
  selector: 'app-evaluator-academic-plan-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './evaluator-academic-plan-panel.component.html',
  styleUrl: './evaluator-academic-plan-panel.component.scss'
})
export class EvaluatorAcademicPlanPanelComponent implements OnChanges {
  @Input() plan: StudentAcademicPlan | null = null;

  expectedCompletionYear = 2026;

  readonly statusLegend: readonly { status: AcademicPlanCourseStatus; description: string }[] = [
    { status: 'Available', description: 'Prerequisites completed, can enroll' },
    { status: 'Pending', description: 'Waiting for prerequisite completion' },
    { status: 'Future', description: 'Planned for future terms' }
  ];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['plan']) {
      this.expectedCompletionYear = this.plan?.defaultExpectedCompletionYear ?? new Date().getFullYear() + 1;
    }
  }

  get filteredTerms(): readonly AcademicPlanFilteredTerm[] {
    if (!this.plan) {
      return [];
    }
    return this.plan.suggestedTerms
      .filter((term) => term.minCompletionYear <= this.expectedCompletionYear)
      .map((term) => ({ ...term, visible: true }));
  }

  get progressPercent(): number {
    if (!this.plan || this.plan.statusSummary.totalUnitsRequired === 0) {
      return 0;
    }
    return Math.round(
      (this.plan.statusSummary.unitsCompleted / this.plan.statusSummary.totalUnitsRequired) * 100
    );
  }

  get progressLabel(): string {
    if (!this.plan) {
      return '0/0';
    }
    const { unitsCompleted, totalUnitsRequired } = this.plan.statusSummary;
    return `${unitsCompleted}/${totalUnitsRequired}`;
  }

  get completionYearMin(): number {
    return this.plan?.expectedCompletionYearOptions[0] ?? 2025;
  }

  get completionYearMax(): number {
    const options = this.plan?.expectedCompletionYearOptions;
    return options?.[options.length - 1] ?? 2028;
  }

  incrementCompletionYear(): void {
    this.expectedCompletionYear = Math.min(this.completionYearMax, this.expectedCompletionYear + 1);
  }

  decrementCompletionYear(): void {
    this.expectedCompletionYear = Math.max(this.completionYearMin, this.expectedCompletionYear - 1);
  }

  onCompletionYearInput(): void {
    this.expectedCompletionYear = Math.min(
      this.completionYearMax,
      Math.max(this.completionYearMin, this.expectedCompletionYear)
    );
  }

  isPrerequisiteItalic(prerequisite: string): boolean {
    const lower = prerequisite.trim().toLowerCase();
    return lower === 'none' || lower.includes('year standing');
  }

  statusClass(status: AcademicPlanCourseStatus): string {
    return `eap__status eap__status--${status.toLowerCase()}`;
  }

  trackTerm(_index: number, term: AcademicPlanTermBlock): string {
    return term.termLabel;
  }

  trackCourse(_index: number, row: AcademicPlanCourseRow): string {
    return row.courseCode;
  }
}
