import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { EVALUATOR_NAV_MENU, NavItem } from '../../../shared/constants/nav-menu.constant';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-evaluator-base',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet],
  templateUrl: './base.component.html',
  styleUrl: './base.component.scss'
})
export class EvaluatorBaseComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  navItems: NavItem[] = EVALUATOR_NAV_MENU;
  currentRoute = '';
  loggedInUser = '';
  currentUser: User | null = null;

  constructor() {
    this.updateCurrentRoute(this.router.url);
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: unknown) => {
        const nav = event as NavigationEnd;
        this.updateCurrentRoute(nav.url);
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
    if (!userStr) {
      const user = this.authService.getCurrentUser();
      this.currentUser = user;
      this.loggedInUser = user?.name || 'User';
      return;
    }
    try {
      this.currentUser = JSON.parse(userStr);
      this.loggedInUser = this.currentUser?.name || 'User';
    } catch {
      this.loggedInUser = 'User';
    }
  }

  private filterNavItemsByRole(): void {
    if (!this.currentUser) {
      this.navItems = [];
      return;
    }
    const role = this.currentUser.role?.toLowerCase() || '';
    this.navItems = EVALUATOR_NAV_MENU.filter(item => {
      if (!item.roles || item.roles.length === 0) {
        return true;
      }
      return item.roles.some(r => r.toLowerCase() === role);
    });
  }

  private updateCurrentRoute(url: string): void {
    this.currentRoute = url;
  }

  isActive(route: string): boolean {
    const fullRoute = `/evaluator/${route}`;
    return this.currentRoute === fullRoute || this.currentRoute.startsWith(`${fullRoute}/`);
  }

  logout(): void {
    this.authService.logout();
  }
}
