import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  EVALUATOR_TUITION_BATCH_OPTIONS,
  EVALUATOR_TUITION_COMPONENT_OPTIONS,
  EVALUATOR_TUITION_SCHOOL_YEAR_OPTIONS,
  EVALUATOR_TUITION_SEMESTER_OPTIONS,
  type EvaluatorTuitionFeeRow
} from '../../../../../mock-data/evaluator/evaluator-tuition-fees.mock';

@Component({
  selector: 'app-evaluator-tuition-fee-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './evaluator-tuition-fee-edit.component.html',
  styleUrl: './evaluator-tuition-fee-edit.component.scss'
})
export class EvaluatorTuitionFeeEditComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() tuitionFee: EvaluatorTuitionFeeRow | null = null;
  @Output() readonly close = new EventEmitter<void>();

  readonly schoolYearOptions = EVALUATOR_TUITION_SCHOOL_YEAR_OPTIONS;
  readonly batchOptions = EVALUATOR_TUITION_BATCH_OPTIONS;
  readonly semesterOptions = EVALUATOR_TUITION_SEMESTER_OPTIONS;
  readonly componentOptions = EVALUATOR_TUITION_COMPONENT_OPTIONS;

  readonly editForm = new FormGroup({
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
    if ((changes['tuitionFee'] || changes['isOpen']) && this.isOpen && this.tuitionFee) {
      this.patchFormFromRow(this.tuitionFee);
    }
  }

  onBackdropClick(): void {
    this.onClose();
  }

  onClose(): void {
    this.close.emit();
  }

  onSubmit(): void {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }
    this.onClose();
  }

  private patchFormFromRow(row: EvaluatorTuitionFeeRow): void {
    this.editForm.patchValue({
      syId: row.syId,
      batch: row.batch,
      semester: row.semester,
      courseCode: row.courseCode,
      courseTitle: row.courseTitle,
      component: row.component,
      units: row.units,
      cash: row.cash,
      lowMonthlyPayment: row.lowMonthlyPayment
    });
  }
}
