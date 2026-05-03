import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminApi } from '../../../core/services/admin.api';
import { MonthlyLogDto } from '../../../core/models/admin.models';

@Component({
  selector: 'app-admin-monthly-log',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-monthly-log.component.html',
  styleUrl: './admin-monthly-log.component.scss'
})
export class AdminMonthlyLogComponent {
  private api = inject(AdminApi);
  data = signal<MonthlyLogDto | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  constructor() {
    this.api.monthlyLog().subscribe({
      next: (d) => { this.data.set(d); this.loading.set(false); },
      error: (e) => { this.error.set(e?.error?.message ?? 'Failed to load.'); this.loading.set(false); }
    });
  }

  monthLabel(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { month: 'short' });
  }

  cellChar(status: string): string {
    if (status === 'Paid') return '✅';
    if (status === 'Partial') return '🟡';
    if (status === 'NotApplicable') return '—';
    return '❌';
  }
}
