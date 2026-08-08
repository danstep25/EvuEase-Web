import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClassRosterStudentDto } from './faculty-center.service';
import { rosterRemarkCategoryForFilter } from './grade-roster-grade-remarks.util';

@Component({
  selector: 'app-grade-roster-student-grades',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './grade-roster-student-grades.component.html',
  styleUrl: './grade-roster-student-grades.component.scss'
})
export class GradeRosterStudentGradesComponent {
  @Input() students: ClassRosterStudentDto[] = [];
  @Input() loading = false;

  @Output() uploadGrades = new EventEmitter<void>();
  @Output() editStudent = new EventEmitter<ClassRosterStudentDto>();

  searchQuery = '';
  programFilter = '';
  yearLevelFilter = '';
  remarksFilter = '';
  currentPage = 1;
  readonly pageSize = 10;

  readonly remarksOptions = [
    { value: '', label: 'All Remarks' },
    { value: 'Passed', label: 'Passed' },
    { value: 'Failed', label: 'Failed' },
    { value: 'Incomplete', label: 'Incomplete' },
    { value: '__none__', label: 'No remark / no grade' }
  ];

  get programOptions(): string[] {
    const set = new Set<string>();
    for (const s of this.students) {
      const p = s.programCode?.trim();
      if (p) {
        set.add(p);
      }
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }

  get yearLevelOptions(): string[] {
    const set = new Set<string>();
    for (const s of this.students) {
      const y = s.yearLevel?.trim();
      if (y) {
        set.add(y);
      }
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }

  get filteredStudents(): ClassRosterStudentDto[] {
    let list = [...this.students];
    const q = this.searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        s =>
          (s.studentId || '').toLowerCase().includes(q) ||
          (s.displayName || '').toLowerCase().includes(q)
      );
    }
    if (this.programFilter) {
      list = list.filter(s => s.programCode === this.programFilter);
    }
    if (this.yearLevelFilter) {
      list = list.filter(s => s.yearLevel === this.yearLevelFilter);
    }
    if (this.remarksFilter === '__none__') {
      list = list.filter(s => !s.remarks);
    } else if (this.remarksFilter) {
      const want = this.remarksFilter as 'Passed' | 'Failed' | 'Incomplete';
      list = list.filter(s => rosterRemarkCategoryForFilter(s) === want);
    }
    return list;
  }

  get totalPages(): number {
    const pages = Math.ceil(this.filteredStudents.length / this.pageSize);
    return Math.max(1, pages);
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get paginatedFilteredStudents(): ClassRosterStudentDto[] {
    const page = this.safeCurrentPage;
    const start = (page - 1) * this.pageSize;
    return this.filteredStudents.slice(start, start + this.pageSize);
  }

  get visibleStartIndex(): number {
    if (this.filteredStudents.length === 0) {
      return 0;
    }
    return (this.safeCurrentPage - 1) * this.pageSize + 1;
  }

  get visibleEndIndex(): number {
    return Math.min(this.safeCurrentPage * this.pageSize, this.filteredStudents.length);
  }

  private get safeCurrentPage(): number {
    if (this.currentPage < 1) {
      this.currentPage = 1;
    }
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }
    return this.currentPage;
  }

  onFiltersChanged(): void {
    this.currentPage = 1;
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }
    this.currentPage = page;
  }

  remarkBadgeClass(remark: string | null | undefined): string {
    const r = (remark || '').toLowerCase();
    if (r === 'passed') {
      return 'grsg-badge grsg-badge--passed';
    }
    if (r === 'failed') {
      return 'grsg-badge grsg-badge--failed';
    }
    if (r === 'incomplete') {
      return 'grsg-badge grsg-badge--incomplete';
    }
    return 'grsg-badge grsg-badge--neutral';
  }

  displayGrade(g: string | null | undefined): string {
    if (g == null || String(g).trim() === '') {
      return '—';
    }
    return String(g);
  }

  onUploadClick(): void {
    this.uploadGrades.emit();
  }

  onEditClick(row: ClassRosterStudentDto): void {
    this.editStudent.emit(row);
  }
}
