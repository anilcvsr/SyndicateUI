import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminApi } from '../../../core/services/admin.api';
import { PendingDueDto } from '../../../core/models/admin.models';

@Component({
  selector: 'app-admin-dues',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-dues.component.html',
  styleUrl: './admin-dues.component.scss'
})
export class AdminDuesComponent {
  private api = inject(AdminApi);
  rows = signal<PendingDueDto[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  filter = signal<'ALL' | 'HIGH' | 'MED' | 'LOW'>('ALL');
  sort = signal<'due' | 'months'>('due');

  visible = computed(() => {
    const f = this.filter();
    const sort = this.sort();
    let r = this.rows().slice();
    if (f !== 'ALL') r = r.filter((x) => x.priority === f);
    if (sort === 'due') r.sort((a, b) => b.totalDue - a.totalDue);
    else r.sort((a, b) => b.monthsPending - a.monthsPending);
    return r;
  });

  totalDue = computed(() => this.visible().reduce((acc, r) => acc + r.totalDue, 0));

  constructor() {
    this.api.pendingDues().subscribe({
      next: (r) => { this.rows.set(r); this.loading.set(false); },
      error: (e) => { this.error.set(e?.error?.message ?? 'Failed to load.'); this.loading.set(false); }
    });
  }

  reminderLink(d: PendingDueDto): string {
    const msg = encodeURIComponent(`Hi ${d.memberName}, friendly reminder — ${d.monthsPending} month(s) pending, total ₹${d.totalDue}. Please settle at your convenience.`);
    return `https://wa.me/?text=${msg}`;
  }

  priorityBadge(p: string) {
    if (p === 'HIGH') return 'badge-danger';
    if (p === 'MED') return 'badge-warning';
    if (p === 'LOW') return 'badge-success';
    return 'badge-neutral';
  }
}
