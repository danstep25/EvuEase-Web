import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormsModule } from '@angular/forms';
import { FormDiscardService } from '../../../shared/services/form-discard.service';
import { attemptFormClose } from '../../../shared/utils/form-state.util';
import { take } from 'rxjs';
import { ClassRosterStudentDto, FacultyCenterService, GradeScaleRowDto } from './faculty-center.service';
import {
  deriveRemarksFromOfficialGrade,
  formatOfficialGradeDisplay,
  resolveOfficialGradeFromMark
} from './grade-roster-grade-remarks.util';

export type UpdateStudentGradeSavePayload =
  | { rawMark: number; academicTermKey: string }
  | { officialGrade: string; remarks?: string | null };

@Component({
  selector: 'app-update-student-grade-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './update-student-grade-modal.component.html',
  styleUrl: './update-student-grade-modal.component.scss'
})
export class UpdateStudentGradeModalComponent implements OnChanges, OnDestroy {
  private readonly facultyCenter = inject(FacultyCenterService);
  private readonly formDiscard = inject(FormDiscardService);

  private readonly modalForm = new FormGroup({});

  @Input({ required: true }) open = false;
  @Input() student: ClassRosterStudentDto | null = null;
  
  @Input() academicTermKey = '';
  @Input() saving = false;

  @Output() closed = new EventEmitter<void>();
  @Output() save = new EventEmitter<UpdateStudentGradeSavePayload>();

  
  gradeMode: 'numeric' | 'inc' = 'numeric';
  rawMarkInput = '';
  incRemarksInput = '';
  gradeScaleRows: GradeScaleRowDto[] = [];
  scaleLoadError = '';
  isLoadingScale = false;

  private loadSeq = 0;

  ngOnDestroy(): void {
    this.loadSeq++;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open'] && !this.open) {
      this.rawMarkInput = '';
      this.incRemarksInput = '';
      this.gradeMode = 'numeric';
      this.scaleLoadError = '';
      this.loadSeq++;
    }
    if (this.open && this.student && (changes['open'] || changes['student'])) {
      this.syncFormFromStudent();
    }
    if (this.open && (changes['open'] || changes['academicTermKey'])) {
      this.loadGradeScale();
    }
  }

  setGradeMode(mode: 'numeric' | 'inc'): void {
    if (this.gradeMode === mode) {
      return;
    }
    this.gradeMode = mode;
    if (mode === 'numeric') {
      this.loadGradeScale();
    }
  }

  private syncFormFromStudent(): void {
    if (!this.student) {
      return;
    }
    this.rawMarkInput = '';
    if (this.isIncOfficialGrade(this.student.officialGrade)) {
      this.gradeMode = 'inc';
      this.incRemarksInput = this.extractIncNote(this.student);
    } else {
      this.gradeMode = 'numeric';
      this.incRemarksInput = '';
    }
  }

  private isIncOfficialGrade(g: string | null | undefined): boolean {
    if (!g?.trim()) {
      return false;
    }
    const u = g.trim().toUpperCase();
    return u === 'INC' || u === 'INCOMPLETE' || u === 'I';
  }

  
  private extractIncNote(s: ClassRosterStudentDto): string {
    const r = (s.remarks ?? '').trim();
    if (!r || r.toLowerCase() === 'incomplete') {
      return '';
    }
    return r;
  }

  private loadGradeScale(): void {
    if (!this.open || this.gradeMode !== 'numeric') {
      return;
    }
    const key = this.academicTermKey?.trim();
    if (!key) {
      this.isLoadingScale = false;
      this.gradeScaleRows = [];
      this.scaleLoadError =
        'Choose an academic term on Grade Roster before editing a grade (needed to load the scale).';
      return;
    }
    const seq = ++this.loadSeq;
    this.isLoadingScale = true;
    this.scaleLoadError = '';
    this.facultyCenter.getGradingSchemeBasis(key).pipe(take(1)).subscribe({
      next: dto => {
        if (seq !== this.loadSeq) {
          return;
        }
        this.isLoadingScale = false;
        this.gradeScaleRows = dto?.gradeScaleRows ?? [];
        if (this.gradeScaleRows.length === 0) {
          this.scaleLoadError =
            'No grade scale for this term. Configure it under Class Assignment first.';
        }
      },
      error: () => {
        if (seq !== this.loadSeq) {
          return;
        }
        this.isLoadingScale = false;
        this.gradeScaleRows = [];
        this.scaleLoadError = 'Could not load the grade scale for this term.';
      }
    });
  }

  get headline(): string {
    if (!this.student) {
      return '';
    }
    return `${this.student.studentId} — ${this.student.displayName}`;
  }

  get programYearLine(): string {
    if (!this.student) {
      return '';
    }
    return `Program: ${this.student.programCode} • Year Level: ${this.student.yearLevel}`;
  }

  parseRawMark(input: string): number | null {
    const t = input.trim().replace(',', '.');
    if (t === '') {
      return null;
    }
    const n = parseFloat(t);
    return Number.isFinite(n) ? n : null;
  }

  get parsedRawMark(): number | null {
    return this.parseRawMark(this.rawMarkInput);
  }

  get resolvedGradeValue(): number | null {
    const m = this.parsedRawMark;
    if (m == null || this.gradeScaleRows.length === 0) {
      return null;
    }
    return resolveOfficialGradeFromMark(this.gradeScaleRows, m);
  }

  get computedOfficialGrade(): string | null {
    const g = this.resolvedGradeValue;
    if (g == null) {
      return null;
    }
    return formatOfficialGradeDisplay(g);
  }

  get previewRemarksNumeric(): string | null {
    return deriveRemarksFromOfficialGrade(this.computedOfficialGrade);
  }

  get belowScaleMessage(): string | null {
    const m = this.parsedRawMark;
    if (m == null || this.gradeScaleRows.length === 0 || this.isLoadingScale || this.scaleLoadError) {
      return null;
    }
    if (this.resolvedGradeValue == null) {
      return 'This score is below every threshold in the grade scale.';
    }
    return null;
  }

  get incNotePreview(): string | null {
    const t = this.incRemarksInput.trim();
    return t.length > 0 ? t : null;
  }

  remarkBadgeClass(remark: string | null): string {
    const r = (remark || '').toLowerCase();
    if (r === 'passed') {
      return 'usg-badge usg-badge--passed';
    }
    if (r === 'failed') {
      return 'usg-badge usg-badge--failed';
    }
    if (r === 'incomplete') {
      return 'usg-badge usg-badge--incomplete';
    }
    return 'usg-badge usg-badge--neutral';
  }

  displayGrade(g: string | null | undefined): string {
    if (g == null || String(g).trim() === '') {
      return '—';
    }
    return String(g);
  }

  normalizeOfficial(s: string | null | undefined): string {
    return (s ?? '').trim();
  }

  get canSubmitNumeric(): boolean {
    if (!this.student || this.saving || this.isLoadingScale) {
      return false;
    }
    if (this.scaleLoadError || this.gradeScaleRows.length === 0) {
      return false;
    }
    const m = this.parsedRawMark;
    if (m == null || this.computedOfficialGrade == null) {
      return false;
    }
    return !!this.academicTermKey?.trim();
  }

  get hasChangesNumeric(): boolean {
    if (!this.student || this.computedOfficialGrade == null) {
      return false;
    }
    const before = this.normalizeOfficial(this.student.officialGrade);
    const after = this.normalizeOfficial(this.computedOfficialGrade);
    return before !== after;
  }

  get hasChangesInc(): boolean {
    if (!this.student) {
      return false;
    }
    const beforeG = this.normalizeOfficial(this.student.officialGrade);
    const noteBefore = this.extractIncNote(this.student);
    const noteAfter = this.incRemarksInput.trim();
    if (!this.isIncOfficialGrade(beforeG)) {
      return true;
    }
    return noteBefore !== noteAfter;
  }

  get canSubmit(): boolean {
    if (!this.student || this.saving) {
      return false;
    }
    return this.gradeMode === 'inc' ? true : this.canSubmitNumeric;
  }

  get hasChanges(): boolean {
    return this.gradeMode === 'inc' ? this.hasChangesInc : this.hasChangesNumeric;
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('usg-backdrop')) {
      this.onCancel();
    }
  }

  onCancel(): void {
    if (this.saving) {
      return;
    }
    if (this.hasChanges) {
      this.modalForm.markAsDirty();
    } else {
      this.modalForm.markAsPristine();
    }
    void attemptFormClose({
      form: this.modalForm,
      discardService: this.formDiscard,
      close: () => this.closed.emit()
    });
  }

  onSubmit(): void {
    if (!this.canSubmit || !this.hasChanges) {
      return;
    }
    if (this.gradeMode === 'inc') {
      const remarks = this.incRemarksInput.trim();
      this.save.emit({ officialGrade: 'INC', remarks: remarks.length > 0 ? remarks : null });
      return;
    }
    const m = this.parsedRawMark;
    const key = this.academicTermKey?.trim();
    if (m == null || !key) {
      return;
    }
    this.save.emit({ rawMark: m, academicTermKey: key });
  }
}
