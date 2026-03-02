import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { Student } from '../../../core/models/student.model';
import { PaginatedResponse } from '../../../core/models/api-response.model';
import { StudentsService } from './students.service';
import { BasePaginationHandler } from '../../../shared/handlers/base-pagination.handler';
import { SORT_DEFAULTS } from '../../../shared/constants/sort.constant';

@Component({
  selector: 'app-students-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './students.component.html',
  styleUrl: './students.component.scss'
})
export class StudentsComponent extends BasePaginationHandler implements OnInit, OnDestroy {
  private readonly studentsService = inject(StudentsService);
  private readonly fb = inject(FormBuilder);
  private readonly destroy$ = new Subject<void>();

  pageTitle = 'Students Management';
  pageSubtitle = 'Manage student information and academic records';

  searchForm!: FormGroup;
  students: Student[] = [];
  isLoading = false;

  programFilterOptions: { value: string | null; label: string }[] = [
    { value: null, label: 'All Programs' }
  ];

  yearLevelFilterOptions: { value: string | null; label: string }[] = [
    { value: null, label: 'All Year Levels' },
    { value: 'First Year', label: 'First Year' },
    { value: 'Second Year', label: 'Second Year' },
    { value: 'Third Year', label: 'Third Year' },
    { value: 'Fourth Year', label: 'Fourth Year' },
    { value: 'Fifth Year', label: 'Fifth Year' }
  ];

  typeFilterOptions: { value: string | null; label: string }[] = [
    { value: null, label: 'All Types' },
    { value: 'Regular', label: 'Regular' },
    { value: 'Transferee', label: 'Transferee' }
  ];

  statusFilterOptions: { value: string | null; label: string }[] = [
    { value: null, label: 'All Status' },
    { value: 'Active', label: 'Active' },
    { value: 'Inactive', label: 'Inactive' },
    { value: 'Dropped', label: 'Dropped' }
  ];

  ngOnInit(): void {
    this.searchForm = this.fb.group({
      search: [''],
      program: [null],
      yearLevel: [null],
      type: [null],
      status: [null]
    });

    this.searchForm
      .get('search')
      ?.valueChanges.pipe(debounceTime(500), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.resetToFirstPage();
        this.loadStudents();
      });

    this.searchForm
      .get('program')
      ?.valueChanges.pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.resetToFirstPage();
        this.loadStudents();
      });

    this.searchForm
      .get('yearLevel')
      ?.valueChanges.pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.resetToFirstPage();
        this.loadStudents();
      });

    this.searchForm
      .get('type')
      ?.valueChanges.pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.resetToFirstPage();
        this.loadStudents();
      });

    this.searchForm
      .get('status')
      ?.valueChanges.pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.resetToFirstPage();
        this.loadStudents();
      });

    this.loadStudents();
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

    this.studentsService.getStudents(params).subscribe({
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
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.students = [];
        this.resetPagination();
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

  onAddStudent(): void {}

  onBatchUpload(): void {}

  onViewStudent(student: Student): void {
    void student;
  }

  onEditStudent(student: Student): void {
    void student;
  }

  protected loadData(): void {
    this.loadStudents();
  }
}



