import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MemberApi } from '../../../core/services/member.api';
import { MemberHomeSummaryDto, MemberPaymentHistoryItemDto } from '../../../core/models/member.models';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-member-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './member-home.component.html',
  styleUrl: './member-home.component.scss'
})
export class MemberHomeComponent {
  private api = inject(MemberApi);
  summary = signal<MemberHomeSummaryDto | null>(null);
  history = signal<MemberPaymentHistoryItemDto[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  netBalanceClass = computed(() => {
    const s = this.summary();
    if (!s) return '';
    return s.groupNetBalance < 0 ? 'danger' : 'success';
  });

  constructor() {
    forkJoin({
      s: this.api.homeSummary(),
      h: this.api.history()
    }).subscribe({
      next: ({ s, h }) => {
        this.summary.set(s);
        this.history.set(h);
        this.loading.set(false);
      },
      error: (err) => { this.error.set(err?.error?.message ?? 'Failed to load.'); this.loading.set(false); }
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
  overallStatusClass(s: string) {
    if (s === 'OnTrack') return 'badge-success';
    if (s === 'Partial') return 'badge-warning';
    return 'badge-danger';
  }
  overallStatusLabel(s: string) {
    if (s === 'OnTrack') return '🟢 On Track';
    if (s === 'Partial') return '🟡 Partial';
    return '🔴 Overdue';
  }
}
