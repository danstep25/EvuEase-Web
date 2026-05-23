import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchableSelectComponent } from '../../../shared/components/searchable-select/searchable-select.component';
import { EvaluatorAcademicPlanPanelComponent } from '../evaluator-academic-plan-panel/evaluator-academic-plan-panel.component';
import { EvaluatorMigrateCurriculumDialogComponent } from '../evaluator-migrate-curriculum-dialog/evaluator-migrate-curriculum-dialog.component';
import { EvaluatorCurriculumHistoryDialogComponent } from '../evaluator-curriculum-history-dialog/evaluator-curriculum-history-dialog.component';
import { SearchableSelectOption } from '../../../shared/components/searchable-select/searchable-select-option.model';
import {
  getStudentAcademicRecordProfile,
  type AcademicRecordCourseRow,
  type AcademicRecordCurriculumCourseRow,
  type AcademicRecordCurriculumTermBlock,
  type AcademicRecordRemark,
  type AcademicRecordSemesterBlock
} from '../../../../mock-data/evaluator/student-academic-records.mock';

type RecordsTab = 'academic-records' | 'academic-plan';
type RecordsViewMode = 'term' | 'curriculum';

@Component({
  selector: 'app-evaluator-academic-records-view',
  standalone: true,
  imports: [
    CommonModule,
    SearchableSelectComponent,
    EvaluatorAcademicPlanPanelComponent,
    EvaluatorMigrateCurriculumDialogComponent,
    EvaluatorCurriculumHistoryDialogComponent
  ],
  templateUrl: './evaluator-academic-records-view.component.html',
  styleUrl: './evaluator-academic-records-view.component.scss'
})
export class EvaluatorAcademicRecordsViewComponent {
  @Input({ required: true }) studentOptions: SearchableSelectOption[] = [];
  @Input() selectedStudentId: string | null = null;
  @Output() readonly selectedStudentIdChange = new EventEmitter<string | null>();
  @Input() showBackLink = false;
  @Output() readonly back = new EventEmitter<void>();

  activeTab: RecordsTab = 'academic-records';
  viewMode: RecordsViewMode = 'term';
  showMigrateCurriculumDialog = false;
  showCurriculumHistoryDialog = false;

  get profile() {
    return getStudentAcademicRecordProfile(this.selectedStudentId);
  }

  get termSemesters(): readonly AcademicRecordSemesterBlock[] {
    return this.profile?.termSemesters ?? [];
  }

  get curriculumTerms(): readonly AcademicRecordCurriculumTermBlock[] {
    return this.profile?.curriculumTerms ?? [];
  }

  get curriculumTermPairs(): readonly (readonly AcademicRecordCurriculumTermBlock[])[] {
    const terms = this.curriculumTerms;
    const pairs: AcademicRecordCurriculumTermBlock[][] = [];
    for (let i = 0; i < terms.length; i += 2) {
      pairs.push([...terms.slice(i, i + 2)]);
    }
    return pairs;
  }

  get hasTermRecords(): boolean {
    return this.termSemesters.length > 0;
  }

  get hasCurriculumRecords(): boolean {
    return this.curriculumTerms.length > 0;
  }

  setTab(tab: RecordsTab): void {
    this.activeTab = tab;
  }

  setViewMode(mode: RecordsViewMode): void {
    this.viewMode = mode;
  }

  onBack(): void {
    this.back.emit();
  }

  onSelectedStudentIdChange(id: string | null): void {
    this.showMigrateCurriculumDialog = false;
    this.showCurriculumHistoryDialog = false;
    this.selectedStudentIdChange.emit(id);
  }

  onOpenMigrateCurriculum(): void {
    if (!this.profile) {
      return;
    }
    this.showMigrateCurriculumDialog = true;
  }

  onCloseMigrateCurriculum(): void {
    this.showMigrateCurriculumDialog = false;
  }

  onOpenCurriculumHistory(): void {
    if (!this.profile) {
      return;
    }
    this.showCurriculumHistoryDialog = true;
  }

  onCloseCurriculumHistory(): void {
    this.showCurriculumHistoryDialog = false;
  }

  isPassedRemark(remarks: AcademicRecordRemark): boolean {
    return remarks === 'PASSED' || remarks === 'PASSED (RETAKE)';
  }

  isFailedRemark(remarks: AcademicRecordRemark): boolean {
    return remarks === 'FAILED';
  }

  trackSemester(_index: number, block: AcademicRecordSemesterBlock): string {
    return block.label;
  }

  trackCourse(_index: number, row: AcademicRecordCourseRow): string {
    return `${row.courseCode}-${row.grade}`;
  }

  trackCurriculumTerm(_index: number, block: AcademicRecordCurriculumTermBlock): string {
    return block.label;
  }

  trackCurriculumCourse(_index: number, row: AcademicRecordCurriculumCourseRow): string {
    return row.courseCode;
  }

  trackCurriculumPair(_index: number): number {
    return _index;
  }

  isPrerequisiteNone(prerequisite: string): boolean {
    return prerequisite.trim().toLowerCase() === 'none';
  }
}
