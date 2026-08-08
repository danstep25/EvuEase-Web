import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormsModule } from '@angular/forms';
import { FormDiscardService } from '../../services/form-discard.service';
import { attemptFormClose } from '../../utils/form-state.util';
import { SyTerm } from '../../../core/models/sy-term.model';

export type CurrentTermPickerFocus = 'schoolYear' | 'semester';

@Component({
  selector: 'app-current-term-picker-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './current-term-picker-modal.component.html',
  styleUrl: './current-term-picker-modal.component.scss'
})
export class CurrentTermPickerModalComponent implements OnChanges {
  private readonly formDiscard = inject(FormDiscardService);

  private readonly pickerForm = new FormGroup({});
  private initialSchoolYear = '';
  private initialSemester = '';
  @Input({ required: true }) isOpen = false;
  @Input() syTerms: SyTerm[] = [];
  @Input() currentSyTermId: number | null = null;
  @Input() initialFocus: CurrentTermPickerFocus = 'schoolYear';
  @Input() isLoading = false;
  @Input() isSubmitting = false;
  @Input() errorMessage: string | null = null;

  @Output() readonly close = new EventEmitter<void>();
  @Output() readonly confirm = new EventEmitter<number>();

  searchText = '';
  selectedSchoolYear = '';
  selectedSemester = '';
  activeStep: CurrentTermPickerFocus = 'schoolYear';

  schoolYears: string[] = [];
  semestersForYear: SyTerm[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']?.currentValue) {
      this.resetPickerState();
    }

    if (changes['syTerms'] || changes['currentSyTermId'] || changes['isOpen']) {
      this.rebuildOptions();
    }
  }

  get selectedTerm(): SyTerm | null {
    if (!this.selectedSchoolYear || !this.selectedSemester) {
      return null;
    }
    return (
      this.syTerms.find(
        (term) =>
          term.syYear?.trim() === this.selectedSchoolYear &&
          term.sySemester?.trim() === this.selectedSemester
      ) ?? null
    );
  }

  get canConfirm(): boolean {
    return !!this.selectedTerm && !this.isSubmitting;
  }

  get filteredSchoolYears(): string[] {
    const q = this.searchText.trim().toLowerCase();
    if (!q || this.activeStep !== 'schoolYear') {
      return this.schoolYears;
    }
    return this.schoolYears.filter((year) => year.toLowerCase().includes(q));
  }

  get filteredSemesters(): SyTerm[] {
    const q = this.searchText.trim().toLowerCase();
    if (!q || this.activeStep !== 'semester') {
      return this.semestersForYear;
    }
    return this.semestersForYear.filter((term) =>
      (term.sySemester ?? '').toLowerCase().includes(q)
    );
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  onClose(): void {
    if (this.isSubmitting) {
      return;
    }
    if (this.hasSelectionChanged()) {
      this.pickerForm.markAsDirty();
    } else {
      this.pickerForm.markAsPristine();
    }
    void attemptFormClose({
      form: this.pickerForm,
      discardService: this.formDiscard,
      close: () => this.close.emit()
    });
  }

  onConfirm(): void {
    const term = this.selectedTerm;
    if (!term || this.isSubmitting) {
      return;
    }
    this.confirm.emit(term.syId);
  }

  selectSchoolYear(year: string): void {
    this.pickerForm.markAsDirty();
    this.selectedSchoolYear = year;
    this.selectedSemester = '';
    this.searchText = '';
    this.activeStep = 'semester';
    this.rebuildSemestersForYear();
  }

  selectSemester(term: SyTerm): void {
    this.pickerForm.markAsDirty();
    this.selectedSemester = term.sySemester?.trim() ?? '';
  }

  private hasSelectionChanged(): boolean {
    return (
      this.selectedSchoolYear !== this.initialSchoolYear ||
      this.selectedSemester !== this.initialSemester
    );
  }

  goToSchoolYearStep(): void {
    this.activeStep = 'schoolYear';
    this.searchText = '';
  }

  isCurrentTerm(term: SyTerm): boolean {
    return term.syId === this.currentSyTermId;
  }

  isSelectedSchoolYear(year: string): boolean {
    return this.selectedSchoolYear === year;
  }

  isSelectedSemester(term: SyTerm): boolean {
    return this.selectedSemester === term.sySemester?.trim();
  }

  private resetPickerState(): void {
    this.searchText = '';
    this.activeStep = this.initialFocus;
    this.selectedSchoolYear = '';
    this.selectedSemester = '';

    const current = this.syTerms.find((term) => term.syId === this.currentSyTermId);
    if (current) {
      this.selectedSchoolYear = current.syYear?.trim() ?? '';
      this.selectedSemester = current.sySemester?.trim() ?? '';
      if (this.initialFocus === 'semester' && this.selectedSchoolYear) {
        this.activeStep = 'semester';
      }
    }
    this.initialSchoolYear = this.selectedSchoolYear;
    this.initialSemester = this.selectedSemester;
    this.pickerForm.markAsPristine();
  }

  private rebuildOptions(): void {
    this.schoolYears = [...new Set(this.syTerms.map((term) => term.syYear?.trim() ?? '').filter(Boolean))]
      .sort((a, b) => b.localeCompare(a));
    this.rebuildSemestersForYear();
  }

  private rebuildSemestersForYear(): void {
    if (!this.selectedSchoolYear) {
      this.semestersForYear = [];
      return;
    }

    this.semestersForYear = this.syTerms
      .filter((term) => term.syYear?.trim() === this.selectedSchoolYear)
      .sort((a, b) => (a.sySemester ?? '').localeCompare(b.sySemester ?? ''));
  }
}
