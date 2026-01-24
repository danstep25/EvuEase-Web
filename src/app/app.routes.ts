import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/Authentication/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'admin',
    loadComponent: () => import('./pages/Admin/base/base.component').then(m => m.BaseComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/Admin/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'user-management',
        loadComponent: () => import('./pages/Admin/user-management/user-management.component').then(m => m.UserManagementComponent)
      },
      {
        path: 'system-logs',
        loadComponent: () => import('./pages/Admin/system-logs/system-logs.component').then(m => m.SystemLogsComponent)
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
