import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudentPortalService } from '../services/student-portal.service';
import { NotificationService } from '../../../shared/services/notification.service';
import type { StudentPortalProfile } from '../models/student-portal.models';

@Component({
  selector: 'app-student-portal-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrl: '../student-portal.shared.scss'
})
export class StudentPortalProfileComponent implements OnInit {
  private readonly portalService = inject(StudentPortalService);
  private readonly notificationService = inject(NotificationService);

  profile: StudentPortalProfile | null = null;
  isLoading = true;

  showResetForm = false;
  resetReason = '';
  isSubmittingReset = false;
  resetSubmitted = false;

  ngOnInit(): void {
    this.portalService.getProfile().subscribe({
      next: (profile) => {
        this.profile = profile;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  openResetForm(): void {
    this.showResetForm = true;
    this.resetReason = '';
  }

  cancelResetForm(): void {
    this.showResetForm = false;
    this.resetReason = '';
  }

  submitReset(): void {
    if (this.isSubmittingReset) {
      return;
    }

    this.isSubmittingReset = true;
    this.portalService.requestPasswordResetAuthenticated(this.resetReason.trim() || undefined).subscribe({
      next: () => {
        this.isSubmittingReset = false;
        this.showResetForm = false;
        this.resetSubmitted = true;
        this.notificationService.success(
          'Request submitted',
          'The administrator will review your password reset request.'
        );
      },
      error: (error) => {
        this.isSubmittingReset = false;
        this.notificationService.error(
          'Request failed',
          error?.error?.error?.message ||
            error?.error?.message ||
            error?.message ||
            'Could not submit your password reset request.'
        );
      }
    });
  }
}
