import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  EVALUATOR_TUITION_BATCH_OPTIONS,
  EVALUATOR_TUITION_COMPONENT_OPTIONS,
  EVALUATOR_TUITION_FEE_ADD_FORM_DEFAULTS,
  EVALUATOR_TUITION_SCHOOL_YEAR_OPTIONS,
  EVALUATOR_TUITION_SEMESTER_OPTIONS
} from '../../../../../mock-data/evaluator/evaluator-tuition-fees.mock';

@Component({
  selector: 'app-evaluator-tuition-fee-add',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './evaluator-tuition-fee-add.component.html',
  styleUrls: ['../evaluator-tuition-fee-edit/evaluator-tuition-fee-edit.component.scss']
})
export class EvaluatorTuitionFeeAddComponent implements OnChanges {
  @Input() isOpen = false;
  @Output() readonly close = new EventEmitter<void>();

  readonly schoolYearOptions = EVALUATOR_TUITION_SCHOOL_YEAR_OPTIONS;
  readonly batchOptions = EVALUATOR_TUITION_BATCH_OPTIONS;
  readonly semesterOptions = EVALUATOR_TUITION_SEMESTER_OPTIONS;
  readonly componentOptions = EVALUATOR_TUITION_COMPONENT_OPTIONS;

  readonly addForm = new FormGroup({
    syId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    batch: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    semester: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    courseCode: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    courseTitle: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    component: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    units: new FormControl<number | null>(null, { validators: [Validators.required, Validators.min(1)] }),
    cash: new FormControl<number | null>(null, { validators: [Validators.required, Validators.min(0)] }),
    lowMonthlyPayment: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(0)]
    })
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      this.resetFormDefaults();
    }
  }

  onBackdropClick(): void {
    this.onClose();
  }

  onClose(): void {
    this.close.emit();
  }

  onSubmit(): void {
    if (this.addForm.invalid) {
      this.addForm.markAllAsTouched();
      return;
    }
    this.onClose();
  }

  private resetFormDefaults(): void {
    this.addForm.reset({
      syId: EVALUATOR_TUITION_FEE_ADD_FORM_DEFAULTS.syId,
      batch: EVALUATOR_TUITION_FEE_ADD_FORM_DEFAULTS.batch,
      semester: EVALUATOR_TUITION_FEE_ADD_FORM_DEFAULTS.semester,
      courseCode: EVALUATOR_TUITION_FEE_ADD_FORM_DEFAULTS.courseCode,
      courseTitle: EVALUATOR_TUITION_FEE_ADD_FORM_DEFAULTS.courseTitle,
      component: EVALUATOR_TUITION_FEE_ADD_FORM_DEFAULTS.component,
      units: EVALUATOR_TUITION_FEE_ADD_FORM_DEFAULTS.units,
      cash: EVALUATOR_TUITION_FEE_ADD_FORM_DEFAULTS.cash,
      lowMonthlyPayment: EVALUATOR_TUITION_FEE_ADD_FORM_DEFAULTS.lowMonthlyPayment
    });
  }
}
