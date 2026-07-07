import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudentPortalService } from '../../StudentPortal/services/student-portal.service';
import { NotificationService } from '../../../shared/services/notification.service';
import type {
  StudentPortalIssueTemporaryPasswordResult,
  StudentPortalPasswordResetRequest
} from '../../StudentPortal/models/student-portal.models';

@Component({
  selector: 'app-admin-portal-password-resets',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './portal-password-resets.component.html',
  styleUrl: './portal-password-resets.component.scss'
})
export class AdminPortalPasswordResetsComponent implements OnInit {
  private readonly portalService = inject(StudentPortalService);
  private readonly notificationService = inject(NotificationService);

  requests: StudentPortalPasswordResetRequest[] = [];
  statusFilter = 'Pending';
  isLoading = true;
  processingId: number | null = null;

  selectedRequest: StudentPortalPasswordResetRequest | null = null;
  adminNotes = '';
  showIssueModal = false;
  showRejectModal = false;

  issuedResult: StudentPortalIssueTemporaryPasswordResult | null = null;
  copied = false;

  ngOnInit(): void {
    this.loadRequests();
  }

  get pendingCount(): number {
    return this.requests.filter((row) => row.status === 'Pending').length;
  }

  loadRequests(): void {
    this.isLoading = true;
    this.portalService.listPasswordResetRequests(this.statusFilter || undefined).subscribe({
      next: (rows) => {
        this.requests = [...rows];
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.notificationService.error('Load failed', 'Could not load password reset requests.');
      }
    });
  }

  openIssue(request: StudentPortalPasswordResetRequest): void {
    this.selectedRequest = request;
    this.adminNotes = '';
    this.showRejectModal = false;
    this.showIssueModal = true;
  }

  openReject(request: StudentPortalPasswordResetRequest): void {
    this.selectedRequest = request;
    this.adminNotes = '';
    this.showIssueModal = false;
    this.showRejectModal = true;
  }

  closeModals(): void {
    this.showIssueModal = false;
    this.showRejectModal = false;
    this.selectedRequest = null;
  }

  closeIssuedResult(): void {
    this.issuedResult = null;
    this.copied = false;
    this.loadRequests();
  }

  copyTemporaryPassword(): void {
    if (!this.issuedResult) {
      return;
    }

    void navigator.clipboard?.writeText(this.issuedResult.temporaryPassword).then(() => {
      this.copied = true;
    });
  }

  viewTempPassword(request: StudentPortalPasswordResetRequest): void {
    if (!request.temporaryPassword) {
      this.notificationService.error('Unavailable', 'No temporary password is stored for this request.');
      return;
    }

    this.issuedResult = {
      requestId: request.id,
      studentNumber: request.studentNumber,
      studentName: request.studentName,
      temporaryPassword: request.temporaryPassword,
      expiresAt: request.temporaryPasswordExpiresAt ?? ''
    };
    this.copied = false;
  }

  issueTemporaryPassword(): void {
    if (!this.selectedRequest) {
      return;
    }

    this.processingId = this.selectedRequest.id;
    this.portalService
      .issueTemporaryPassword(this.selectedRequest.id, this.adminNotes.trim() || undefined)
      .subscribe({
        next: (result) => {
          this.processingId = null;
          this.showIssueModal = false;
          this.selectedRequest = null;
          this.issuedResult = result;
          this.copied = false;
          this.notificationService.success('Temporary password issued', 'Relay it to the student securely.');
        },
        error: (error) => {
          this.processingId = null;
          this.notificationService.error(
            'Failed',
            error?.error?.error?.message || error?.message || 'Could not issue a temporary password.'
          );
        }
      });
  }

  confirmReject(): void {
    if (!this.selectedRequest) {
      return;
    }

    this.processingId = this.selectedRequest.id;
    this.portalService.rejectPasswordResetRequest(this.selectedRequest.id, this.adminNotes.trim() || undefined).subscribe({
      next: () => {
        this.processingId = null;
        this.notificationService.success('Rejected', 'Password reset request was rejected.');
        this.closeModals();
        this.loadRequests();
      },
      error: () => {
        this.processingId = null;
        this.notificationService.error('Failed', 'Could not reject request.');
      }
    });
  }

  statusClass(status: string): string {
    switch (status) {
      case 'Pending':
        return 'status-badge status-badge--pending';
      case 'TempIssued':
        return 'status-badge status-badge--issued';
      case 'Resolved':
        return 'status-badge status-badge--resolved';
      case 'Rejected':
        return 'status-badge status-badge--rejected';
      default:
        return 'status-badge';
    }
  }

  statusLabel(status: string): string {
    return status === 'TempIssued' ? 'Temp Issued' : status;
  }
}
