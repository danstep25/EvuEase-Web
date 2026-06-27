import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudentPortalService } from '../../StudentPortal/services/student-portal.service';
import { NotificationService } from '../../../shared/services/notification.service';
import type { StudentPortalPasswordResetRequest } from '../../StudentPortal/models/student-portal.models';

@Component({
  selector: 'app-portal-password-resets',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './portal-password-resets.component.html',
  styleUrl: './portal-password-resets.component.scss'
})
export class PortalPasswordResetsComponent implements OnInit {
  private readonly portalService = inject(StudentPortalService);
  private readonly notificationService = inject(NotificationService);

  requests: StudentPortalPasswordResetRequest[] = [];
  statusFilter = 'Pending';
  isLoading = true;
  processingId: number | null = null;

  selectedRequest: StudentPortalPasswordResetRequest | null = null;
  newPortalPassword = '';
  registrarNotes = '';
  showResolveModal = false;

  ngOnInit(): void {
    this.loadRequests();
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

  openResolve(request: StudentPortalPasswordResetRequest): void {
    this.selectedRequest = request;
    this.newPortalPassword = '';
    this.registrarNotes = '';
    this.showResolveModal = true;
  }

  closeResolve(): void {
    this.showResolveModal = false;
    this.selectedRequest = null;
  }

  resolveRequest(): void {
    if (!this.selectedRequest || this.newPortalPassword.trim().length < 6) {
      return;
    }

    this.processingId = this.selectedRequest.id;
    this.portalService
      .resolvePasswordResetRequest(
        this.selectedRequest.id,
        this.newPortalPassword.trim(),
        this.registrarNotes.trim() || undefined
      )
      .subscribe({
        next: () => {
          this.processingId = null;
          this.notificationService.success('Resolved', 'Portal password was reset for the student.');
          this.closeResolve();
          this.loadRequests();
        },
        error: (error) => {
          this.processingId = null;
          this.notificationService.error(
            'Failed',
            error?.error?.error?.message || error?.message || 'Could not resolve request.'
          );
        }
      });
  }

  rejectRequest(request: StudentPortalPasswordResetRequest): void {
    this.processingId = request.id;
    this.portalService.rejectPasswordResetRequest(request.id).subscribe({
      next: () => {
        this.processingId = null;
        this.notificationService.success('Rejected', 'Password reset request was rejected.');
        this.loadRequests();
      },
      error: () => {
        this.processingId = null;
        this.notificationService.error('Failed', 'Could not reject request.');
      }
    });
  }
}
