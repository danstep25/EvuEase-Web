import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, RouterOutlet, ActivatedRoute, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { ADMIN_NAV_MENU, NavItem } from '../../../shared/constants/nav-menu.constant';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/user.model';

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
export class BaseComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);

  navItems: NavItem[] = ADMIN_NAV_MENU;
  currentRoute = '';
  loggedInUser: string = '';
  currentUser: User | null = null;

  constructor() {
    this.updateCurrentRoute(this.router.url);
    
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.updateCurrentRoute(event.url);
      });
  }

  ngOnInit(): void {
    this.loadUserFromStorage();
    this.filterNavItemsByRole();
    
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.loggedInUser = user?.name || 'User';
      this.filterNavItemsByRole();
    });
  }

  private loadUserFromStorage(): void {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        this.currentUser = JSON.parse(userStr);
        this.loggedInUser = this.currentUser?.name || 'User';
      } catch {
        this.loggedInUser = 'User';
      }
    } else {
      const user = this.authService.getCurrentUser();
      if (user) {
        this.currentUser = user;
        this.loggedInUser = user.name || 'User';
      }
    }
  }

  private filterNavItemsByRole(): void {
    if (!this.currentUser) {
      this.navItems = [];
      return;
    }

    const userRole = this.currentUser.role?.toLowerCase() || '';
    this.navItems = ADMIN_NAV_MENU.filter(item => {
      if (!item.roles || item.roles.length === 0) {
        return true;
      }
      return item.roles.some(role => role.toLowerCase() === userRole);
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
    this.authService.logout();
  }
}
