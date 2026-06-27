import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { STUDENT_PORTAL_NAV_MENU } from '../constants/student-portal-nav.constant';
import { StudentAuthService } from '../services/student-auth.service';
import type { StudentPortalSession } from '../models/student-portal.models';

@Component({
  selector: 'app-student-portal-base',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet],
  templateUrl: './base.component.html',
  styleUrl: '../../Evaluator/base/base.component.scss'
})
export class StudentPortalBaseComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly studentAuth = inject(StudentAuthService);

  readonly navItems = STUDENT_PORTAL_NAV_MENU;
  currentRoute = '';
  currentStudent: StudentPortalSession | null = null;

  constructor() {
    this.updateCurrentRoute(this.router.url);
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => this.updateCurrentRoute((event as NavigationEnd).url));
  }

  ngOnInit(): void {
    this.currentStudent = this.studentAuth.getCurrentStudent();
    this.studentAuth.currentStudent$.subscribe((student) => {
      this.currentStudent = student;
    });
  }

  isActive(route: string): boolean {
    const fullRoute = `/student_portal/${route}`;
    return this.currentRoute === fullRoute || this.currentRoute.startsWith(`${fullRoute}/`);
  }

  logout(): void {
    this.studentAuth.logout();
  }

  private updateCurrentRoute(url: string): void {
    this.currentRoute = url;
  }
}
