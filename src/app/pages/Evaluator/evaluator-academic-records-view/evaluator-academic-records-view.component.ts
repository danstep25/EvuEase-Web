import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { SearchableSelectComponent } from '../../../shared/components/searchable-select/searchable-select.component';
import { EvaluatorAcademicPlanPanelComponent } from '../evaluator-academic-plan-panel/evaluator-academic-plan-panel.component';
import { EvaluatorMigrateCurriculumDialogComponent } from '../evaluator-migrate-curriculum-dialog/evaluator-migrate-curriculum-dialog.component';
import { EvaluatorCurriculumHistoryDialogComponent } from '../evaluator-curriculum-history-dialog/evaluator-curriculum-history-dialog.component';
import { SearchableSelectOption } from '../../../shared/components/searchable-select/searchable-select-option.model';
import { EvaluatorStudentAcademicService } from '../student-permanent-records/evaluator-student-academic.service';
import type {
  AcademicRecordCurriculumCourseRow,
  AcademicRecordCurriculumTermBlock,
  AcademicRecordRemark,
  AcademicRecordSemesterBlock,
  StudentAcademicPlan,
  StudentAcademicRecordProfile
} from '../student-permanent-records/evaluator-student-academic.models';

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
export class EvaluatorAcademicRecordsViewComponent implements OnChanges, OnDestroy {
  private readonly academicService = inject(EvaluatorStudentAcademicService);
  private readonly destroy$ = new Subject<void>();

  @Input({ required: true }) studentOptions: SearchableSelectOption[] = [];
  @Input() isLoadingStudents = false;
  @Input() selectedStudentId: string | null = null;
  @Output() readonly selectedStudentIdChange = new EventEmitter<string | null>();
  @Input() showBackLink = false;
  @Output() readonly back = new EventEmitter<void>();

  activeTab: RecordsTab = 'academic-records';
  viewMode: RecordsViewMode = 'term';
  showMigrateCurriculumDialog = false;
  showCurriculumHistoryDialog = false;

  profile: StudentAcademicRecordProfile | null = null;
  academicPlan: StudentAcademicPlan | null = null;
  isLoadingProfile = false;
  profileLoadError: string | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedStudentId']) {
      this.loadStudentData(this.selectedStudentId);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get termSemesters(): readonly AcademicRecordSemesterBlock[] {
    return this.profile?.termSemesters ?? [];
  }

  get curriculumTerms(): readonly AcademicRecordCurriculumTermBlock[] {
    return this.profile?.curriculumTerms ?? [];
  }

  get curriculumTermPairs(): readonly (readonly AcademicRecordCurriculumTermBlock[])[] {
    const bucket = new Map<string, { first?: AcademicRecordCurriculumTermBlock; second?: AcademicRecordCurriculumTermBlock }>();

    for (const term of this.curriculumTerms) {
      const parts = term.label.split(' - ');
      const yearLevel = parts[0]?.trim() || term.label;
      const semester = parts.slice(1).join(' - ').trim();
      const isSecondSemester = /\b2\s*nd\b|\bsecond\b/i.test(semester);

      if (!bucket.has(yearLevel)) {
        bucket.set(yearLevel, {});
      }

      const entry = bucket.get(yearLevel)!;
      if (isSecondSemester) {
        entry.second = term;
      } else {
        entry.first = term;
      }
    }

    const sortedYears = [...bucket.keys()].sort((a, b) => {
      const yearA = Number(a.match(/(\d+)/)?.[1] ?? 99);
      const yearB = Number(b.match(/(\d+)/)?.[1] ?? 99);
      return yearA - yearB;
    });

    return sortedYears.map((yearLevel) => {
      const entry = bucket.get(yearLevel)!;
      const row: AcademicRecordCurriculumTermBlock[] = [];
      if (entry.first) {
        row.push(entry.first);
      }
      if (entry.second) {
        row.push(entry.second);
      }
      return row;
    });
  }

  get hasTermRecords(): boolean {
    return this.termSemesters.length > 0;
  }

  get hasCurriculumRecords(): boolean {
    return this.curriculumTerms.length > 0;
  }

  get usesCurriculumRoadmap(): boolean {
    return this.profile?.usesCurriculumRoadmap ?? false;
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

  onCloseMigrateCurriculum(reload = false): void {
    this.showMigrateCurriculumDialog = false;
    if (reload && this.selectedStudentId) {
      this.viewMode = 'term';
      this.activeTab = 'academic-records';
      this.loadStudentData(this.selectedStudentId);
    }
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

  isNotTakenRemark(remarks: AcademicRecordRemark): boolean {
    return remarks === 'NOT TAKEN';
  }

  isPendingRemark(remarks: AcademicRecordRemark): boolean {
    return remarks === 'PENDING';
  }

  isIncompleteRemark(remarks: AcademicRecordRemark): boolean {
    return remarks === 'INCOMPLETE';
  }

  takenUnits(courses: readonly { units: number; isNotTaken?: boolean }[]): number {
    return courses.filter((c) => !c.isNotTaken).reduce((sum, c) => sum + c.units, 0);
  }

  takenCurriculumUnits(courses: readonly AcademicRecordCurriculumCourseRow[]): number {
    return courses.filter((c) => !c.isNotTaken).reduce((sum, c) => sum + c.units, 0);
  }

  trackSemester(_index: number, block: AcademicRecordSemesterBlock): string {
    return block.label;
  }

  trackCourse(_index: number, row: { courseCode: string; grade: string }): string {
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

  private loadStudentData(studentId: string | null): void {
    this.profile = null;
    this.academicPlan = null;
    this.profileLoadError = null;

    if (!studentId) {
      return;
    }

    this.isLoadingProfile = true;
    this.academicService
      .loadAcademicProfile(studentId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (profile) => {
          this.profile = profile;
          this.isLoadingProfile = false;
          if (!profile) {
            this.profileLoadError = 'Could not load student academic records.';
          }
        },
        error: () => {
          this.isLoadingProfile = false;
          this.profileLoadError = 'Could not load student academic records.';
        }
      });

    this.academicService
      .loadAcademicPlan(studentId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (plan) => {
          this.academicPlan = plan;
        }
      });
  }
}
