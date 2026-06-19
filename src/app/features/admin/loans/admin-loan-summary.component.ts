import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminApi } from '../../../core/services/admin.api';
import { LoanStatus, LoanSummaryDto } from '../../../core/models/loan.models';

@Component({
  selector: 'app-admin-loan-summary',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-loan-summary.component.html',
  styleUrl: './admin-loans.component.scss'
})
export class AdminLoanSummaryComponent {
  private api = inject(AdminApi);

  summary = signal<LoanSummaryDto | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  from = signal<string>('');
  to = signal<string>('');

  maxMonthly = computed(() => Math.max(1, ...(this.summary()?.monthlyDisbursement?.map((m) => m.totalAmount) ?? [1])));

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
    this.api.loanSummary(this.from() || undefined, this.to() || undefined).subscribe({
      next: (s) => { this.summary.set(s); this.loading.set(false); },
      error: (e) => { this.error.set(e?.error?.error ?? e?.error?.message ?? 'Failed to load summary.'); this.loading.set(false); }
    });
  }

  monthLabel(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
  }

  statusClass(s: LoanStatus): string {
    switch (s) {
      case 'Closed': return 'badge-success';
      case 'Active': return 'badge-info';
      case 'PartiallyPaid': return 'badge-warning';
      case 'Overdue': return 'badge-danger';
      default: return 'badge-neutral';
    }
  }

  statusLabel(s: LoanStatus): string {
    return s === 'PartiallyPaid' ? 'Partially Paid' : s;
  }
}
