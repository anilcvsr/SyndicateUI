import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { AdminApi } from '../../../core/services/admin.api';
import { MemberDueSummaryDto, PendingDueDto } from '../../../core/models/admin.models';

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

  filterSearch = signal('');
  filterPriority = signal<'ALL' | 'HIGH' | 'MED' | 'LOW'>('ALL');
  filterMinAmount = signal<number | null>(null);
  sort = signal<'due' | 'months'>('due');

  selectedIds = signal<Set<number>>(new Set());

  showModal = signal(false);
  previews = signal<MemberDueSummaryDto[]>([]);
  loadingPreviews = signal(false);
  sending = signal(false);
  sendError = signal<string | null>(null);
  sendSuccess = signal<string | null>(null);

  visible = computed(() => {
    const search = this.filterSearch().toLowerCase().trim();
    const priority = this.filterPriority();
    const minAmount = this.filterMinAmount();
    const sortKey = this.sort();
    let r = this.rows().slice();
    if (priority !== 'ALL') r = r.filter(x => x.priority === priority);
    if (search) r = r.filter(x =>
      x.memberName.toLowerCase().includes(search) || x.memberCode.toLowerCase().includes(search)
    );
    if (minAmount != null && minAmount > 0) r = r.filter(x => x.totalDue >= minAmount);
    return sortKey === 'due'
      ? r.sort((a, b) => b.totalDue - a.totalDue)
      : r.sort((a, b) => b.monthsPending - a.monthsPending);
  });

  grandTotal = computed(() => this.rows().reduce((acc, r) => acc + r.totalDue, 0));
  visibleTotal = computed(() => this.visible().reduce((acc, r) => acc + r.totalDue, 0));
  selectedCount = computed(() => this.selectedIds().size);
  previewTotal = computed(() => this.previews().reduce((acc, p) => acc + p.totalPending, 0));

  allVisibleSelected = computed(() => {
    const vis = this.visible();
    if (vis.length === 0) return false;
    const sel = this.selectedIds();
    return vis.every(r => sel.has(r.memberId));
  });

  constructor() {
    this.api.pendingDues().subscribe({
      next: r => { this.rows.set(r); this.loading.set(false); },
      error: e => { this.error.set(e?.error?.message ?? 'Failed to load.'); this.loading.set(false); }
    });
  }

  isSelected(id: number): boolean {
    return this.selectedIds().has(id);
  }

  toggleSelect(id: number): void {
    this.selectedIds.update(s => {
      const ns = new Set(s);
      if (ns.has(id)) ns.delete(id); else ns.add(id);
      return ns;
    });
  }

  toggleAll(): void {
    const vis = this.visible();
    const sel = this.selectedIds();
    if (vis.every(r => sel.has(r.memberId))) {
      this.selectedIds.update(s => { const ns = new Set(s); vis.forEach(r => ns.delete(r.memberId)); return ns; });
    } else {
      this.selectedIds.update(s => { const ns = new Set(s); vis.forEach(r => ns.add(r.memberId)); return ns; });
    }
  }

  openModal(): void {
    const ids = Array.from(this.selectedIds());
    if (ids.length === 0) return;
    this.showModal.set(true);
    this.loadingPreviews.set(true);
    this.previews.set([]);
    this.sendError.set(null);
    this.sendSuccess.set(null);

    forkJoin(ids.map(id => this.api.getMemberDueSummary(id))).subscribe({
      next: summaries => { this.previews.set(summaries); this.loadingPreviews.set(false); },
      error: () => { this.sendError.set('Failed to load due summaries. Please try again.'); this.loadingPreviews.set(false); }
    });
  }

  sendAll(): void {
    const ids = Array.from(this.selectedIds());
    this.sending.set(true);
    this.sendError.set(null);
    this.api.sendReminders({ memberIds: ids, channel: 'inapp' }).subscribe({
      next: result => {
        this.sending.set(false);
        if (result.failed.length > 0) {
          this.sendError.set(`Sent to ${result.totalSent} member(s). Failed for ${result.failed.length} member(s).`);
        } else {
          this.sendSuccess.set(`Reminders sent to ${result.totalSent} member(s).`);
          this.selectedIds.set(new Set());
          setTimeout(() => this.closeModal(), 1800);
        }
      },
      error: () => { this.sending.set(false); this.sendError.set('Failed to send reminders. Please try again.'); }
    });
  }

  closeModal(): void {
    this.showModal.set(false);
    this.previews.set([]);
    this.sendError.set(null);
    this.sendSuccess.set(null);
  }

  priorityBadge(p: string): string {
    if (p === 'HIGH') return 'badge-danger';
    if (p === 'MED') return 'badge-warning';
    return 'badge-success';
  }
}
