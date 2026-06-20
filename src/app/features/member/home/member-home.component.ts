import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MemberApi } from '../../../core/services/member.api';
import { MemberFineViewDto, MemberHomeSummaryDto, MemberPaymentHistoryItemDto, NotificationDto } from '../../../core/models/member.models';
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
  fines = signal<MemberFineViewDto[]>([]);
  notifications = signal<NotificationDto[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  unreadNotifications = computed(() => this.notifications().filter(n => !n.isRead));
  totalFineDue = computed(() => this.fines().reduce((s, f) => s + (f.fineAmount - f.waivedAmount), 0));

  netBalanceClass = computed(() => {
    const s = this.summary();
    if (!s) return '';
    return s.groupNetBalance < 0 ? 'danger' : 'success';
  });

  constructor() {
    forkJoin({
      s: this.api.homeSummary(),
      h: this.api.history(),
      f: this.api.myFines(),
      n: this.api.notifications()
    }).subscribe({
      next: ({ s, h, f, n }) => {
        this.summary.set(s);
        this.history.set(h);
        this.fines.set(f);
        this.notifications.set(n);
        this.loading.set(false);
      },
      error: (err) => { this.error.set(err?.error?.message ?? 'Failed to load.'); this.loading.set(false); }
    });
  }

  dismissNotification(notificationId: number) {
    this.api.markNotificationRead(notificationId).subscribe();
    this.notifications.update(list => list.map(n => n.notificationId === notificationId ? { ...n, isRead: true } : n));
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
