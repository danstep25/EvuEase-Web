import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, RouterOutlet, ActivatedRoute, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

interface NavItem {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-base',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    RouterOutlet
  ],
  templateUrl: './base.component.html',
  styleUrl: './base.component.scss'
})
export class BaseComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly navItems: NavItem[] = [
    { label: 'Dashboard', route: 'dashboard', icon: 'home' },
    { label: 'User Management', route: 'user-management', icon: 'people' },
    { label: 'System Logs', route: 'system-logs', icon: 'description' }
  ];

  currentRoute = '';
  loggedInUser = 'Admin User';

  constructor() {
    this.updateCurrentRoute(this.router.url);
    
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.updateCurrentRoute(event.url);
      });
  }

  private updateCurrentRoute(url: string): void {
    this.currentRoute = url;
  }

  isActive(route: string): boolean {
    const fullRoute = `/admin/${route}`;
    return this.currentRoute === fullRoute || this.currentRoute.startsWith(fullRoute + '/');
  }

  logout(): void {
    this.router.navigate(['/']);
  }
}
