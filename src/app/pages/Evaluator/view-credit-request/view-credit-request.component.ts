import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { CreditRequest } from '../../../core/models/credit-request.model';
import { CreditRequestService } from '../credit-request/credit-request.service';
import { CreditRequestPrintFormComponent } from '../credit-request/credit-request-print-form.component';
import { NotificationService } from '../../../shared/services/notification.service';
import { printCreditRequestForm } from '../../../shared/utils/print-credit-request.util';

@Component({
  selector: 'app-view-credit-request',
  standalone: true,
  imports: [CommonModule, CreditRequestPrintFormComponent],
  templateUrl: './view-credit-request.component.html',
  styleUrl: './view-credit-request.component.scss'
})
export class ViewCreditRequestComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly creditRequestService = inject(CreditRequestService);
  private readonly notificationService = inject(NotificationService);
  private readonly destroy$ = new Subject<void>();

  creditRequest: CreditRequest | null = null;
  isLoading = true;
  errorMessage: string | null = null;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    const printOnLoad = this.route.snapshot.queryParamMap.get('print') === 'true';

    if (!id) {
      this.isLoading = false;
      this.errorMessage = 'Credit request was not found.';
      return;
    }

    this.creditRequestService
      .getCreditRequestById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (request) => {
          this.isLoading = false;
          this.creditRequest = request;
          if (printOnLoad) {
            window.setTimeout(() => this.onPrint(), 350);
          }
        },
        error: (err: { userMessage?: string; message?: string }) => {
          this.isLoading = false;
          this.errorMessage = err?.userMessage || err?.message || 'Could not load the credit request.';
          this.notificationService.error('Load failed', this.errorMessage);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onBack(): void {
    void this.router.navigate(['/evaluator', 'credit-subjects']);
  }

  onPrint(): void {
    printCreditRequestForm();
  }

  getStatusLabel(): string {
    const status = this.creditRequest?.requestStatus?.trim() ?? '';
    return status || 'Pending';
  }

  getStatusClass(): string {
    const normalized = this.getStatusLabel().toLowerCase();
    if (normalized === 'approved') {
      return 'view-credit-request__status--approved';
    }
    if (normalized === 'rejected') {
      return 'view-credit-request__status--rejected';
    }
    return 'view-credit-request__status--pending';
  }
}
