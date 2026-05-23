import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  EVALUATOR_TUITION_BATCH_OPTIONS,
  EVALUATOR_TUITION_SEMESTER_OPTIONS
} from '../../../../../mock-data/evaluator/evaluator-tuition-fees.mock';
import {
  EVALUATOR_OTHER_SCHOOL_SCHOOL_YEAR_OPTIONS,
  type EvaluatorOtherSchoolFeeRow
} from '../../../../../mock-data/evaluator/evaluator-other-school-fees.mock';

@Component({
  selector: 'app-evaluator-other-school-fee-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './evaluator-other-school-fee-edit.component.html',
  styleUrls: ['../evaluator-tuition-fee-edit/evaluator-tuition-fee-edit.component.scss']
})
export class EvaluatorOtherSchoolFeeEditComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() schoolFee: EvaluatorOtherSchoolFeeRow | null = null;
  @Output() readonly close = new EventEmitter<void>();

  readonly schoolYearOptions = EVALUATOR_OTHER_SCHOOL_SCHOOL_YEAR_OPTIONS;
  readonly batchOptions = EVALUATOR_TUITION_BATCH_OPTIONS;
  readonly semesterOptions = EVALUATOR_TUITION_SEMESTER_OPTIONS;

  readonly editForm = new FormGroup({
    syId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    batch: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    semester: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    schoolFee: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    cash: new FormControl<number | null>(null, { validators: [Validators.required, Validators.min(0)] }),
    lowMonthlyPayment: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(0)]
    })
  });

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['schoolFee'] || changes['isOpen']) && this.isOpen && this.schoolFee) {
      this.patchFormFromRow(this.schoolFee);
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

  private patchFormFromRow(row: EvaluatorOtherSchoolFeeRow): void {
    this.editForm.patchValue({
      syId: row.syId,
      batch: row.batch,
      semester: row.semester,
      schoolFee: row.schoolFee,
      cash: row.cash,
      lowMonthlyPayment: row.lowMonthlyPayment
    });
  }
}
