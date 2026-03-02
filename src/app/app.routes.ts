import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/Authentication/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'admin',
    loadComponent: () => import('./pages/Admin/base/base.component').then(m => m.BaseComponent),
    canActivate: [authGuard],
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
    path: 'registrar',
    loadComponent: () => import('./pages/Registrar/base/base.component').then(m => m.RegistrarBaseComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'program-management',
        loadComponent: () => import('./pages/Registrar/program-management/program-management.component').then(m => m.RegistrarProgramManagementComponent)
      },
      {
        path: 'school-year-term',
        loadComponent: () => import('./pages/Registrar/school-year-term/school-year-term.component').then(m => m.SchoolYearTermComponent)
      },
      {
        path: 'curriculum-management',
        loadComponent: () => import('./pages/Registrar/curriculum-management/curriculum-management.component').then(m => m.CurriculumManagementComponent)
      },
      {
        path: 'students',
        loadComponent: () => import('./pages/Registrar/students/students.component').then(m => m.StudentsComponent)
      },
      {
        path: '',
        redirectTo: 'program-management',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '**',
    loadComponent: () => import('./pages/not-found/not-found.component').then(m => m.NotFoundComponent)
  }
];
