import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminApi } from '../../../core/services/admin.api';
import { ExpenseSummaryDto } from '../../../core/models/expense.models';

@Component({
  selector: 'app-admin-expense-summary',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-expense-summary.component.html',
  styleUrl: './admin-expenses.component.scss'
})
export class AdminExpenseSummaryComponent {
  private api = inject(AdminApi);

  summary = signal<ExpenseSummaryDto | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  from = signal<string>('');
  to = signal<string>('');

  maxMonthly = computed(() => Math.max(1, ...this.summary()?.monthlyTrend?.map((m) => m.totalAmount) ?? [1]));
  maxCvE = computed(() => {
    const cve = this.summary()?.collectionVsExpense ?? [];
    return Math.max(1, ...cve.flatMap((x) => [x.collected, x.expenses]));
  });

  constructor() {
    const now = new Date();
    const y = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    this.from.set(`${y}-04-01`);
    this.to.set(`${y + 1}-03-31`);
    this.load();
  }

  load() {
    this.loading.set(true);
    this.error.set(null);
    this.api.expenseSummary(this.from() || undefined, this.to() || undefined).subscribe({
      next: (s) => { this.summary.set(s); this.loading.set(false); },
      error: (e) => { this.error.set(e?.error?.message ?? 'Failed to load summary.'); this.loading.set(false); }
    });
  }

  monthLabel(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
  }

  categoryColor(id: number): string {
    const palette = ['#6366f1', '#f97316', '#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#14b8a6', '#ec4899', '#84cc16'];
    return palette[id % palette.length];
  }

  netBalanceClass(): string {
    const s = this.summary();
    if (!s) return '';
    return s.netBalance < 0 ? 'danger' : 'success';
  }
}
