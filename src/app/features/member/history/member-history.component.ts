import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MemberApi } from '../../../core/services/member.api';
import { MemberPaymentHistoryItemDto } from '../../../core/models/member.models';

@Component({
  selector: 'app-member-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './member-history.component.html',
  styleUrl: './member-history.component.scss'
})
export class MemberHistoryComponent {
  private api = inject(MemberApi);
  rows = signal<MemberPaymentHistoryItemDto[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  constructor() {
    this.api.history().subscribe({
      next: (r) => { this.rows.set(r); this.loading.set(false); },
      error: (e) => { this.error.set(e?.error?.message ?? 'Failed to load.'); this.loading.set(false); }
    });
  }

  statusBadge(s: string) {
    if (s === 'Paid') return 'badge-success';
    if (s === 'Partial') return 'badge-warning';
    if (s === 'NotApplicable') return 'badge-neutral';
    return 'badge-danger';
  }
  statusChar(s: string) {
    if (s === 'Paid') return '✅';
    if (s === 'Partial') return '🟡';
    if (s === 'NotApplicable') return '—';
    return '❌';
  }
}
