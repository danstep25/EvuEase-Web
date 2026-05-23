import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { ChargeSlipPreview } from '../../../../mock-data/evaluator/subject-evaluation-charge-slip.mock';

@Component({
  selector: 'app-subject-evaluation-charge-slip-preview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './subject-evaluation-charge-slip-preview.component.html',
  styleUrl: './subject-evaluation-charge-slip-preview.component.scss'
})
export class SubjectEvaluationChargeSlipPreviewComponent {
  @Input() preview: ChargeSlipPreview | null = null;

  readonly disclaimerText =
    'The tuition fees reflected above can vary depending on the courses selected. This is not the official registration and assessment form. Kindly coordinate with the School Registrar for the official class schedules and assessment.';

  trackTuitionRow(_index: number, row: ChargeSlipPreview['tuitionRows'][number]): number {
    return row.rowNumber;
  }

  trackFeeRow(_index: number, row: { label: string }): string {
    return row.label;
  }

  trackPaymentRow(_index: number, row: { label: string }): string {
    return row.label;
  }
}
