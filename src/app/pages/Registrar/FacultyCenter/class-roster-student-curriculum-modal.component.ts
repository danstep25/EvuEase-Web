import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { ClassRosterStudentDto } from './faculty-center.service';
import { StudentsService } from '../students/students.service';
import { CurriculumManagementService } from '../curriculum-management/curriculum-management.service';
import { LookupService } from '../../../shared/services/lookup.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { Program } from '../../../core/models/program.model';
import { Curricula } from '../../../core/models/curricula.model';
import { CurriculumStatus } from '../curriculum-management/enums/curriculum-status.enum';
import {
  formatCurriculumOptionLabel,
  filterActiveCurricula,
  isFirstYearLevel,
  resolveActiveCurriculumForProgram
} from './class-roster-student-curriculum.util';
import { FormDiscardService } from '../../../shared/services/form-discard.service';

@Component({
  selector: 'app-class-roster-student-curriculum-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './class-roster-student-curriculum-modal.component.html',
  styleUrl: './class-roster-student-curriculum-modal.component.scss'
})
export class ClassRosterStudentCurriculumModalComponent implements OnChanges {
  private readonly studentsService = inject(StudentsService);
  private readonly curriculumService = inject(CurriculumManagementService);
  private readonly lookupService = inject(LookupService);
  private readonly notificationService = inject(NotificationService);
  private readonly formDiscard = inject(FormDiscardService);

  private initialCurriculumCode = '';

  @Input({ required: true }) student!: ClassRosterStudentDto;
  @Input() isOpen = false;

  @Output() readonly closed = new EventEmitter<void>();
  @Output() readonly saved = new EventEmitter<string>();

  selectedCurriculumCode = '';
  curriculumOptions: Curricula[] = [];
  programs: Program[] = [];
  isLoading = false;
  isSubmitting = false;
  errorMessage: string | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['isOpen']?.currentValue || changes['student']) && this.isOpen && this.student) {
      this.resetState();
      this.loadOptions();
    }
  }

  get isFirstYear(): boolean {
    return isFirstYearLevel(this.student?.yearLevel);
  }

  get currentCurriculumLabel(): string {
    return this.student?.curriculumCode?.trim() || 'Not assigned';
  }

  get selectedOption(): Curricula | null {
    return (
      this.curriculumOptions.find(
        (row) => row.curriculumCode?.trim() === this.selectedCurriculumCode.trim()
      ) ?? null
    );
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }

  close(): void {
    if (this.isSubmitting) {
      return;
    }
    if (!this.hasSelectionChanges()) {
      this.closed.emit();
      return;
    }
    void this.formDiscard.confirmDiscard().then((confirmed) => {
      if (confirmed) {
        this.closed.emit();
      }
    });
  }

  save(): void {
    const code = this.selectedCurriculumCode.trim();
    const studentRecordId = this.student?.studentRecordId;
    if (!code || !studentRecordId || this.isSubmitting) {
      this.errorMessage = 'Please select a curriculum.';
      return;
    }

    if (!this.hasSelectionChanges()) {
      this.errorMessage = 'No changes to save.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;

    this.studentsService
      .migrateStudentCurriculum(String(studentRecordId), {
        curriculumCode: code,
        reason: 'Assigned from Faculty Center class roster'
      })
      .subscribe({
        next: () => {
          this.isSubmitting = false;
          this.notificationService.success(
            'Curriculum Updated',
            `${this.student.displayName} is now under ${code}.`
          );
          this.saved.emit(code);
          this.close();
        },
        error: (error) => {
          this.isSubmitting = false;
          this.errorMessage =
            error.userMessage || error.message || 'Failed to update the student curriculum.';
        }
      });
  }

  private resetState(): void {
    this.selectedCurriculumCode = this.student?.curriculumCode?.trim() ?? '';
    this.curriculumOptions = [];
    this.programs = [];
    this.isLoading = false;
    this.isSubmitting = false;
    this.errorMessage = null;
  }

  private loadOptions(): void {
    const programCode = this.student.programCode?.trim() ?? '';
    if (!programCode) {
      this.errorMessage = 'Student program is missing.';
      return;
    }

    this.isLoading = true;
    this.lookupService
      .getProgramsForDropdown()
      .pipe(
        catchError(() => of([])),
        switchMap((programs) => {
          this.programs = programs;
          const programId = this.resolveProgramId(programCode, programs);
          return this.curriculumService
            .getCurricula({
              PageIndex: 1,
              PageSize: 500,
              SortDirection: 'desc',
              SortKey: '',
              status: CurriculumStatus.Active,
              ...(programId != null ? { programId } : {})
            })
            .pipe(catchError(() => of(null)));
        })
      )
      .subscribe((curricula) => {
        const rows = filterActiveCurricula(
          (curricula?.data ?? []).filter((row) => {
            const programId = this.resolveProgramId(programCode, this.programs);
            if (programId && row.programId) {
              return row.programId === programId;
            }
            return (
              row.programCode?.trim().toUpperCase() === programCode.toUpperCase() ||
              row.curriculumCode?.trim().toUpperCase().startsWith(`${programCode.toUpperCase()}-`)
            );
          })
        );
        this.curriculumOptions = [...rows].sort((a, b) =>
          (b.effectiveDate ?? '').localeCompare(a.effectiveDate ?? '')
        );
        this.isLoading = false;

        if (
          this.selectedCurriculumCode &&
          !this.curriculumOptions.some(
            (row) => row.curriculumCode?.trim() === this.selectedCurriculumCode.trim()
          )
        ) {
          this.selectedCurriculumCode = '';
        }

        if (!this.selectedCurriculumCode && this.isFirstYear) {
          const active = resolveActiveCurriculumForProgram(rows, programCode);
          if (active?.curriculumCode) {
            this.selectedCurriculumCode = active.curriculumCode.trim();
          }
        }

        if (this.curriculumOptions.length === 0) {
          this.errorMessage = `No active curricula found for program ${programCode}.`;
        }

        this.initialCurriculumCode = this.selectedCurriculumCode.trim();
      });
  }

  private hasSelectionChanges(): boolean {
    return this.selectedCurriculumCode.trim() !== this.initialCurriculumCode.trim();
  }

  optionLabel(row: Curricula): string {
    return formatCurriculumOptionLabel(row);
  }

  private resolveProgramId(programCode: string, programs: Program[]): number | undefined {
    const match = programs.find(
      (row) => row.programCode?.trim().toUpperCase() === programCode.trim().toUpperCase()
    );
    return match?.programId;
  }
}
