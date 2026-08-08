import { Component, EventEmitter, Input, OnDestroy, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { CreditRequest } from '../../../core/models/credit-request.model';
import { CreditRequestService } from '../../Evaluator/credit-request/credit-request.service';
import { CreditRequestPrintFormComponent } from '../../Evaluator/credit-request/credit-request-print-form.component';
import { NotificationService } from '../../../shared/services/notification.service';
import { printCreditRequestForm } from '../../../shared/utils/print-credit-request.util';
import {
  ConfirmationModalComponent,
  ConfirmationModalConfig
} from '../../../shared/components/confirmation-modal/confirmation-modal.component';

type PendingAction = 'approve' | 'reject' | null;
type ConfirmKind = 'approve' | 'approve-without-pdf' | 'reject' | 'remove-pdf' | null;

@Component({
  selector: 'app-faculty-credit-request-detail-modal',
  standalone: true,
  imports: [CommonModule, CreditRequestPrintFormComponent, ConfirmationModalComponent],
  templateUrl: './faculty-credit-request-detail-modal.component.html',
  styleUrl: './faculty-credit-request-detail-modal.component.scss'
})
export class FacultyCreditRequestDetailModalComponent implements OnDestroy {
  private readonly creditRequestService = inject(CreditRequestService);
  private readonly notificationService = inject(NotificationService);
  private readonly destroy$ = new Subject<void>();

  @Input() open = false;
  @Input() creditRequest: CreditRequest | null = null;
  @Input() loading = false;
  @Input() saving = false;

  @Output() closed = new EventEmitter<void>();
  @Output() savingChange = new EventEmitter<boolean>();
  @Output() statusUpdated = new EventEmitter<CreditRequest>();

  pendingAction: PendingAction = null;
  confirmKind: ConfirmKind = null;
  confirmModalOpen = false;
  confirmConfig: ConfirmationModalConfig = {
    title: 'Confirm',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    confirmButtonClass: 'bg-blue-600 hover:bg-blue-700'
  };

  uploadingSignedPdf = false;
  dragActive = false;

  get isPending(): boolean {
    return (this.creditRequest?.requestStatus?.trim().toLowerCase() ?? 'pending') === 'pending';
  }

  get hasSignedPdf(): boolean {
    return !!this.creditRequest?.hasSignedPdf;
  }

  get signedPdfLabel(): string {
    return this.creditRequest?.signedPdfFileName?.trim() || 'Signed credit request.pdf';
  }

  get statusLabel(): string {
    return this.creditRequest?.requestStatus?.trim() || 'Pending';
  }

  get statusClass(): string {
    const normalized = this.statusLabel.toLowerCase();
    if (normalized === 'approved') {
      return 'fcrdm__status--approved';
    }
    if (normalized === 'rejected') {
      return 'fcrdm__status--rejected';
    }
    return 'fcrdm__status--pending';
  }

  onBackdropClick(): void {
    if (this.saving || this.uploadingSignedPdf) {
      return;
    }
    this.close();
  }

  close(): void {
    if (this.saving || this.uploadingSignedPdf) {
      return;
    }
    this.pendingAction = null;
    this.confirmKind = null;
    this.confirmModalOpen = false;
    this.closed.emit();
  }

  onPrint(): void {
    printCreditRequestForm();
  }

  onApproveClick(): void {
    this.pendingAction = 'approve';
    if (!this.hasSignedPdf) {
      this.confirmKind = 'approve-without-pdf';
      this.confirmConfig = {
        title: 'No signed PDF uploaded',
        message:
          'You have not uploaded a signed credit request form. Approving will still credit the mapped subjects to the student. Do you want to continue?',
        confirmText: 'Approve anyway',
        cancelText: 'Cancel',
        confirmButtonClass: 'bg-amber-600 hover:bg-amber-700'
      };
      this.confirmModalOpen = true;
      return;
    }

    this.openApproveConfirm();
  }

  onRejectClick(): void {
    this.pendingAction = 'reject';
    this.confirmKind = 'reject';
    this.confirmConfig = {
      title: 'Reject credit request',
      message: `Reject ${this.creditRequest?.creditRequestNo ?? 'this request'}? The evaluator will need to revise and resubmit.`,
      confirmText: 'Reject',
      cancelText: 'Cancel',
      confirmButtonClass: 'bg-red-600 hover:bg-red-700'
    };
    this.confirmModalOpen = true;
  }

  onRemoveSignedPdfClick(): void {
    this.confirmKind = 'remove-pdf';
    this.confirmConfig = {
      title: 'Remove signed PDF',
      message: 'Remove the uploaded signed credit request? You can upload a new file before approving.',
      confirmText: 'Remove',
      cancelText: 'Cancel',
      confirmButtonClass: 'bg-red-600 hover:bg-red-700'
    };
    this.confirmModalOpen = true;
  }

  onConfirmCancel(): void {
    this.confirmModalOpen = false;
    this.pendingAction = null;
    this.confirmKind = null;
  }

  onConfirmProceed(): void {
    if (this.confirmKind === 'approve-without-pdf') {
      this.confirmModalOpen = false;
      this.confirmKind = null;
      this.openApproveConfirm();
      return;
    }

    if (this.confirmKind === 'remove-pdf') {
      this.confirmModalOpen = false;
      this.confirmKind = null;
      this.removeSignedPdf();
      return;
    }

    if (!this.creditRequest || !this.pendingAction) {
      this.confirmModalOpen = false;
      return;
    }

    const nextStatus = this.pendingAction === 'approve' ? 'Approved' : 'Rejected';
    this.confirmModalOpen = false;
    this.confirmKind = null;
    this.pendingAction = null;
    this.submitStatusUpdate(nextStatus);
  }

  onSignedPdfSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (file) {
      this.uploadSignedPdf(file);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (!this.isPending || this.uploadingSignedPdf || this.saving) {
      return;
    }
    this.dragActive = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.dragActive = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragActive = false;
    if (!this.isPending || this.uploadingSignedPdf || this.saving) {
      return;
    }

    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.uploadSignedPdf(file);
    }
  }

  onViewSignedPdf(): void {
    if (!this.creditRequest) {
      return;
    }

    this.creditRequestService
      .downloadSignedPdf(this.creditRequest.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          const url = URL.createObjectURL(blob);
          window.open(url, '_blank', 'noopener,noreferrer');
          window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
        },
        error: (err: { userMessage?: string; message?: string }) => {
          this.notificationService.error(
            'View failed',
            err?.userMessage || err?.message || 'Could not open the signed PDF.'
          );
        }
      });
  }

  private openApproveConfirm(): void {
    this.pendingAction = 'approve';
    this.confirmKind = 'approve';
    this.confirmConfig = {
      title: 'Approve credit request',
      message: `Approve ${this.creditRequest?.creditRequestNo ?? 'this request'}? Mapped subjects will be credited to the student record.`,
      confirmText: 'Approve',
      cancelText: 'Cancel',
      confirmButtonClass: 'bg-emerald-600 hover:bg-emerald-700'
    };
    this.confirmModalOpen = true;
  }

  private uploadSignedPdf(file: File): void {
    if (!this.creditRequest) {
      return;
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      this.notificationService.error('Invalid file', 'Only PDF files are accepted.');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      this.notificationService.error('File too large', 'Signed PDF must be 20 MB or smaller.');
      return;
    }

    this.uploadingSignedPdf = true;
    this.creditRequestService
      .uploadSignedPdf(this.creditRequest.id, file)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updated) => {
          this.uploadingSignedPdf = false;
          this.creditRequest = updated;
          this.notificationService.success('Upload complete', 'Signed credit request PDF was uploaded.');
        },
        error: (err: { userMessage?: string; message?: string }) => {
          this.uploadingSignedPdf = false;
          this.notificationService.error(
            'Upload failed',
            err?.userMessage || err?.message || 'Could not upload the signed PDF.'
          );
        }
      });
  }

  private removeSignedPdf(): void {
    if (!this.creditRequest) {
      return;
    }

    this.uploadingSignedPdf = true;
    this.creditRequestService
      .removeSignedPdf(this.creditRequest.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updated) => {
          this.uploadingSignedPdf = false;
          this.creditRequest = updated;
          this.notificationService.success('Removed', 'Signed PDF was removed.');
        },
        error: (err: { userMessage?: string; message?: string }) => {
          this.uploadingSignedPdf = false;
          this.notificationService.error(
            'Remove failed',
            err?.userMessage || err?.message || 'Could not remove the signed PDF.'
          );
        }
      });
  }

  private submitStatusUpdate(nextStatus: string): void {
    if (!this.creditRequest) {
      return;
    }

    this.savingChange.emit(true);
    this.creditRequestService
      .updateCreditRequestStatus(this.creditRequest.id, nextStatus)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updated) => {
          this.savingChange.emit(false);
          this.creditRequest = updated;
          this.statusUpdated.emit(updated);
        },
        error: (err: { userMessage?: string; message?: string }) => {
          this.savingChange.emit(false);
          this.notificationService.error(
            'Update failed',
            err?.userMessage || err?.message || 'Could not update the credit request status.'
          );
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
