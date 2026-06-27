import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, of } from 'rxjs';
import { Course } from '../../../../core/models/course.model';
import { Curricula } from '../../../../core/models/curricula.model';
import { Program } from '../../../../core/models/program.model';
import { SORT_DEFAULTS } from '../../../../shared/constants/sort.constant';
import { resolveCurriculumCompletionYears } from '../../../../shared/utils/curriculum-completion.util';
import { CourseService } from '../course.service';

const TABLE_VIEW_BULK_PARAMS = {
  PageIndex: 1,
  PageSize: 500,
  SortDirection: SORT_DEFAULTS.DIRECTION,
  SortKey: ''
} as const;

function normalizeSemesterBucket(semester: string): '1st Semester' | '2nd Semester' {
  const value = semester.trim().toLowerCase();
  if (value.startsWith('2') || value.includes('second') || value.includes('2nd')) {
    return '2nd Semester';
  }
  return '1st Semester';
}

function normalizeYearBucket(year: string): string {
  const value = year.trim();
  const match = value.match(/^year\s*(\d+)$/i) ?? value.match(/^(\d+)$/);
  if (match?.[1]) {
    return `Year ${match[1]}`;
  }
  return value;
}

@Component({
  selector: 'app-curriculum-table-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './curriculum-table-view.component.html',
  styleUrl: './curriculum-table-view.component.scss'
})
export class CurriculumTableViewComponent implements OnChanges {
  private readonly courseService = inject(CourseService);

  @Input() programs: Program[] = [];
  @Input() curricula: Curricula[] = [];
  @Input() isLoadingCurricula: boolean = false;
  @Input() selectedProgramFilter: number | null = null;
  @Input() selectedCurriculumFilter: string | null = null;
  @Input() reloadToken = 0;

  @Output() programFilterChange = new EventEmitter<number | null>();
  @Output() curriculumFilterChange = new EventEmitter<string | null>();
  @Output() batchUpload = new EventEmitter<void>();

  tableCourses: Course[] = [];
  isLoadingTableCourses = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['selectedProgramFilter'] ||
      changes['selectedCurriculumFilter'] ||
      changes['reloadToken']
    ) {
      this.loadTableCourses();
    }
  }

  getSelectedProgram(): Program | null {
    if (!this.selectedProgramFilter) return null;
    return this.programs.find(p => p.programId === this.selectedProgramFilter) || null;
  }

  getSelectedCurriculum(): Curricula | null {
    if (!this.selectedCurriculumFilter) return null;
    return this.curricula.find(c => c.curriculumCode === this.selectedCurriculumFilter) || null;
  }

  getCoursesByYearAndSemester(): { [year: string]: { [semester: string]: Course[] } } {
    const grouped: { [year: string]: { [semester: string]: Course[] } } = {};

    this.tableCourses.forEach(course => {
      const year = normalizeYearBucket(course.courseYearLevel);
      const semester = normalizeSemesterBucket(course.courseSemester);

      if (!grouped[year]) {
        grouped[year] = {};
      }
      if (!grouped[year][semester]) {
        grouped[year][semester] = [];
      }
      grouped[year][semester].push(course);
    });

    return grouped;
  }

  getYearDisplayName(year: string): string {
    const yearMap: { [key: string]: string } = {
      'Year 1': 'FIRST YEAR',
      'Year 2': 'SECOND YEAR',
      'Year 3': 'THIRD YEAR',
      'Year 4': 'FOURTH YEAR',
      'Year 5': 'FIFTH YEAR'
    };
    return yearMap[year] || year.toUpperCase();
  }

  getTotalUnitsForSemester(courses: Course[]): number {
    return courses.reduce((total, course) => total + (course.courseTotalUnits || 0), 0);
  }

  getTotalCourses(): number {
    return this.tableCourses.length;
  }

  getTotalUnits(): number {
    return this.tableCourses.reduce((total, course) => total + (course.courseTotalUnits || 0), 0);
  }

  getYearsToComplete(): number {
    const program = this.getSelectedProgram();
    return resolveCurriculumCompletionYears({
      programCompletionYears: program?.programCompletionYears,
      courses: this.tableCourses
    });
  }

  getSortedYears(): string[] {
    const yearOrder = ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5'];
    const grouped = this.getCoursesByYearAndSemester();
    return yearOrder.filter(year => grouped[year]);
  }

  onProgramFilterChange(value: number | string | null): void {
    let programId: number | null = null;

    if (value === null || value === '' || value === 'null' || value === undefined) {
      programId = null;
    } else if (typeof value === 'string') {
      const parsed = parseInt(value, 10);
      programId = isNaN(parsed) ? null : parsed;
    } else {
      programId = value;
    }

    this.programFilterChange.emit(programId);
  }

  onCurriculumFilterChange(value: string | null): void {
    this.curriculumFilterChange.emit(value);
  }

  onBatchUploadClick(): void {
    this.batchUpload.emit();
  }

  private loadTableCourses(): void {
    const programId = this.selectedProgramFilter;
    const curriculumCode = this.selectedCurriculumFilter?.trim();

    if (!programId || !curriculumCode) {
      this.tableCourses = [];
      this.isLoadingTableCourses = false;
      return;
    }

    this.isLoadingTableCourses = true;
    this.courseService
      .getCourses({
        ...TABLE_VIEW_BULK_PARAMS,
        programId,
        curriculumCode
      })
      .pipe(catchError(() => of(null)))
      .subscribe((response) => {
        this.tableCourses = response?.success && response.data ? response.data : [];
        this.isLoadingTableCourses = false;
      });
  }
}
