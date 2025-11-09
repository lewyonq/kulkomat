import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { loginRedirectGuard } from './guards/login-redirect.guard';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/dashboard/dashboard.component').then((m) => m.DashboardComponent),
    canActivate: [authGuard],
  },
  {
    path: 'coupons',
    loadComponent: () =>
      import('./pages/coupons/coupons.component').then((m) => m.CouponsComponent),
    canActivate: [authGuard],
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./pages/profile/profile.component').then((m) => m.ProfileComponent),
    canActivate: [authGuard],
  },
  {
    path: 'history',
    loadComponent: () =>
      import('./pages/history/history.component').then((m) => m.HistoryComponent),
    canActivate: [authGuard],
  },
  {
    path: 'contact',
    loadComponent: () => import('./pages/contact/contact').then((m) => m.Contact),
    canActivate: [authGuard],
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent),
    canActivate: [loginRedirectGuard],
  },
  {
    path: 'auth/callback',
    loadComponent: () =>
      import('./pages/auth-callback/auth-callback.component').then((m) => m.AuthCallbackComponent),
  },
  // Admin Panel Routes
  {
    path: 'admin/login',
    loadComponent: () =>
      import('./pages/admin/login/admin-login-page.component').then(
        (m) => m.AdminLoginPageComponent,
      ),
    canActivate: [loginRedirectGuard],
  },
  {
    path: 'admin/dashboard',
    loadComponent: () =>
      import('./pages/admin/dashboard/admin-dashboard-page.component').then(
        (m) => m.AdminDashboardPageComponent,
      ),
    canActivate: [adminGuard],
  },
  {
    path: 'admin/customer/:id/history',
    loadComponent: () =>
      import('./pages/admin/customer-history-page/customer-history-page').then(
        (m) => m.CustomerHistoryPage,
      ),
    canActivate: [adminGuard],
  },
  {
    path: 'admin/customer/:id/add-coupon',
    loadComponent: () =>
      import('./pages/admin/add-coupon/admin-add-coupon-page.component').then(
        (m) => m.AdminAddCouponPageComponent,
      ),
    canActivate: [adminGuard],
  },
];
