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
import { CurriculumManagementService } from './curriculum-management.service';

import {

  CourseBatchImportPreviewResponse,

  CourseBatchImportPreviewRow,

  CourseBatchImportRequest,

  CourseBatchPdfDetectionResponse

} from './course-batch-upload.model';

import { prerequisiteCodes, clampUnitValue, applyRowValidation, applyRowPrerequisiteValidation, buildKnownPrerequisiteCodes, countRowsWithLongTitles, countRowsWithExistingCourseCodes, hasExistingCourseCodeMessage, isRowEligibleForImport, normalizePrerequisiteString } from './course-batch-upload.util';
import { COURSE_TITLE_MAX_LENGTH } from '../../../shared/constants/course-validation.constant';



type BatchUploadStep = 'setup' | 'preview' | 'complete';



@Component({

  selector: 'app-course-batch-upload-modal',

  standalone: true,

  imports: [CommonModule, FormsModule],

  templateUrl: './course-batch-upload-modal.component.html',

  styleUrl: './course-batch-upload-modal.component.scss'

})

export class CourseBatchUploadModalComponent implements OnChanges {

  readonly courseTitleMaxLength = COURSE_TITLE_MAX_LENGTH;

  private readonly lookupService = inject(LookupService);

  private readonly courseService = inject(CourseService);
  private readonly curriculaService = inject(CurriculumManagementService);

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
  supportingDocumentFile: File | null = null;
  saveCurriculumPdfAsReference = true;

  pdfDetection: CourseBatchPdfDetectionResponse | null = null;

  isDetectingPdf = false;

  detectionError: string | null = null;

  parseError: string | null = null;

  preview: CourseBatchImportPreviewResponse | null = null;

  private knownPrerequisiteCodes = new Set<string>();

  previewFilter: 'all' | 'Valid' | 'Warning' | 'Error' = 'all';

  previewSearch = '';



  isPreviewLoading = false;

  isImporting = false;
  isUploadingDocument = false;
  referenceDocumentSaved = false;

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

  get willAttachReferenceDocument(): boolean {
    return !!this.resolveReferenceDocumentFile();
  }

  get referenceDocumentLabel(): string | null {
    const file = this.resolveReferenceDocumentFile();
    return file?.name ?? null;
  }

  onSupportingDocumentSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    input.value = '';

    if (!file) {
      return;
    }

    if (!this.isAllowedSupportingDocument(file)) {
      this.notificationService.warning(
        'Invalid file',
        'Supporting documents must be PDF, PNG, JPG, JPEG, WEBP, DOC, or DOCX.'
      );
      return;
    }

    this.supportingDocumentFile = file;
    this.wizardForm.markAsDirty();
  }

  clearSupportingDocument(): void {
    this.supportingDocumentFile = null;
    this.wizardForm.markAsDirty();
  }

  onSaveCurriculumPdfAsReferenceChange(checked: boolean): void {
    this.saveCurriculumPdfAsReference = checked;
    this.wizardForm.markAsDirty();
  }



  get selectedImportCount(): number {

    return (this.preview?.rows ?? []).filter((row) => isRowEligibleForImport(row)).length;

  }

  get duplicateCourseSelectionCount(): number {

    return countRowsWithExistingCourseCodes(this.preview?.rows ?? []);

  }

  get hasSelectedDuplicateCourseCodes(): boolean {

    return this.duplicateCourseSelectionCount > 0;

  }



  get titleLengthIssueCount(): number {

    return countRowsWithLongTitles(this.preview?.rows ?? []);

  }



  get hasSelectedTitleLengthIssues(): boolean {

    return (this.preview?.rows ?? []).some(

      (row) => row.selected && row.courseTitle.trim().length > COURSE_TITLE_MAX_LENGTH

    );

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



  onRowCourseTitleChange(row: CourseBatchImportPreviewRow, value: string): void {

    row.courseTitle = value ?? '';

    this.afterRowChanged(row);

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



  onRowPrerequisitesChange(row: CourseBatchImportPreviewRow, value: string): void {

    row.prerequisites = value ?? '';

    this.afterRowChanged(row);

  }



  onRowPrerequisitesBlur(row: CourseBatchImportPreviewRow): void {

    row.prerequisites = normalizePrerequisiteString(row.prerequisites);

    this.afterRowChanged(row);

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

    if (
      row.status === 'Error' ||
      row.courseTitle.trim().length > COURSE_TITLE_MAX_LENGTH ||
      hasExistingCourseCodeMessage(row.messages)
    ) {

      row.selected = false;

      return;

    }

    row.selected = checked;

  }



  toggleAllFilteredRows(checked: boolean): void {
    this.wizardForm.markAsDirty();

    for (const row of this.filteredPreviewRows) {

      if (
        row.status !== 'Error' &&
        row.courseTitle.trim().length <= COURSE_TITLE_MAX_LENGTH &&
        !hasExistingCourseCodeMessage(row.messages)
      ) {

        row.selected = checked;

      }

    }

  }



  allFilteredRowsSelected(): boolean {

    const selectable = this.filteredPreviewRows.filter(

      (row) =>
        row.status !== 'Error' &&
        row.courseTitle.trim().length <= COURSE_TITLE_MAX_LENGTH &&
        !hasExistingCourseCodeMessage(row.messages)

    );

    return selectable.length > 0 && selectable.every((row) => row.selected);

  }



  confirmImport(): void {

    if (!this.preview || !this.selectedProgramId || !this.selectedCurriculumCode || this.isImporting) {

      return;

    }



    if (this.hasSelectedTitleLengthIssues) {

      this.notificationService.warning(

        'Course titles too long',

        `Shorten selected course titles to ${COURSE_TITLE_MAX_LENGTH} characters or fewer before importing.`

      );

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

        prerequisites: normalizePrerequisiteString(row.prerequisites),

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

      .subscribe({

        next: (result) => {

          this.importSummary = {

            imported: result.importedCount ?? 0,

            skipped: result.skippedCount ?? 0

          };

          this.uploadReferenceDocumentIfNeeded();

        },

        error: (err: { userMessage?: string; error?: { message?: string; error?: { message?: string; details?: string } }; message?: string }) => {

          this.isImporting = false;

          const msg =

            err?.userMessage ||

            err?.error?.error?.message ||

            (typeof err?.error?.error?.details === 'string' ? err.error.error.details : null) ||

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
    this.supportingDocumentFile = null;
    this.saveCurriculumPdfAsReference = true;

    this.pdfDetection = null;

    this.isDetectingPdf = false;

    this.detectionError = null;

    this.parseError = null;

    this.preview = null;

    this.previewFilter = 'all';

    this.previewSearch = '';

    this.isPreviewLoading = false;

    this.isImporting = false;
    this.isUploadingDocument = false;
    this.referenceDocumentSaved = false;

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

    const result: CourseBatchImportPreviewResponse = {

      curriculumCode: raw.curriculumCode,

      programCode: raw.programCode,

      totalRows: raw.totalRows,

      validRows: raw.validRows,

      warningRows: raw.warningRows,

      errorRows: raw.errorRows,

      skippedPdfLines: raw.skippedPdfLines,

      parseWarnings: raw.parseWarnings ?? [],

      detectedReferenceNumber: raw.detectedReferenceNumber,

      rows: (raw.rows ?? []).map((row) => {

        const mapped: CourseBatchImportPreviewRow = {

          rowNumber: row.rowNumber,

          courseCode: row.courseCode,

          courseTitle: row.courseTitle,

          courseLecUnits: row.courseLecUnits,

          courseLabUnits: row.courseLabUnits,

          courseTotalUnits: row.courseTotalUnits,

          courseYearLevel: row.courseYearLevel,

          courseSemester: row.courseSemester,

          prerequisites: normalizePrerequisiteString(row.prerequisites),

          courseComponent: row.courseComponent,

          selected: row.status !== 'Error',

          status: row.status,

          messages: row.messages ?? []

        };

        applyRowValidation(mapped);

        mapped.selected =
          mapped.status !== 'Error' &&
          mapped.courseTitle.trim().length <= COURSE_TITLE_MAX_LENGTH &&
          !hasExistingCourseCodeMessage(mapped.messages);

        return mapped;

      })

    };

    this.knownPrerequisiteCodes = buildKnownPrerequisiteCodes(result.rows);

    for (const row of result.rows) {

      applyRowPrerequisiteValidation(row, this.knownPrerequisiteCodes);

        row.selected =
          row.status !== 'Error' &&
          row.courseTitle.trim().length <= COURSE_TITLE_MAX_LENGTH &&
          !hasExistingCourseCodeMessage(row.messages);

    }

    return result;

  }



  private afterRowUnitsChanged(row: CourseBatchImportPreviewRow): void {

    this.afterRowChanged(row);

  }



  private afterRowChanged(row: CourseBatchImportPreviewRow): void {
    this.wizardForm.markAsDirty();

    applyRowValidation(row);
    applyRowPrerequisiteValidation(row, this.knownPrerequisiteCodes);

        row.selected =
          row.status !== 'Error' &&
          row.courseTitle.trim().length <= COURSE_TITLE_MAX_LENGTH &&
          !hasExistingCourseCodeMessage(row.messages);

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

  private uploadReferenceDocumentIfNeeded(): void {
    const file = this.resolveReferenceDocumentFile();
    const curriculumCode = this.selectedCurriculumCode.trim();

    if (!file || !curriculumCode) {
      this.finishImport();
      return;
    }

    this.isUploadingDocument = true;
    this.curriculaService
      .uploadSupportingDocument(curriculumCode, file)
      .pipe(finalize(() => (this.isUploadingDocument = false)))
      .subscribe({
        next: () => {
          this.referenceDocumentSaved = true;
          this.finishImport();
        },
        error: (err: { userMessage?: string; error?: { message?: string }; message?: string }) => {
          const msg =
            err?.userMessage ||
            err?.error?.message ||
            err?.message ||
            'Courses were imported, but the supporting document could not be saved.';
          this.notificationService.warning('Supporting document not saved', msg);
          this.finishImport();
        }
      });
  }

  private finishImport(): void {
    const importedCount = this.importSummary?.imported ?? 0;
    this.isImporting = false;
    this.step = 'complete';
    this.wizardForm.markAsPristine();
    this.imported.emit(importedCount);
  }

  private resolveReferenceDocumentFile(): File | null {
    if (this.supportingDocumentFile) {
      return this.supportingDocumentFile;
    }

    if (this.saveCurriculumPdfAsReference && this.selectedFile) {
      return this.selectedFile;
    }

    return null;
  }

  private isAllowedSupportingDocument(file: File): boolean {
    const name = file.name.toLowerCase();
    return (
      name.endsWith('.pdf') ||
      name.endsWith('.png') ||
      name.endsWith('.jpg') ||
      name.endsWith('.jpeg') ||
      name.endsWith('.webp') ||
      name.endsWith('.doc') ||
      name.endsWith('.docx')
    );
  }

}


