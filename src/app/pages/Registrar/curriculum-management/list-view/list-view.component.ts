import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Course } from '../../../../core/models/course.model';
import { Program } from '../../../../core/models/program.model';
import { YearLevel } from '../enums/year-level.enum';
import { Semester } from '../enums/semester.enum';
import { BasePaginationHandler } from '../../../../shared/handlers/base-pagination.handler';

@Component({
  selector: 'app-list-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './list-view.component.html',
  styleUrl: './list-view.component.scss'
})
export class ListViewComponent extends BasePaginationHandler implements OnInit, OnChanges {
  
  @Input() readOnly = false;
  @Input() courses: Course[] = [];
  @Input() programs: Program[] = [];
  @Input() isLoadingCourses: boolean = false;
  @Input() courseSearchTerm: string = '';
  @Input() selectedProgramFilter: number | null = null;
  @Input() selectedPrerequisiteFilter: string | null = null;
  @Input() selectedYearFilter: string = '';
  @Input() selectedSemesterFilter: string = '';
  
  private _currentPage: number = 1;
  private _totalPages: number = 1;
  private _pageSize: number = 10;
  private _totalRecords: number = 0;
  
  @Input() set currentPageInput(value: number) {
    this._currentPage = value;
    this.currentPage = value;
  }
  get currentPageInput(): number {
    return this._currentPage;
  }
  
  @Input() set totalPagesInput(value: number) {
    this._totalPages = value;
    this.totalPages = value;
  }
  get totalPagesInput(): number {
    return this._totalPages;
  }
  
  @Input() set pageSizeInput(value: number) {
    this._pageSize = value;
    this.pageSize = value;
  }
  get pageSizeInput(): number {
    return this._pageSize;
  }
  
  @Input() set totalRecordsInput(value: number) {
    this._totalRecords = value;
    this.totalRecords = value;
  }
  get totalRecordsInput(): number {
    return this._totalRecords;
  }

  @Output() searchTermChange = new EventEmitter<string>();
  @Output() programFilterChange = new EventEmitter<number | null>();
  @Output() prerequisiteFilterChange = new EventEmitter<string | null>();
  @Output() yearFilterChange = new EventEmitter<string>();
  @Output() semesterFilterChange = new EventEmitter<string>();
  @Output() addCourse = new EventEmitter<void>();
  @Output() batchUpload = new EventEmitter<void>();
  @Output() editCourse = new EventEmitter<Course>();
  @Output() deleteCourse = new EventEmitter<Course>();
  @Output() pageChange = new EventEmitter<{ page: number; reset: boolean }>();

  YearLevel = YearLevel;
  Semester = Semester;

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {
  }

  onSearchChange(value: string): void {
    this.courseSearchTerm = value;
    this.resetToFirstPage();
    this.searchTermChange.emit(value);
    this.pageChange.emit({ page: this.currentPage, reset: true });
  }

  onProgramFilterChange(value: number | null): void {
    this.selectedProgramFilter = value;
    this.resetToFirstPage();
    this.programFilterChange.emit(value);
    this.pageChange.emit({ page: this.currentPage, reset: true });
  }

  onPrerequisiteFilterChange(value: string | null): void {
    this.selectedPrerequisiteFilter = value;
    this.resetToFirstPage();
    this.prerequisiteFilterChange.emit(value);
    this.pageChange.emit({ page: this.currentPage, reset: true });
  }

  onYearFilterChange(value: string): void {
    this.selectedYearFilter = value;
    this.resetToFirstPage();
    this.yearFilterChange.emit(value);
    this.pageChange.emit({ page: this.currentPage, reset: true });
  }

  onSemesterFilterChange(value: string): void {
    this.selectedSemesterFilter = value;
    this.resetToFirstPage();
    this.semesterFilterChange.emit(value);
    this.pageChange.emit({ page: this.currentPage, reset: true });
  }

  onAddCourseClick(): void {
    this.addCourse.emit();
  }

  onBatchUploadClick(): void {
    this.batchUpload.emit();
  }

  onEditCourseClick(course: Course): void {
    this.editCourse.emit(course);
  }

  onDeleteCourseClick(course: Course): void {
    this.deleteCourse.emit(course);
  }

  onPreviousPageClick(): void {
    if (this.currentPage > 1) {
      const newPage = this.currentPage - 1;
      this.currentPage = newPage;
      this.pageChange.emit({ page: newPage, reset: false });
    }
  }

  onNextPageClick(): void {
    if (this.currentPage < this.totalPages) {
      const newPage = this.currentPage + 1;
      this.currentPage = newPage;
      this.pageChange.emit({ page: newPage, reset: false });
    }
  }

  getUniquePrerequisites(): string[] {
    const prerequisitesSet = new Set<string>();
    this.courses.forEach(course => {
      if (course.prerequisites && course.prerequisites.trim() !== '' && course.prerequisites !== 'None') {
        prerequisitesSet.add(course.prerequisites);
      }
    });
    return Array.from(prerequisitesSet).sort();
  }

  protected loadData(): void {
  }
}

