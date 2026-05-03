import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AdminApi } from '../../../core/services/admin.api';
import {
  DashboardSummaryDto,
  MonthlyCollectionDto,
  PendingDueDto
} from '../../../core/models/admin.models';
import { ExpenseSummaryDto } from '../../../core/models/expense.models';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent {
  private api = inject(AdminApi);
  private router = inject(Router);

  summary = signal<DashboardSummaryDto | null>(null);
  monthly = signal<MonthlyCollectionDto[]>([]);
  dues = signal<PendingDueDto[]>([]);
  expenseSummary = signal<ExpenseSummaryDto | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  priorityFilter = signal<'ALL' | 'HIGH' | 'MED' | 'LOW'>('ALL');

  topDues = computed(() => {
    const filter = this.priorityFilter();
    const list = filter === 'ALL' ? this.dues() : this.dues().filter((d) => d.priority === filter);
    return list.slice(0, 10);
  });

  maxCollected = computed(() => Math.max(1, ...this.monthly().map((m) => Math.max(m.expected, m.collected))));

  netBalanceClass = computed(() => {
    const e = this.expenseSummary();
    if (!e) return '';
    return e.netBalance < 0 ? 'danger' : 'success';
  });

  constructor() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      s: this.api.summary(),
      m: this.api.monthlyCollection(),
      d: this.api.pendingDues(),
      e: this.api.expenseSummary()
    }).subscribe({
      next: ({ s, m, d, e }) => {
        this.summary.set(s);
        this.monthly.set(m);
        this.dues.set(d);
        this.expenseSummary.set(e);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Failed to load dashboard.');
        this.loading.set(false);
      }
    });
  }

  monthLabel(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
  }

  drillToMember(d: PendingDueDto) {
    this.router.navigate(['/admin/members'], { queryParams: { memberId: d.memberId } });
  }

  priorityBadge(p: string): string {
    if (p === 'HIGH') return 'badge-danger';
    if (p === 'MED') return 'badge-warning';
    if (p === 'LOW') return 'badge-success';
    return 'badge-neutral';
  }

  priorityEmoji(p: string): string {
    if (p === 'HIGH') return '🔴';
    if (p === 'MED') return '🟡';
    return '🟢';
  }
}
