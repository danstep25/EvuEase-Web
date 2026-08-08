import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, finalize, merge, Subject, takeUntil } from 'rxjs';
import { Student } from '../../../core/models/student.model';
import { Program } from '../../../core/models/program.model';
import { PaginatedResponse } from '../../../core/models/api-response.model';
import { StudentsService } from './students.service';
import { LookupService } from '../../../shared/services/lookup.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { BasePaginationHandler } from '../../../shared/handlers/base-pagination.handler';
import { SORT_DEFAULTS } from '../../../shared/constants/sort.constant';
import {
  normalizeStudentYearTerm,
  studentYearTermFilterOptions
} from '../../../shared/utils/student-year-level.util';


interface FilterOption {
  readonly value: string | null;
  readonly label: string;
}

interface ApiErrorShape {
  userMessage?: string;
  message?: string;
}

@Component({
  selector: 'app-students-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './students.component.html',
  styleUrl: './students.component.scss'
})
export class StudentsComponent extends BasePaginationHandler implements OnInit, OnDestroy {
  private static readonly ALL_PROGRAMS: FilterOption = { value: '', label: 'All Programs' };

  private readonly router = inject(Router);
  private readonly studentsService = inject(StudentsService);
  private readonly lookupService = inject(LookupService);
  private readonly notificationService = inject(NotificationService);
  private readonly fb = inject(FormBuilder);
  private readonly destroy$ = new Subject<void>();

  pageTitle = 'Students Management';
  pageSubtitle = 'Manage student information and academic records';

  searchForm!: FormGroup;
  students: Student[] = [];
  isLoading = false;
  isLoadingPrograms = false;

  programFilterOptions: FilterOption[] = [StudentsComponent.ALL_PROGRAMS];

  readonly yearLevelFilterOptions: FilterOption[] = studentYearTermFilterOptions();

  readonly typeFilterOptions: FilterOption[] = [
    { value: '', label: 'All Types' },
    { value: 'Regular', label: 'Regular' },
    { value: 'Transferee', label: 'Transferee' }
  ];

  readonly statusFilterOptions: FilterOption[] = [
    { value: '', label: 'All Status' },
    { value: 'Active', label: 'Active' },
    { value: 'Inactive', label: 'Inactive' },
    { value: 'Dropped', label: 'Dropped' }
  ];

  ngOnInit(): void {
    this.searchForm = this.fb.group({
      search: [''],
      program: [''],
      yearLevel: [''],
      type: [''],
      status: ['']
    });

    const search$ = this.searchForm.get('search')!.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged()
    );
    const program$ = this.searchForm.get('program')!.valueChanges.pipe(distinctUntilChanged());
    const yearLevel$ = this.searchForm.get('yearLevel')!.valueChanges.pipe(distinctUntilChanged());
    const type$ = this.searchForm.get('type')!.valueChanges.pipe(distinctUntilChanged());
    const status$ = this.searchForm.get('status')!.valueChanges.pipe(distinctUntilChanged());

    merge(search$, program$, yearLevel$, type$, status$)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.resetToFirstPage();
        this.loadStudents();
      });

    this.loadPrograms();
    this.loadStudents();
  }

  private loadPrograms(): void {
    this.isLoadingPrograms = true;
    this.lookupService
      .getProgramsForDropdown()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoadingPrograms = false;
        })
      )
      .subscribe({
        next: (programs: Program[]) => {
          const seen = new Set<string>();
          const rows: FilterOption[] = [StudentsComponent.ALL_PROGRAMS];
          for (const p of programs) {
            const code = (p.programCode ?? '').trim();
            if (!code || seen.has(code)) {
              continue;
            }
            seen.add(code);
            rows.push({
              value: code,
              label: code
            });
          }
          this.programFilterOptions = rows;
        },
        error: (err: unknown) => {
          console.error('Failed to load programs for filter:', err);
          this.programFilterOptions = [StudentsComponent.ALL_PROGRAMS];
          this.notificationService.error(
            'Programs unavailable',
            this.resolveErrorMessage(err, 'Could not load the program list. You can still filter by other fields.')
          );
        }
      });
  }

  private resolveErrorMessage(err: unknown, fallback: string): string {
    if (err && typeof err === 'object' && ('userMessage' in err || 'message' in err)) {
      const e = err as ApiErrorShape;
      return e.userMessage || e.message || fallback;
    }
    return fallback;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadStudents(): void {
    this.isLoading = true;
    const formValue = this.searchForm.value;
    const params = {
      PageIndex: this.currentPage,
      PageSize: this.pageSize,
      SortDirection: SORT_DEFAULTS.DIRECTION,
      SortKey: '',
      searchTerm: formValue.search || '',
      programCode: formValue.program || '',
      yearLevel: formValue.yearLevel || '',
      type: formValue.type || '',
      status: formValue.status || ''
    };

    this.studentsService
      .getStudents(params)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (response: PaginatedResponse<Student>) => {
          if (response.success && response.data) {
            this.students = response.data;
            if (response.pagination) {
              this.updatePagination(
                response.pagination.total,
                response.pagination.totalPages,
                response.pagination.page
              );
            }
          } else {
            this.students = [];
            this.resetPagination();
          }
        },
        error: (err: unknown) => {
          console.error('Failed to load students:', err);
          this.students = [];
          this.resetPagination();
          this.notificationService.error(
            'Loading failed',
            this.resolveErrorMessage(err, 'Failed to load students. Please try again.')
          );
        }
      });
  }

  getStudentFullName(student: Student): string {
    const parts = [student.lastName, ', ', student.firstName];
    if (student.middleName) {
      parts.push(' ', student.middleName);
    }
    return parts.join('');
  }

  getStatusBadgeClass(status: string): string {
    const normalized = (status || '').toLowerCase();
    if (normalized === 'active') {
      return 'bg-green-100 text-green-800';
    }
    if (normalized === 'dropped') {
      return 'bg-red-100 text-red-800';
    }
    return 'bg-gray-100 text-gray-800';
  }

  getTypeBadgeClass(type: string): string {
    const normalized = (type || '').toLowerCase();
    if (normalized === 'regular') {
      return 'bg-blue-100 text-blue-800';
    }
    if (normalized === 'transferee') {
      return 'bg-purple-100 text-purple-800';
    }
    return 'bg-gray-100 text-gray-800';
  }

  displayYearTerm(raw: string | null | undefined): string {
    return normalizeStudentYearTerm(raw);
  }

  onAddStudent(): void {
    void this.router.navigate(['/registrar/students/new']);
  }

  onViewStudent(student: Student): void {
    void this.router.navigate(['/registrar/students', String(student.id)]);
  }

  onEditStudent(student: Student): void {
    void this.router.navigate(['/registrar/students', String(student.id), 'edit']);
  }

  protected loadData(): void {
    this.loadStudents();
  }
}



