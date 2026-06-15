import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CreditRequest } from '../../../core/models/credit-request.model';
import {
  CREDIT_REQUEST_PREVIEW_DECLARATION_TEXT,
  CREDIT_REQUEST_PREVIEW_ELIGIBILITY_TEXT,
  CREDIT_REQUEST_PREVIEW_NON_STI_RULES,
  CREDIT_REQUEST_PREVIEW_STI_PROGRAM_RULES
} from '../../../../mock-data/evaluator/add-credit-request-preview.mock';
import {
  buildCreditRequestPreviewRows,
  CreditRequestPreviewTableRow,
  formatCreditRequestTermLabel
} from './credit-request-preview.util';

@Component({
  selector: 'app-credit-request-print-form',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './credit-request-print-form.component.html',
  styleUrl: './credit-request-print.scss'
})
export class CreditRequestPrintFormComponent implements OnChanges {
  @Input({ required: true }) creditRequest!: CreditRequest;

  previewRows: CreditRequestPreviewTableRow[] = [];
  termLabel = '—';

  readonly previewEligibilityText = CREDIT_REQUEST_PREVIEW_ELIGIBILITY_TEXT;
  readonly previewStiRules = CREDIT_REQUEST_PREVIEW_STI_PROGRAM_RULES;
  readonly previewNonStiRules = CREDIT_REQUEST_PREVIEW_NON_STI_RULES;
  readonly previewDeclarationText = CREDIT_REQUEST_PREVIEW_DECLARATION_TEXT;

  ngOnChanges(): void {
    this.previewRows = buildCreditRequestPreviewRows(this.creditRequest);
    this.termLabel = formatCreditRequestTermLabel(this.creditRequest);
  }

  isPreviewRowHighlighted(index: number): boolean {
    const firstFilledIndex = this.previewRows.findIndex((row) => row.isFilled);
    return firstFilledIndex >= 0 && index === firstFilledIndex;
  }
}
