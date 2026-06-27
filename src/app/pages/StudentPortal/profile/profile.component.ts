import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudentPortalService } from '../services/student-portal.service';
import type { StudentPortalProfile } from '../models/student-portal.models';

@Component({
  selector: 'app-student-portal-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.component.html',
  styleUrl: '../student-portal.shared.scss'
})
export class StudentPortalProfileComponent implements OnInit {
  private readonly portalService = inject(StudentPortalService);

  profile: StudentPortalProfile | null = null;
  isLoading = true;

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
}
