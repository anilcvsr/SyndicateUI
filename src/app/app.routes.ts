import { Routes } from '@angular/router';
import { adminGuard, authGuard, memberGuard, publicOnlyGuard } from './core/guards/auth.guards';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    canActivate: [publicOnlyGuard],
    loadComponent: () => import('./features/auth/login.component').then((m) => m.LoginComponent)
  },
  {
    path: 'admin',
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./features/auth/admin-login.component').then((m) => m.AdminLoginComponent)
      },
      {
        path: '',
        canActivate: [authGuard, adminGuard],
        loadComponent: () =>
          import('./features/admin/shell/admin-shell.component').then((m) => m.AdminShellComponent),
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
          {
            path: 'dashboard',
            loadComponent: () =>
              import('./features/admin/dashboard/admin-dashboard.component').then((m) => m.AdminDashboardComponent)
          },
          {
            path: 'members',
            loadComponent: () =>
              import('./features/admin/members/admin-members.component').then((m) => m.AdminMembersComponent)
          },
          {
            path: 'payments',
            loadComponent: () =>
              import('./features/admin/payments/admin-payments.component').then((m) => m.AdminPaymentsComponent)
          },
          {
            path: 'monthly-log',
            loadComponent: () =>
              import('./features/admin/monthly-log/admin-monthly-log.component').then((m) => m.AdminMonthlyLogComponent)
          },
          {
            path: 'dues',
            loadComponent: () =>
              import('./features/admin/dues/admin-dues.component').then((m) => m.AdminDuesComponent)
          },
          {
            path: 'verifications',
            loadComponent: () =>
              import('./features/admin/verifications/admin-verifications.component').then((m) => m.AdminVerificationsComponent)
          },
          {
            path: 'expenses',
            loadComponent: () =>
              import('./features/admin/expenses/admin-expenses.component').then((m) => m.AdminExpensesComponent)
          },
          {
            path: 'expense-summary',
            loadComponent: () =>
              import('./features/admin/expenses/admin-expense-summary.component').then((m) => m.AdminExpenseSummaryComponent)
          },
          {
            path: 'expense-categories',
            loadComponent: () =>
              import('./features/admin/expenses/admin-expense-categories.component').then((m) => m.AdminExpenseCategoriesComponent)
          },
          {
            path: 'loans',
            loadComponent: () =>
              import('./features/admin/loans/admin-loans.component').then((m) => m.AdminLoansComponent)
          },
          {
            path: 'loan-summary',
            loadComponent: () =>
              import('./features/admin/loans/admin-loan-summary.component').then((m) => m.AdminLoanSummaryComponent)
          },
          {
            path: 'fines',
            loadComponent: () =>
              import('./features/admin/fines/admin-fines.component').then((m) => m.AdminFinesComponent)
          },
          {
            path: 'additional-collections',
            loadComponent: () =>
              import('./features/admin/additional-collections/admin-additional-collections.component').then((m) => m.AdminAdditionalCollectionsComponent)
          },
          {
            path: 'settings',
            loadComponent: () =>
              import('./features/admin/settings/admin-settings.component').then((m) => m.AdminSettingsComponent)
          }
        ]
      }
    ]
  },
  {
    path: 'member',
    canActivate: [authGuard, memberGuard],
    loadComponent: () =>
      import('./features/member/shell/member-shell.component').then((m) => m.MemberShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'home' },
      {
        path: 'home',
        loadComponent: () =>
          import('./features/member/home/member-home.component').then((m) => m.MemberHomeComponent)
      },
      {
        path: 'history',
        loadComponent: () =>
          import('./features/member/history/member-history.component').then((m) => m.MemberHistoryComponent)
      },
      {
        path: 'proofs',
        loadComponent: () =>
          import('./features/member/proofs/member-proofs.component').then((m) => m.MemberProofsComponent)
      },
      {
        path: 'expenses',
        loadComponent: () =>
          import('./features/member/expenses/member-expenses.component').then((m) => m.MemberExpensesComponent)
      },
      {
        path: 'loans',
        loadComponent: () =>
          import('./features/member/loans/member-loans.component').then((m) => m.MemberLoansComponent)
      },
      {
        path: 'group-financial',
        loadComponent: () =>
          import('./features/member/group-financial/member-group-financial.component').then((m) => m.MemberGroupFinancialComponent)
      }
    ]
  },
  { path: '**', redirectTo: '' }
];
