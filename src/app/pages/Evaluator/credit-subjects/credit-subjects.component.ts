import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MOCK_CREDIT_REQUEST_ROWS } from '../../../../mock-data/evaluator/credit-subjects.mock';

@Component({
  selector: 'app-credit-subjects',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './credit-subjects.component.html',
  styleUrl: './credit-subjects.component.scss'
})
export class CreditSubjectsComponent {
  private readonly router = inject(Router);

  readonly pageTitle = 'Credit Subjects (Transferees)';
  readonly pageSubtitle = 'Map equivalent subjects for transferee students';
  readonly rows = MOCK_CREDIT_REQUEST_ROWS;

  onAddCreditRequest(): void {
    void this.router.navigate(['/evaluator', 'credit-subjects', 'add']);
  }
}
