import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MemberApi } from '../../../core/services/member.api';
import { GroupFinancialDetailsDto } from '../../../core/models/member.models';

@Component({
  selector: 'app-member-group-financial',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './member-group-financial.component.html',
  styleUrl: './member-group-financial.component.scss'
})
export class MemberGroupFinancialComponent {
  private api = inject(MemberApi);

  data = signal<GroupFinancialDetailsDto | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  readonly pageSize = 10;

  currentPage = signal(1);

  totalPages = computed(() => this.data()?.totalPages ?? 1);

  constructor() {
    this.load(1);
  }

  load(page: number) {
    this.loading.set(true);
    this.error.set(null);
    this.api.groupFinancialDetails(page, this.pageSize).subscribe({
      next: (d) => { this.data.set(d); this.currentPage.set(d.page); this.loading.set(false); },
      error: (e) => { this.error.set(e?.error?.message ?? 'Failed to load group financial details.'); this.loading.set(false); }
    });
  }

  goToPage(p: number) {
    if (p < 1 || p > this.totalPages()) return;
    this.load(p);
  }

  hasOutstanding(totalOutstanding: number): boolean {
    return totalOutstanding > 0;
  }
}
