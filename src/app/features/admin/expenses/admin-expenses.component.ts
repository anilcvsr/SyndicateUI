import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminApi } from '../../../core/services/admin.api';
import {
  ExpenseAuditEntryDto,
  ExpenseCategoryDto,
  ExpenseDto,
  ExpenseListResultDto,
  ExpenseSummaryDto
} from '../../../core/models/expense.models';

@Component({
  selector: 'app-admin-expenses',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink],
  templateUrl: './admin-expenses.component.html',
  styleUrl: './admin-expenses.component.scss'
})
export class AdminExpensesComponent {
  private api = inject(AdminApi);
  private fb = inject(FormBuilder);

  categories = signal<ExpenseCategoryDto[]>([]);
  result = signal<ExpenseListResultDto | null>(null);
  summary = signal<ExpenseSummaryDto | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  // Filters
  filter = this.fb.group({
    from: this.fb.control<string | null>(null),
    to: this.fb.control<string | null>(null),
    categoryIds: this.fb.control<number[]>([]),
    minAmount: this.fb.control<number | null>(null),
    maxAmount: this.fb.control<number | null>(null),
    q: this.fb.control<string>(''),
    page: this.fb.control<number>(1, { nonNullable: true }),
    pageSize: this.fb.control<number>(25, { nonNullable: true })
  });

  // Add / Edit form
  showForm = signal(false);
  editing = signal<ExpenseDto | null>(null);
  saving = signal(false);
  formError = signal<string | null>(null);
  formSuccess = signal<string | null>(null);

  form = this.fb.group({
    expenseDate: this.fb.control<string>(new Date().toISOString().slice(0, 10), { nonNullable: true, validators: [Validators.required] }),
    categoryId: this.fb.control<number | null>(null, { validators: [Validators.required] }),
    amount: this.fb.control<number | null>(null, { validators: [Validators.required, Validators.min(0.01), Validators.max(1000000)] }),
    description: this.fb.control<string>('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(500)] })
  });

  // History drawer
  historyFor = signal<ExpenseDto | null>(null);
  history = signal<ExpenseAuditEntryDto[]>([]);
  historyLoading = signal(false);

  // Delete confirm
  deleting = signal<ExpenseDto | null>(null);
  deleteReason = signal('');

  activeCategories = computed(() => this.categories().filter((c) => c.isActive));
  today = new Date().toISOString().slice(0, 10);

  totalPages = computed(() => {
    const r = this.result();
    if (!r) return 1;
    return Math.max(1, Math.ceil(r.totalCount / r.pageSize));
  });

  constructor() {
    this.loadCategories();
    this.applyDefaultFyDates();
    this.loadAll();
  }

  private applyDefaultFyDates() {
    const now = new Date();
    const y = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    const from = `${y}-04-01`;
    const to = `${y + 1}-03-31`;
    this.filter.patchValue({ from, to });
  }

  loadCategories() {
    this.api.listExpenseCategories().subscribe({
      next: (c) => this.categories.set(c),
      error: () => { /* non-fatal */ }
    });
  }

  loadAll() {
    this.loading.set(true);
    this.error.set(null);
    const v = this.filter.getRawValue();
    const query = {
      from: v.from || undefined,
      to: v.to || undefined,
      categoryIds: v.categoryIds && v.categoryIds.length ? v.categoryIds : undefined,
      minAmount: v.minAmount ?? undefined,
      maxAmount: v.maxAmount ?? undefined,
      q: v.q || undefined,
      page: v.page,
      pageSize: v.pageSize
    };
    this.api.listExpenses(query).subscribe({
      next: (r) => { this.result.set(r); this.loading.set(false); },
      error: (e) => { this.error.set(e?.error?.error ?? e?.error?.message ?? 'Failed to load expenses.'); this.loading.set(false); }
    });
    this.api.expenseSummary(v.from || undefined, v.to || undefined).subscribe({
      next: (s) => this.summary.set(s),
      error: () => { /* non-fatal */ }
    });
  }

  applyFilters() { this.filter.patchValue({ page: 1 }); this.loadAll(); }
  resetFilters() {
    this.filter.reset({ from: null, to: null, categoryIds: [], minAmount: null, maxAmount: null, q: '', page: 1, pageSize: 25 });
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

  // ----- Form -----
  openAdd() {
    this.editing.set(null);
    this.formError.set(null);
    this.formSuccess.set(null);
    this.form.reset({
      expenseDate: new Date().toISOString().slice(0, 10),
      categoryId: null,
      amount: null,
      description: ''
    });
    this.showForm.set(true);
  }

  openEdit(e: ExpenseDto) {
    this.editing.set(e);
    this.formError.set(null);
    this.formSuccess.set(null);
    this.form.reset({
      expenseDate: e.expenseDate.slice(0, 10),
      categoryId: e.categoryId,
      amount: e.amount,
      description: e.description
    });
    this.showForm.set(true);
  }

  cancelForm() {
    this.showForm.set(false);
    this.editing.set(null);
    this.formError.set(null);
  }

  saveForm() {
    if (this.form.invalid || this.saving()) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    this.formError.set(null);
    const v = this.form.getRawValue();
    const existing = this.editing();
    if (existing) {
      this.api.updateExpense(existing.expenseId, {
        expenseDate: v.expenseDate,
        categoryId: v.categoryId!,
        amount: v.amount!,
        description: v.description,
        rowVersion: existing.rowVersion
      }).subscribe({
        next: () => {
          this.saving.set(false);
          this.formSuccess.set('Expense updated.');
          this.showForm.set(false);
          this.editing.set(null);
          this.loadAll();
        },
        error: (e) => {
          this.saving.set(false);
          this.formError.set(e?.error?.error ?? e?.error?.message ?? 'Failed to update expense.');
        }
      });
    } else {
      this.api.createExpense({
        expenseDate: v.expenseDate,
        categoryId: v.categoryId!,
        amount: v.amount!,
        description: v.description
      }).subscribe({
        next: () => {
          this.saving.set(false);
          this.formSuccess.set('Expense recorded.');
          this.showForm.set(false);
          this.loadAll();
        },
        error: (e) => {
          this.saving.set(false);
          this.formError.set(e?.error?.error ?? e?.error?.message ?? 'Failed to record expense.');
        }
      });
    }
  }

  // ----- History -----
  openHistory(e: ExpenseDto) {
    this.historyFor.set(e);
    this.history.set([]);
    this.historyLoading.set(true);
    this.api.expenseHistory(e.expenseId).subscribe({
      next: (h) => { this.history.set(h); this.historyLoading.set(false); },
      error: () => { this.historyLoading.set(false); }
    });
  }
  closeHistory() { this.historyFor.set(null); this.history.set([]); }

  // ----- Delete -----
  confirmDelete(e: ExpenseDto) { this.deleting.set(e); this.deleteReason.set(''); }
  cancelDelete() { this.deleting.set(null); this.deleteReason.set(''); }
  performDelete() {
    const e = this.deleting();
    if (!e) return;
    this.api.deleteExpense(e.expenseId, this.deleteReason() || null).subscribe({
      next: () => { this.deleting.set(null); this.deleteReason.set(''); this.loadAll(); },
      error: (err) => { this.formError.set(err?.error?.error ?? 'Failed to delete.'); this.deleting.set(null); }
    });
  }

  // ----- Helpers -----
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
