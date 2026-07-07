import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { unsavedChangesGuard } from './core/guards/unsaved-changes.guard';
import {
  studentPortalGuard,
  studentPortalGuestGuard,
  studentPortalSetPasswordGuard
} from './pages/StudentPortal/guards/student-portal.guard';

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
        path: 'portal-password-resets',
        loadComponent: () =>
          import('./pages/Admin/portal-password-resets/portal-password-resets.component').then(
            (m) => m.AdminPortalPasswordResetsComponent
          )
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
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/Registrar/dashboard/dashboard.component').then(m => m.RegistrarDashboardComponent)
      },
      {
        path: 'faculty-center',
        loadComponent: () => import('./pages/Registrar/FacultyCenter/faculty-center.component').then(m => m.FacultyCenterComponent)
      },
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
        path: 'students/new',
        canDeactivate: [unsavedChangesGuard],
        loadComponent: () =>
          import('./pages/Registrar/students/add-student').then(m => m.AddStudentComponent)
      },
      {
        path: 'students/:id/edit',
        canDeactivate: [unsavedChangesGuard],
        loadComponent: () =>
          import('./pages/Registrar/students/add-student').then(m => m.AddStudentComponent)
      },
      {
        path: 'students/:id/academic-records',
        loadComponent: () =>
          import('./pages/Registrar/students/academic-records').then(m => m.AcademicRecordsComponent)
      },
      {
        path: 'students/:id',
        loadComponent: () =>
          import('./pages/Registrar/students/student-detail').then(m => m.StudentDetailComponent)
      },
      {
        path: 'students',
        loadComponent: () => import('./pages/Registrar/students/students.component').then(m => m.StudentsComponent)
      },
      {
        path: 'archive',
        loadComponent: () => import('./pages/Registrar/archive/archive.component').then(m => m.ArchiveComponent)
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: 'evaluator',
    loadComponent: () => import('./pages/Evaluator/base/base.component').then(m => m.EvaluatorBaseComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/Evaluator/dashboard/dashboard.component').then(m => m.EvaluatorDashboardComponent)
      },
      {
        path: 'curriculum',
        loadComponent: () =>
          import('./pages/Evaluator/curriculum-view/evaluator-curriculum-view.component').then(
            m => m.EvaluatorCurriculumViewComponent
          ),
        data: { title: 'Curriculum' }
      },
      {
        path: 'student-records',
        loadComponent: () =>
          import('./pages/Evaluator/student-permanent-records/student-permanent-records.component').then(
            (m) => m.StudentPermanentRecordsComponent
          )
      },
      {
        path: 'subject-evaluation',
        loadComponent: () =>
          import('./pages/Evaluator/subject-evaluation/subject-evaluation.component').then(
            (m) => m.SubjectEvaluationComponent
          ),
        data: { title: 'Subject Evaluation' }
      },
      {
        path: 'credit-subjects/add',
        canDeactivate: [unsavedChangesGuard],
        loadComponent: () =>
          import('./pages/Evaluator/add-credit-request/add-credit-request.component').then(
            (m) => m.AddCreditRequestComponent
          ),
        data: { title: 'Add Credit Request' }
      },
      {
        path: 'credit-subjects/:id',
        loadComponent: () =>
          import('./pages/Evaluator/view-credit-request/view-credit-request.component').then(
            (m) => m.ViewCreditRequestComponent
          ),
        data: { title: 'View Credit Request' }
      },
      {
        path: 'credit-subjects',
        loadComponent: () =>
          import('./pages/Evaluator/credit-subjects/credit-subjects.component').then(
            (m) => m.CreditSubjectsComponent
          ),
        data: { title: 'Credit Subjects (Transferees)' }
      },
      {
        path: 'analytics',
        loadComponent: () =>
          import('./pages/Evaluator/analytics/analytics.component').then((m) => m.AnalyticsComponent),
        data: { title: 'Analytics' }
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: 'student_portal',
    children: [
      {
        path: 'login',
        canActivate: [studentPortalGuestGuard],
        loadComponent: () =>
          import('./pages/StudentPortal/login/login.component').then((m) => m.StudentPortalLoginComponent)
      },
      {
        path: 'reset-password',
        canActivate: [studentPortalGuestGuard],
        loadComponent: () =>
          import('./pages/StudentPortal/reset-password/reset-password.component').then(
            (m) => m.StudentPortalResetPasswordComponent
          )
      },
      {
        path: 'set-password',
        canActivate: [studentPortalSetPasswordGuard],
        loadComponent: () =>
          import('./pages/StudentPortal/set-password/set-password.component').then(
            (m) => m.StudentPortalSetPasswordComponent
          )
      },
      {
        path: '',
        loadComponent: () =>
          import('./pages/StudentPortal/base/base.component').then((m) => m.StudentPortalBaseComponent),
        canActivate: [studentPortalGuard],
        children: [
          {
            path: 'dashboard',
            loadComponent: () =>
              import('./pages/StudentPortal/dashboard/dashboard.component').then(
                (m) => m.StudentPortalDashboardComponent
              )
          },
          {
            path: 'my-subjects',
            loadComponent: () =>
              import('./pages/StudentPortal/my-subjects/my-subjects.component').then(
                (m) => m.StudentPortalMySubjectsComponent
              )
          },
          {
            path: 'grade-history',
            loadComponent: () =>
              import('./pages/StudentPortal/grade-history/grade-history.component').then(
                (m) => m.StudentPortalGradeHistoryComponent
              )
          },
          {
            path: 'pending-subjects',
            loadComponent: () =>
              import('./pages/StudentPortal/pending-subjects/pending-subjects.component').then(
                (m) => m.StudentPortalPendingSubjectsComponent
              )
          },
          {
            path: 'profile',
            loadComponent: () =>
              import('./pages/StudentPortal/profile/profile.component').then((m) => m.StudentPortalProfileComponent)
          },
          {
            path: '',
            redirectTo: 'dashboard',
            pathMatch: 'full'
          }
        ]
      }
    ]
  },
  {
    path: '**',
    loadComponent: () => import('./pages/not-found/not-found.component').then(m => m.NotFoundComponent)
  }
];
