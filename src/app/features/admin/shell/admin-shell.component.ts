import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './admin-shell.component.html',
  styleUrl: './admin-shell.component.scss'
})
export class AdminShellComponent {
  auth = inject(AuthService);
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
    { path: '/admin/settings', label: 'Settings', icon: '⚙️' }
  ];

  logout() { this.auth.logout(); }
}
