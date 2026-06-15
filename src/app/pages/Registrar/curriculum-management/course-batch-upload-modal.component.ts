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

import { FormGroup, FormsModule } from '@angular/forms';
import { FormDiscardService } from '../../../shared/services/form-discard.service';
import { attemptFormClose } from '../../../shared/utils/form-state.util';

import { finalize } from 'rxjs/operators';

import { Program } from '../../../core/models/program.model';

import { Curricula } from '../../../core/models/curricula.model';

import { LookupService } from '../../../shared/services/lookup.service';

import { NotificationService } from '../../../shared/services/notification.service';

import { CourseService } from './course.service';

import {

  CourseBatchImportPreviewResponse,

  CourseBatchImportPreviewRow,

  CourseBatchImportRequest,

  CourseBatchPdfDetectionResponse

} from './course-batch-upload.model';

import { prerequisiteCodes, clampUnitValue, applyRowUnitValidation } from './course-batch-upload.util';



type BatchUploadStep = 'setup' | 'preview' | 'complete';



@Component({

  selector: 'app-course-batch-upload-modal',

  standalone: true,

  imports: [CommonModule, FormsModule],

  templateUrl: './course-batch-upload-modal.component.html',

  styleUrl: './course-batch-upload-modal.component.scss'

})

export class CourseBatchUploadModalComponent implements OnChanges {

  private readonly lookupService = inject(LookupService);

  private readonly courseService = inject(CourseService);

  private readonly notificationService = inject(NotificationService);
  private readonly formDiscard = inject(FormDiscardService);

  private readonly wizardForm = new FormGroup({});



  @Input({ required: true }) isOpen = false;

  @Input({ required: true }) programs: Program[] = [];



  @Output() readonly closed = new EventEmitter<void>();

  @Output() readonly imported = new EventEmitter<number>();



  step: BatchUploadStep = 'setup';

  selectedProgramId: number | null = null;

  selectedCurriculumCode = '';

  curriculumVersions: Curricula[] = [];

  isLoadingCurricula = false;



  selectedFile: File | null = null;

  pdfDetection: CourseBatchPdfDetectionResponse | null = null;

  isDetectingPdf = false;

  detectionError: string | null = null;

  parseError: string | null = null;

  preview: CourseBatchImportPreviewResponse | null = null;

  previewFilter: 'all' | 'Valid' | 'Warning' | 'Error' = 'all';

  previewSearch = '';



  isPreviewLoading = false;

  isImporting = false;

  importSummary: { imported: number; skipped: number } | null = null;



  ngOnChanges(changes: SimpleChanges): void {

    if (changes['isOpen']?.currentValue === true) {

      this.resetWizard();

    }

  }



  get selectedProgram(): Program | undefined {

    return this.programs.find((p) => p.programId === this.selectedProgramId);

  }



  get canContinueFromSetup(): boolean {

    return !!this.selectedProgramId && !!this.selectedCurriculumCode.trim() && !!this.selectedFile;

  }



  get selectedImportCount(): number {

    return (this.preview?.rows ?? []).filter((row) => row.selected && row.status !== 'Error').length;

  }



  get filteredPreviewRows(): CourseBatchImportPreviewRow[] {

    const rows = this.preview?.rows ?? [];

    const q = this.previewSearch.trim().toLowerCase();

    return rows.filter((row) => {

      if (this.previewFilter !== 'all' && row.status !== this.previewFilter) {

        return false;

      }

      if (!q) {

        return true;

      }

      return [

        row.courseCode,

        row.courseTitle,

        row.courseYearLevel,

        row.courseSemester,

        row.prerequisites ?? '',

        row.messages.join(' ')

      ]

        .join(' ')

        .toLowerCase()

        .includes(q);

    });

  }



  prerequisiteChips(raw: string | null | undefined): string[] {

    return prerequisiteCodes(raw);

  }



  onRowLecUnitsChange(row: CourseBatchImportPreviewRow, value: number | string): void {

    row.courseLecUnits = clampUnitValue(value);

    row.courseTotalUnits = row.courseLecUnits + clampUnitValue(row.courseLabUnits);

    this.afterRowUnitsChanged(row);

  }



  onRowLabUnitsChange(row: CourseBatchImportPreviewRow, value: number | string): void {

    row.courseLabUnits = clampUnitValue(value);

    row.courseTotalUnits = row.courseLecUnits + row.courseLabUnits;

    this.afterRowUnitsChanged(row);

  }



  onRowTotalUnitsChange(row: CourseBatchImportPreviewRow, value: number | string): void {

    row.courseTotalUnits = clampUnitValue(value);

    this.afterRowUnitsChanged(row);

  }



  onProgramChange(): void {
    this.wizardForm.markAsDirty();

    this.selectedCurriculumCode = '';

    this.curriculumVersions = [];

    this.preview = null;

    this.parseError = null;

    this.loadCurriculumVersions(undefined);

  }



  onCurriculumChange(): void {
    this.wizardForm.markAsDirty();

    this.preview = null;

    this.parseError = null;

  }



  onFileSelected(event: Event): void {

    const input = event.target as HTMLInputElement;

    const file = input.files?.[0] ?? null;

    input.value = '';

    if (!file) {

      return;

    }

    this.processFile(file);

  }



  onFileDrop(event: DragEvent): void {

    event.preventDefault();

    const file = event.dataTransfer?.files?.[0] ?? null;

    if (file) {

      this.processFile(file);

    }

  }



  onDragOver(event: DragEvent): void {

    event.preventDefault();

  }



  continueToReview(): void {

    if (!this.canContinueFromSetup || this.isPreviewLoading) {

      return;

    }

    this.parseSelectedPdf();

  }



  backToSetup(): void {

    this.step = 'setup';

  }



  toggleRowSelection(row: CourseBatchImportPreviewRow, checked: boolean): void {
    this.wizardForm.markAsDirty();

    if (row.status === 'Error') {

      row.selected = false;

      return;

    }

    row.selected = checked;

  }



  toggleAllFilteredRows(checked: boolean): void {
    this.wizardForm.markAsDirty();

    for (const row of this.filteredPreviewRows) {

      if (row.status !== 'Error') {

        row.selected = checked;

      }

    }

  }



  allFilteredRowsSelected(): boolean {

    const selectable = this.filteredPreviewRows.filter((row) => row.status !== 'Error');

    return selectable.length > 0 && selectable.every((row) => row.selected);

  }



  confirmImport(): void {

    if (!this.preview || !this.selectedProgramId || !this.selectedCurriculumCode || this.isImporting) {

      return;

    }



    const payload: CourseBatchImportRequest = {

      programId: this.selectedProgramId,

      curriculumCode: this.selectedCurriculumCode,

      rows: this.preview.rows.map((row) => ({

        rowNumber: row.rowNumber,

        courseCode: row.courseCode,

        courseTitle: row.courseTitle,

        courseLecUnits: row.courseLecUnits,

        courseLabUnits: row.courseLabUnits,

        courseTotalUnits: row.courseTotalUnits,

        courseYearLevel: row.courseYearLevel,

        courseSemester: row.courseSemester,

        prerequisites: row.prerequisites,

        courseComponent: row.courseComponent,

        selected: row.selected

      }))

    };



    if (payload.rows.filter((row) => row.selected).length === 0) {

      this.notificationService.warning('Nothing selected', 'Select at least one valid course row to import.');

      return;

    }



    this.isImporting = true;

    this.courseService

      .importCourseBatch(payload)

      .pipe(finalize(() => (this.isImporting = false)))

      .subscribe({

        next: (result) => {

          this.importSummary = {

            imported: result.importedCount ?? 0,

            skipped: result.skippedCount ?? 0

          };

          this.step = 'complete';
          this.wizardForm.markAsPristine();

          this.imported.emit(result.importedCount ?? 0);

        },

        error: (err: { error?: { message?: string }; message?: string }) => {

          const msg =

            err?.error?.message ||

            err?.message ||

            'Could not import courses. Fix validation errors and try again.';

          this.notificationService.error('Import failed', msg);

        }

      });

  }



  close(): void {
    void attemptFormClose({
      form: this.wizardForm,
      discardService: this.formDiscard,
      close: () => this.closed.emit()
    });
  }



  statusClass(status: string): string {

    switch (status) {

      case 'Valid':

        return 'bg-emerald-50 text-emerald-800 border-emerald-200';

      case 'Warning':

        return 'bg-amber-50 text-amber-900 border-amber-200';

      default:

        return 'bg-red-50 text-red-800 border-red-200';

    }

  }



  private resetWizard(): void {

    this.step = 'setup';

    this.selectedProgramId = null;

    this.selectedCurriculumCode = '';

    this.curriculumVersions = [];

    this.selectedFile = null;

    this.pdfDetection = null;

    this.isDetectingPdf = false;

    this.detectionError = null;

    this.parseError = null;

    this.preview = null;

    this.previewFilter = 'all';

    this.previewSearch = '';

    this.isPreviewLoading = false;

    this.isImporting = false;

    this.importSummary = null;
    this.wizardForm.markAsPristine();

  }



  private loadCurriculumVersions(preselectCode?: string): void {

    const program = this.selectedProgram;

    if (!program?.programCode) {

      return;

    }



    this.isLoadingCurricula = true;

    this.lookupService.getCurriculumVersionsForDropdown(program.programCode).subscribe({

      next: (rows) => {

        this.curriculumVersions = rows;

        this.isLoadingCurricula = false;

        if (preselectCode) {

          const match = rows.find(

            (c) => c.curriculumCode?.toUpperCase() === preselectCode.toUpperCase()

          );

          if (match) {

            this.selectedCurriculumCode = match.curriculumCode;

          }

        }

      },

      error: () => {

        this.curriculumVersions = [];

        this.isLoadingCurricula = false;

        this.notificationService.error('Load failed', 'Could not load curriculum versions for this program.');

      }

    });

  }



  private processFile(file: File): void {

    const name = file.name.toLowerCase();

    if (!name.endsWith('.pdf')) {

      this.notificationService.warning('Invalid file', 'Please upload the official curriculum structure PDF.');

      return;

    }



    this.selectedFile = file;
    this.wizardForm.markAsDirty();

    this.pdfDetection = null;

    this.detectionError = null;

    this.parseError = null;

    this.preview = null;

    this.detectPdfReference(file);

  }



  private detectPdfReference(file: File): void {

    this.isDetectingPdf = true;

    this.courseService

      .detectCourseBatchPdf(file)

      .pipe(finalize(() => (this.isDetectingPdf = false)))

      .subscribe({

        next: (detection) => {

          if (detection.referenceNumber) {

            this.pdfDetection = detection;

            this.applyPdfDetection(detection);

          } else {

            this.pdfDetection = null;

          }

        },

        error: (err: { userMessage?: string; error?: { message?: string }; message?: string }) => {

          const msg =

            err?.userMessage ||

            err?.error?.message ||

            err?.message ||

            'Could not read the curriculum PDF.';

          this.detectionError = msg;

        }

      });

  }



  private applyPdfDetection(detection: CourseBatchPdfDetectionResponse): void {

    if (detection.programId) {

      this.selectedProgramId = detection.programId;

      this.loadCurriculumVersions(detection.curriculumFound ? detection.curriculumCode ?? undefined : undefined);

      return;

    }



    if (detection.programCode) {

      const program = this.programs.find(

        (p) => p.programCode?.toUpperCase() === detection.programCode?.toUpperCase()

      );

      if (program) {

        this.selectedProgramId = program.programId;

        this.loadCurriculumVersions(detection.curriculumFound ? detection.curriculumCode ?? undefined : undefined);

      }

    }

  }



  private parseSelectedPdf(): void {

    if (!this.selectedFile || !this.selectedProgramId || !this.selectedCurriculumCode.trim()) {

      return;

    }



    this.parseError = null;

    this.preview = null;

    this.isPreviewLoading = true;



    this.courseService

      .previewCourseBatchPdf(this.selectedFile, this.selectedProgramId, this.selectedCurriculumCode)

      .pipe(finalize(() => (this.isPreviewLoading = false)))

      .subscribe({

        next: (response) => {

          this.preview = this.normalizePreviewResponse(response);

          this.step = 'preview';
          this.wizardForm.markAsDirty();

        },

        error: (err: { userMessage?: string; error?: { message?: string }; message?: string }) => {

          this.parseError =

            err?.userMessage ||

            err?.error?.message ||

            err?.message ||

            'Could not parse the curriculum PDF.';

        }

      });

  }



  private normalizePreviewResponse(raw: CourseBatchImportPreviewResponse): CourseBatchImportPreviewResponse {

    return {

      curriculumCode: raw.curriculumCode,

      programCode: raw.programCode,

      totalRows: raw.totalRows,

      validRows: raw.validRows,

      warningRows: raw.warningRows,

      errorRows: raw.errorRows,

      skippedPdfLines: raw.skippedPdfLines,

      parseWarnings: raw.parseWarnings ?? [],

      detectedReferenceNumber: raw.detectedReferenceNumber,

      rows: (raw.rows ?? []).map((row) => ({

        rowNumber: row.rowNumber,

        courseCode: row.courseCode,

        courseTitle: row.courseTitle,

        courseLecUnits: row.courseLecUnits,

        courseLabUnits: row.courseLabUnits,

        courseTotalUnits: row.courseTotalUnits,

        courseYearLevel: row.courseYearLevel,

        courseSemester: row.courseSemester,

        prerequisites: row.prerequisites,

        courseComponent: row.courseComponent,

        selected: row.status !== 'Error',

        status: row.status,

        messages: row.messages ?? []

      }))

    };

  }



  private afterRowUnitsChanged(row: CourseBatchImportPreviewRow): void {
    this.wizardForm.markAsDirty();

    applyRowUnitValidation(row);

    row.selected = row.status !== 'Error';

    this.refreshPreviewStats();

  }



  private refreshPreviewStats(): void {

    if (!this.preview) {

      return;

    }

    const rows = this.preview.rows;

    this.preview.validRows = rows.filter((row) => row.status === 'Valid').length;

    this.preview.warningRows = rows.filter((row) => row.status === 'Warning').length;

    this.preview.errorRows = rows.filter((row) => row.status === 'Error').length;

  }

}


