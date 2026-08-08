import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './not-found.component.html',
  styleUrl: './not-found.component.scss'
})
export class NotFoundComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  get homeLink(): string {
    const user = this.authService.getCurrentUser();
    const role = user?.role?.toLowerCase() || '';

    if (role === 'admin') {
      return '/admin';
    }

    if (role === 'registrar') {
      return '/registrar';
    }

    return '/';
  }

  goHome(): void {
    this.router.navigateByUrl(this.homeLink);
  }
}


