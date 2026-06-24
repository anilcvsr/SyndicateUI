import { Component, computed, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { MemberApi } from '../../../core/services/member.api';
import { filter, Subscription } from 'rxjs';

@Component({
  selector: 'app-member-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './member-shell.component.html',
  styleUrl: './member-shell.component.scss'
})
export class MemberShellComponent implements OnInit, OnDestroy {
  auth = inject(AuthService);
  private api = inject(MemberApi);
  private router = inject(Router);
  private routerSub?: Subscription;

  mobileNavOpen = signal(false);
  private allowSubmission = signal(false);

  nav = computed(() => [
    { path: '/member/home', label: 'Home', icon: '🏠' },
    { path: '/member/history', label: 'Payment History', icon: '📜' },
    ...(this.allowSubmission()
      ? [{ path: '/member/proofs', label: 'Upload Proof', icon: '📎' }]
      : []),
    { path: '/member/expenses', label: 'Group Expenses', icon: '💸' },
    { path: '/member/loans', label: 'My Loans', icon: '🏦' },
    { path: '/member/group-financial', label: 'Group Financial Details', icon: '📊' }
  ]);

  ngOnInit() {
    this.routerSub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => this.mobileNavOpen.set(false));
  }

  ngOnDestroy() {
    this.routerSub?.unsubscribe();
  }

  constructor() {
    this.api.homeSummary().subscribe({
      next: (s) => this.allowSubmission.set(s.allowMemberPaymentSubmission),
      error: () => this.allowSubmission.set(false)
    });
  }

  toggleNav() { this.mobileNavOpen.update(v => !v); }
  logout() { this.auth.logout(); }
}
