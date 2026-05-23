import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  filterAcademicPlanTerms,
  getAcademicPlanProgressPercent,
  getStudentAcademicPlan,
  type AcademicPlanCourseRow,
  type AcademicPlanCourseStatus,
  type AcademicPlanFilteredTerm,
  type AcademicPlanTermBlock,
  type StudentAcademicPlan
} from '../../../../mock-data/evaluator/student-academic-plan.mock';

@Component({
  selector: 'app-evaluator-academic-plan-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './evaluator-academic-plan-panel.component.html',
  styleUrl: './evaluator-academic-plan-panel.component.scss'
})
export class EvaluatorAcademicPlanPanelComponent implements OnChanges {
  @Input() studentId: string | null = null;

  expectedCompletionYear = 2026;

  readonly statusLegend: readonly { status: AcademicPlanCourseStatus; description: string }[] = [
    { status: 'Available', description: 'Prerequisites completed, can enroll' },
    { status: 'Pending', description: 'Waiting for prerequisite completion' },
    { status: 'Future', description: 'Planned for future terms' }
  ];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['studentId']) {
      const plan = getStudentAcademicPlan(this.studentId);
      this.expectedCompletionYear = plan?.defaultExpectedCompletionYear ?? 2026;
    }
  }

  get plan(): StudentAcademicPlan | null {
    return getStudentAcademicPlan(this.studentId);
  }

  get filteredTerms(): readonly AcademicPlanFilteredTerm[] {
    if (!this.plan) {
      return [];
    }
    return filterAcademicPlanTerms(this.plan, this.expectedCompletionYear);
  }

  get progressPercent(): number {
    return this.plan ? getAcademicPlanProgressPercent(this.plan) : 0;
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
