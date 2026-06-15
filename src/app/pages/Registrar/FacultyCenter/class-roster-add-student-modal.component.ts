import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, finalize, switchMap, takeUntil, tap } from 'rxjs/operators';
import { Student } from '../../../core/models/student.model';
import { PaginatedResponse } from '../../../core/models/api-response.model';
import { StudentsService } from '../students/students.service';
import { FacultyCenterService, ClassRosterStudentDto } from './faculty-center.service';
import { isFirstYearLevel } from './class-roster-student-curriculum.util';

@Component({
  selector: 'app-class-roster-add-student-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './class-roster-add-student-modal.component.html',
  styleUrl: './class-roster-add-student-modal.component.scss'
})
export class ClassRosterAddStudentModalComponent implements OnChanges, OnInit, OnDestroy {
  private readonly studentsService = inject(StudentsService);
  private readonly facultyCenterService = inject(FacultyCenterService);
  private readonly destroy$ = new Subject<void>();
  private readonly search$ = new Subject<string>();
  private enrolled = new Set<string>();

  @Input({ required: true }) facultyClassId!: number;
  
  @Input() enrolledStudentNumbers: string[] = [];

  @Output() readonly closed = new EventEmitter<void>();
  @Output() readonly studentAdded = new EventEmitter<ClassRosterStudentDto>();

  searchTerm = '';
  searchResults: Student[] = [];
  isLoadingSearch = false;
  addingStudentId: string | null = null;
  addError: string | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['enrolledStudentNumbers']) {
      this.enrolled = new Set(
        (this.enrolledStudentNumbers ?? []).map(n => (n ?? '').trim().toLowerCase()).filter(Boolean)
      );
    }
  }

  ngOnInit(): void {
    this.search$
      .pipe(
        debounceTime(350),
        distinctUntilChanged(),
        tap(() => {
          this.isLoadingSearch = true;
          this.addError = null;
        }),
        switchMap(raw => {
          const term = raw.trim();
          if (term.length < 2) {
            this.isLoadingSearch = false;
            return of({ success: true, data: [] } as PaginatedResponse<Student>);
          }
          return this.studentsService
            .getStudents({
              PageIndex: 1,
              PageSize: 30,
              SortDirection: 'asc',
              SortKey: '',
              searchTerm: term,
              status: 'Active'
            })
            .pipe(
              catchError(() => {
                this.isLoadingSearch = false;
                return of({ success: false, data: [] } as PaginatedResponse<Student>);
              })
            );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(res => {
        this.isLoadingSearch = false;
        const rows = res.data ?? [];
        this.searchResults = rows.filter(
          s => !this.enrolled.has((s.studentNumber ?? '').trim().toLowerCase())
        );
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchInput(value: string): void {
    this.searchTerm = value;
    this.search$.next(value);
    if (value.trim().length < 2) {
      this.searchResults = [];
    }
  }

  displayName(s: Student): string {
    const mid = s.middleName?.trim() ? ` ${s.middleName.trim()}` : '';
    return `${s.lastName?.trim() ?? ''}, ${s.firstName?.trim() ?? ''}${mid}`.trim();
  }

  isFirstYearHint(yearLevel: string | null | undefined): boolean {
    return isFirstYearLevel(yearLevel);
  }

  addStudent(s: Student): void {
    if (!this.facultyClassId || this.addingStudentId) {
      return;
    }
    const sid = Number(s.id);
    if (!Number.isFinite(sid) || sid <= 0) {
      this.addError = 'Invalid student record.';
      return;
    }
    this.addingStudentId = s.id;
    this.addError = null;
    this.facultyCenterService
      .addStudentToClass(this.facultyClassId, sid)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.addingStudentId = null;
        })
      )
      .subscribe({
        next: row => {
          this.enrolled.add((s.studentNumber ?? '').trim().toLowerCase());
          this.studentAdded.emit(row);
          this.searchResults = this.searchResults.filter(x => x.id !== s.id);
          this.closed.emit();
        },
        error: (err: { userMessage?: string; message?: string; status?: number }) => {
          const msg =
            err?.userMessage ||
            err?.message ||
            (err as { error?: { error?: { message?: string } } })?.error?.error?.message ||
            'Could not add this student.';
          this.addError = msg;
        }
      });
  }

  close(): void {
    this.closed.emit();
  }
}
