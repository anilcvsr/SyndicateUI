import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { MemberApi } from '../../../core/services/member.api';

@Component({
  selector: 'app-member-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './member-shell.component.html',
  styleUrl: './member-shell.component.scss'
})
export class MemberShellComponent {
  auth = inject(AuthService);
  private api = inject(MemberApi);

  private allowSubmission = signal(false);

  nav = computed(() => [
    { path: '/member/home', label: 'Home', icon: '🏠' },
    { path: '/member/history', label: 'Payment History', icon: '📜' },
    ...(this.allowSubmission()
      ? [{ path: '/member/proofs', label: 'Upload Proof', icon: '📎' }]
      : []),
    { path: '/member/expenses', label: 'Group Expenses', icon: '💸' },
    { path: '/member/loans', label: 'My Loans', icon: '🏦' }
  ]);

  constructor() {
    this.api.homeSummary().subscribe({
      next: (s) => this.allowSubmission.set(s.allowMemberPaymentSubmission),
      error: () => this.allowSubmission.set(false)
    });
  }

  logout() { this.auth.logout(); }
}
