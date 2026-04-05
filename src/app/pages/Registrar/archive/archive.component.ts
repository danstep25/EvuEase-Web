import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Observable, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { ArchiveService } from './archive.service';
import {
  ArchivedCurriculumRow,
  ArchivedProgramRow,
  ArchivedSchoolYearRow,
  ArchivedStudentRow
} from './archive.models';
import { NotificationService } from '../../../shared/services/notification.service';
import {
  ConfirmationModalComponent,
  ConfirmationModalConfig
} from '../../../shared/components/confirmation-modal/confirmation-modal.component';
import { PaginationParams } from '../../../shared/services/http-base.service';
import { UserService } from '../../Admin/user-management/user.service';
import { User } from '../../../core/models/user.model';
import { PaginatedResponse } from '../../../core/models/api-response.model';
import { LookupService } from '../../../shared/services/lookup.service';
import { Program } from '../../../core/models/program.model';

export enum ArchiveTab {
  Programs = 'programs',
  Students = 'students',
  SchoolYears = 'school-years',
  Curricula = 'curricula'
}


export interface ArchiveDeletedByOption {
  value: string;
  label: string;
}


export interface ArchiveStudentFilterOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-archive',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePipe, ConfirmationModalComponent],
  templateUrl: './archive.component.html',
  styleUrl: './archive.component.scss'
})
export class ArchiveComponent implements OnInit, OnDestroy {
  private readonly archiveService = inject(ArchiveService);
  private readonly lookupService = inject(LookupService);
  private readonly userService = inject(UserService);
  private readonly fb = inject(FormBuilder);
  private readonly notificationService = inject(NotificationService);
  private readonly destroy$ = new Subject<void>();

  readonly ArchiveTab = ArchiveTab;

  pageTitle = 'Archive';
  pageSubtitle = 'View and restore deleted records';

  activeTab: ArchiveTab = ArchiveTab.Programs;
  filterForm!: FormGroup;
  showAdvancedFilters = false;

  programs: ArchivedProgramRow[] = [];
  students: ArchivedStudentRow[] = [];
  schoolYears: ArchivedSchoolYearRow[] = [];
  curricula: ArchivedCurriculumRow[] = [];

  isLoading = false;

  showRestoreConfirmation = false;
  showPermanentConfirmation = false;
  restoreConfirmationConfig: ConfirmationModalConfig = {
    title: 'Restore record',
    message: '',
    confirmText: 'Restore',
    cancelText: 'Cancel',
    confirmButtonClass: 'bg-emerald-600 hover:bg-emerald-700'
  };
  permanentConfirmationConfig: ConfirmationModalConfig = {
    title: 'Delete permanently',
    message: '',
    confirmText: 'Delete permanently',
    cancelText: 'Cancel',
    confirmButtonClass: 'bg-red-600 hover:bg-red-700'
  };

  private pendingProgram: ArchivedProgramRow | null = null;
  private pendingStudent: ArchivedStudentRow | null = null;
  private pendingSchoolYear: ArchivedSchoolYearRow | null = null;
  private pendingCurriculum: ArchivedCurriculumRow | null = null;
  private pendingAction: 'restore' | 'permanent' | null = null;

  
  readonly completionYearOptions: readonly number[] = [1, 2, 3, 4, 5, 6];

  deletedByUserOptions: ArchiveDeletedByOption[] = [];

  programFilterOptions: ArchiveStudentFilterOption[] = [{ value: '', label: 'All Programs' }];

  readonly yearLevelFilterOptions: readonly ArchiveStudentFilterOption[] = [
    { value: '', label: 'All Year Levels' },
    { value: 'First Year', label: 'First Year' },
    { value: 'Second Year', label: 'Second Year' },
    { value: 'Third Year', label: 'Third Year' },
    { value: 'Fourth Year', label: 'Fourth Year' },
    { value: 'Fifth Year', label: 'Fifth Year' }
  ];

  
  readonly semesterFilterOptions: readonly ArchiveStudentFilterOption[] = [
    { value: '', label: 'All Semesters' },
    { value: '1st Semester', label: '1st Semester' },
    { value: '2nd Semester', label: '2nd Semester' }
  ];

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      search: [''],
      yearsOfCompletion: [''],
      studentProgram: [''],
      yearLevel: [''],
      semester: [''],
      dateFrom: [''],
      dateTo: [''],
      deletedBy: ['']
    });

    this.loadDeletedByUserOptions();
    this.loadProgramFilterOptions();

    this.filterForm.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged(
          (a, b) =>
            JSON.stringify(a) === JSON.stringify(b)
        ),
        takeUntil(this.destroy$)
      )
      .subscribe(() => this.loadActiveTab());

    this.loadActiveTab();
  }

  private loadProgramFilterOptions(): void {
    this.lookupService
      .getProgramsForDropdown()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (programs: Program[]) => {
          const seen = new Set<string>();
          const rows: ArchiveStudentFilterOption[] = [{ value: '', label: 'All Programs' }];
          for (const p of programs) {
            const code = (p.programCode ?? '').trim();
            if (!code || seen.has(code)) {
              continue;
            }
            seen.add(code);
            rows.push({ value: code, label: code });
          }
          this.programFilterOptions = rows;
        },
        error: err => {
          console.warn('Archive: could not load programs for filter', err);
          this.programFilterOptions = [{ value: '', label: 'All Programs' }];
        }
      });
  }

  private loadDeletedByUserOptions(): void {
    this.userService
      .getUsers({
        PageIndex: 1,
        PageSize: 500,
        SortDirection: 'asc',
        SortKey: '',
        searchTerm: ''
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: PaginatedResponse<User>) => {
          if (!response.success || !response.data?.length) {
            this.deletedByUserOptions = [];
            return;
          }
          this.deletedByUserOptions = response.data.map(u => ({
            value: String(u.userId ?? u.id),
            label: u.name || u.fullName || u.email || `User ${u.id}`
          }));
        },
        error: () => {
          this.deletedByUserOptions = [];
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setTab(tab: ArchiveTab): void {
    if (this.activeTab === tab) {
      return;
    }
    this.activeTab = tab;
    this.loadActiveTab();
  }

  searchPlaceholder(): string {
    switch (this.activeTab) {
      case ArchiveTab.Programs:
        return 'Search archived programs…';
      case ArchiveTab.Students:
        return 'Search archived students…';
      case ArchiveTab.SchoolYears:
        return 'Search archived school years…';
      case ArchiveTab.Curricula:
        return 'Search archived curricula…';
      default:
        return 'Search…';
    }
  }

  toggleAdvancedFilters(): void {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }

  showArchiveHelp(): void {
    this.notificationService.info(
      'About Archive',
      'Deleted items appear here when the archive API is enabled. Restore brings a record back; permanent delete removes it forever.'
    );
  }

  onRestoreProgram(row: ArchivedProgramRow): void {
    this.pendingProgram = row;
    this.pendingAction = 'restore';
    this.restoreConfirmationConfig = {
      ...this.restoreConfirmationConfig,
      message: `Restore program "${row.programCode}" — ${row.programTitle}?`
    };
    this.showRestoreConfirmation = true;
  }

  onPermanentProgram(row: ArchivedProgramRow): void {
    this.pendingProgram = row;
    this.pendingAction = 'permanent';
    this.permanentConfirmationConfig = {
      ...this.permanentConfirmationConfig,
      message: `Permanently delete "${row.programCode}"? This cannot be undone.`
    };
    this.showPermanentConfirmation = true;
  }

  onRestoreStudent(row: ArchivedStudentRow): void {
    this.pendingStudent = row;
    this.pendingAction = 'restore';
    this.restoreConfirmationConfig = {
      ...this.restoreConfirmationConfig,
      message: `Restore student ${row.studentNumber} — ${row.displayName}?`
    };
    this.showRestoreConfirmation = true;
  }

  onPermanentStudent(row: ArchivedStudentRow): void {
    this.pendingStudent = row;
    this.pendingAction = 'permanent';
    this.permanentConfirmationConfig = {
      ...this.permanentConfirmationConfig,
      message: `Permanently delete student ${row.studentNumber}? This cannot be undone.`
    };
    this.showPermanentConfirmation = true;
  }

  onRestoreSchoolYear(row: ArchivedSchoolYearRow): void {
    this.pendingSchoolYear = row;
    this.pendingAction = 'restore';
    this.restoreConfirmationConfig = {
      ...this.restoreConfirmationConfig,
      message: `Restore "${row.label}"?`
    };
    this.showRestoreConfirmation = true;
  }

  onPermanentSchoolYear(row: ArchivedSchoolYearRow): void {
    this.pendingSchoolYear = row;
    this.pendingAction = 'permanent';
    this.permanentConfirmationConfig = {
      ...this.permanentConfirmationConfig,
      message: `Permanently delete "${row.label}"? This cannot be undone.`
    };
    this.showPermanentConfirmation = true;
  }

  onRestoreCurriculum(row: ArchivedCurriculumRow): void {
    this.pendingCurriculum = row;
    this.pendingAction = 'restore';
    this.restoreConfirmationConfig = {
      ...this.restoreConfirmationConfig,
      message: `Restore curriculum "${row.curriculumCode}" — ${row.curriculumTitle}?`
    };
    this.showRestoreConfirmation = true;
  }

  onPermanentCurriculum(row: ArchivedCurriculumRow): void {
    this.pendingCurriculum = row;
    this.pendingAction = 'permanent';
    this.permanentConfirmationConfig = {
      ...this.permanentConfirmationConfig,
      message: `Permanently delete "${row.curriculumCode}"? This cannot be undone.`
    };
    this.showPermanentConfirmation = true;
  }

  onConfirmRestore(): void {
    this.showRestoreConfirmation = false;
    const action = this.pendingAction;
    if (action !== 'restore') {
      this.clearPending();
      return;
    }

    if (this.pendingProgram) {
      this.runAction(
        this.archiveService.restoreProgram(this.pendingProgram.id),
        'Program restored'
      );
    } else if (this.pendingStudent) {
      this.runAction(
        this.archiveService.restoreStudent(this.pendingStudent.id),
        'Student restored'
      );
    } else if (this.pendingSchoolYear) {
      this.runAction(
        this.archiveService.restoreSchoolYear(this.pendingSchoolYear.id),
        'School year restored'
      );
    } else if (this.pendingCurriculum) {
      this.runAction(
        this.archiveService.restoreCurriculum(this.pendingCurriculum.id),
        'Curriculum restored'
      );
    }
    this.clearPending();
  }

  onConfirmPermanent(): void {
    this.showPermanentConfirmation = false;
    const action = this.pendingAction;
    if (action !== 'permanent') {
      this.clearPending();
      return;
    }

    if (this.pendingProgram) {
      this.runAction(
        this.archiveService.permanentDeleteProgram(this.pendingProgram.id),
        'Program permanently deleted'
      );
    } else if (this.pendingStudent) {
      this.runAction(
        this.archiveService.permanentDeleteStudent(this.pendingStudent.id),
        'Student permanently deleted'
      );
    } else if (this.pendingSchoolYear) {
      this.runAction(
        this.archiveService.permanentDeleteSchoolYear(this.pendingSchoolYear.id),
        'School year permanently deleted'
      );
    } else if (this.pendingCurriculum) {
      this.runAction(
        this.archiveService.permanentDeleteCurriculum(this.pendingCurriculum.id),
        'Curriculum permanently deleted'
      );
    }
    this.clearPending();
  }

  onCancelRestore(): void {
    this.showRestoreConfirmation = false;
    this.clearPending();
  }

  onCancelPermanent(): void {
    this.showPermanentConfirmation = false;
    this.clearPending();
  }

  private clearPending(): void {
    this.pendingProgram = null;
    this.pendingStudent = null;
    this.pendingSchoolYear = null;
    this.pendingCurriculum = null;
    this.pendingAction = null;
  }

  private runAction(obs: Observable<void>, successMessage: string): void {
    obs.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.lookupService.clearCache();
        this.notificationService.success('Archive', successMessage);
        this.loadActiveTab();
      },
      error: (err: { message?: string }) => {
        const msg =
          err?.message ||
          'The archive API may not be available yet. Implement server endpoints under /Archive.';
        this.notificationService.error('Archive', msg);
      }
    });
  }

  private loadActiveTab(): void {
    const filters = this.buildFilters();
    this.isLoading = true;

    switch (this.activeTab) {
      case ArchiveTab.Programs:
        this.archiveService.listArchivedPrograms(filters).subscribe(rows => {
          this.programs = rows;
          this.isLoading = false;
        });
        break;
      case ArchiveTab.Students:
        this.archiveService.listArchivedStudents(filters).subscribe(rows => {
          this.students = rows;
          this.isLoading = false;
        });
        break;
      case ArchiveTab.SchoolYears:
        this.archiveService.listArchivedSchoolYears(filters).subscribe(rows => {
          this.schoolYears = rows;
          this.isLoading = false;
        });
        break;
      case ArchiveTab.Curricula:
        this.archiveService.listArchivedCurricula(filters).subscribe(rows => {
          this.curricula = rows;
          this.isLoading = false;
        });
        break;
    }
  }

  private buildFilters(): PaginationParams {
    const v = this.filterForm.getRawValue() as {
      search: string;
      yearsOfCompletion: string;
      studentProgram: string;
      yearLevel: string;
      semester: string;
      dateFrom: string;
      dateTo: string;
      deletedBy: string;
    };
    const params: PaginationParams = {
      searchTerm: v.search?.trim() || undefined,
      DateFrom: v.dateFrom?.trim() || undefined,
      DateTo: v.dateTo?.trim() || undefined,
      DeletedBy: v.deletedBy?.trim() || undefined
    };
    if (this.activeTab === ArchiveTab.Programs && v.yearsOfCompletion?.trim()) {
      params['YearsOfCompletion'] = v.yearsOfCompletion.trim();
    }
    if (this.activeTab === ArchiveTab.Students) {
      if (v.studentProgram?.trim()) {
        params['programCode'] = v.studentProgram.trim();
      }
      if (v.yearLevel?.trim()) {
        params['yearLevel'] = v.yearLevel.trim();
      }
    }
    if (this.activeTab === ArchiveTab.SchoolYears && v.semester?.trim()) {
      params['Semester'] = v.semester.trim();
    }
    return params;
  }
}
