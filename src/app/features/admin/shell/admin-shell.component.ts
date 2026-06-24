import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { filter, Subscription } from 'rxjs';

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './admin-shell.component.html',
  styleUrl: './admin-shell.component.scss'
})
export class AdminShellComponent implements OnInit, OnDestroy {
  auth = inject(AuthService);
  private router = inject(Router);
  private routerSub?: Subscription;

  menuOpen = signal(false);

  nav = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/admin/members', label: 'Members', icon: '👥' },
    { path: '/admin/payments', label: 'Record Payment', icon: '💵' },
    { path: '/admin/monthly-log', label: 'Monthly Log', icon: '🗓️' },
    { path: '/admin/dues', label: 'Pending Dues', icon: '⚠️' },
    { path: '/admin/verifications', label: 'Verifications', icon: '📎' },
    { path: '/admin/expenses', label: 'Expenses', icon: '💸' },
    { path: '/admin/expense-summary', label: 'Expense Summary', icon: '📈' },
    { path: '/admin/expense-categories', label: 'Expense Categories', icon: '🏷️' },
    { path: '/admin/loans', label: 'Loans', icon: '🏦' },
    { path: '/admin/loan-summary', label: 'Loan Summary', icon: '📉' },
    { path: '/admin/fines', label: 'Fines', icon: '🚨' },
    { path: '/admin/additional-collections', label: 'Additional Collections', icon: '💰' },
    { path: '/admin/settings', label: 'Settings', icon: '⚙️' },
    { path: '/admin/registration-requests', label: 'New Requests', icon: '📩' }
  ];

  ngOnInit() {
    this.routerSub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => this.menuOpen.set(false));
  }

  ngOnDestroy() {
    this.routerSub?.unsubscribe();
  }

  toggleMenu() { this.menuOpen.update(v => !v); }
  closeMenu() { this.menuOpen.set(false); }
  logout() { this.auth.logout(); }
}
