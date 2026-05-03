import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MemberApi } from '../../../core/services/member.api';
import {
  ExpenseCategoryDto,
  ExpenseListResultDto,
  ExpenseSummaryDto
} from '../../../core/models/expense.models';

@Component({
  selector: 'app-member-expenses',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './member-expenses.component.html',
  styleUrl: './member-expenses.component.scss'
})
export class MemberExpensesComponent {
  private api = inject(MemberApi);
  private fb = inject(FormBuilder);

  categories = signal<ExpenseCategoryDto[]>([]);
  result = signal<ExpenseListResultDto | null>(null);
  summary = signal<ExpenseSummaryDto | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  filter = this.fb.group({
    from: this.fb.control<string | null>(null),
    to: this.fb.control<string | null>(null),
    categoryIds: this.fb.control<number[]>([]),
    q: this.fb.control<string>(''),
    page: this.fb.control<number>(1, { nonNullable: true }),
    pageSize: this.fb.control<number>(25, { nonNullable: true })
  });

  activeCategories = computed(() => this.categories().filter((c) => c.isActive));

  totalPages = computed(() => {
    const r = this.result();
    if (!r) return 1;
    return Math.max(1, Math.ceil(r.totalCount / r.pageSize));
  });

  constructor() {
    this.applyDefaultFyDates();
    this.api.listExpenseCategories().subscribe({
      next: (c) => this.categories.set(c),
      error: () => { /* non-fatal */ }
    });
    this.loadAll();
  }

  private applyDefaultFyDates() {
    const now = new Date();
    const y = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    this.filter.patchValue({ from: `${y}-04-01`, to: `${y + 1}-03-31` });
  }

  loadAll() {
    this.loading.set(true);
    this.error.set(null);
    const v = this.filter.getRawValue();
    const query = {
      from: v.from || undefined,
      to: v.to || undefined,
      categoryIds: v.categoryIds && v.categoryIds.length ? v.categoryIds : undefined,
      q: v.q || undefined,
      page: v.page,
      pageSize: v.pageSize
    };
    this.api.listExpenses(query).subscribe({
      next: (r) => { this.result.set(r); this.loading.set(false); },
      error: (e) => { this.error.set(e?.error?.message ?? 'Failed to load expenses.'); this.loading.set(false); }
    });
    this.api.expenseSummary(v.from || undefined, v.to || undefined).subscribe({
      next: (s) => this.summary.set(s),
      error: () => { /* non-fatal */ }
    });
  }

  applyFilters() { this.filter.patchValue({ page: 1 }); this.loadAll(); }
  resetFilters() {
    this.filter.reset({ from: null, to: null, categoryIds: [], q: '', page: 1, pageSize: 25 });
    this.applyDefaultFyDates();
    this.loadAll();
  }

  goToPage(p: number) {
    if (p < 1 || p > this.totalPages()) return;
    this.filter.patchValue({ page: p });
    this.loadAll();
  }

  toggleCategoryFilter(id: number) {
    const current = this.filter.controls.categoryIds.value ?? [];
    const set = new Set(current);
    if (set.has(id)) set.delete(id); else set.add(id);
    this.filter.patchValue({ categoryIds: [...set] });
  }

  isCategoryFilterSelected(id: number): boolean {
    return (this.filter.controls.categoryIds.value ?? []).includes(id);
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
