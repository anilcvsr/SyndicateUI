import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminApi } from '../../../core/services/admin.api';
import { ExpenseCategoryDto } from '../../../core/models/expense.models';

@Component({
  selector: 'app-admin-expense-categories',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './admin-expense-categories.component.html',
  styleUrl: './admin-expenses.component.scss'
})
export class AdminExpenseCategoriesComponent {
  private api = inject(AdminApi);
  private fb = inject(FormBuilder);

  categories = signal<ExpenseCategoryDto[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  editing = signal<ExpenseCategoryDto | null>(null);
  saving = signal(false);

  addForm = this.fb.group({
    name: this.fb.control<string>('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(100)] })
  });

  editForm = this.fb.group({
    name: this.fb.control<string>('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(100)] }),
    isActive: this.fb.control<boolean>(true, { nonNullable: true })
  });

  constructor() { this.load(); }

  load() {
    this.loading.set(true);
    this.error.set(null);
    this.api.listExpenseCategories().subscribe({
      next: (c) => { this.categories.set(c); this.loading.set(false); },
      error: (e) => { this.error.set(e?.error?.message ?? 'Failed to load.'); this.loading.set(false); }
    });
  }

  add() {
    if (this.addForm.invalid || this.saving()) { this.addForm.markAllAsTouched(); return; }
    this.saving.set(true);
    this.error.set(null);
    this.success.set(null);
    this.api.createExpenseCategory({ name: this.addForm.controls.name.value }).subscribe({
      next: () => {
        this.saving.set(false);
        this.success.set('Category added.');
        this.addForm.reset({ name: '' });
        this.load();
      },
      error: (e) => { this.saving.set(false); this.error.set(e?.error?.error ?? e?.error?.message ?? 'Failed to add.'); }
    });
  }

  openEdit(c: ExpenseCategoryDto) {
    this.editing.set(c);
    this.error.set(null); this.success.set(null);
    this.editForm.reset({ name: c.name, isActive: c.isActive });
  }

  cancelEdit() { this.editing.set(null); }

  saveEdit() {
    const c = this.editing();
    if (!c || this.editForm.invalid || this.saving()) { this.editForm.markAllAsTouched(); return; }
    this.saving.set(true);
    const v = this.editForm.getRawValue();
    this.api.updateExpenseCategory(c.categoryId, { name: v.name, isActive: v.isActive }).subscribe({
      next: () => { this.saving.set(false); this.success.set('Category updated.'); this.editing.set(null); this.load(); },
      error: (e) => { this.saving.set(false); this.error.set(e?.error?.error ?? e?.error?.message ?? 'Update failed.'); }
    });
  }

  toggleActive(c: ExpenseCategoryDto) {
    this.saving.set(true);
    this.api.updateExpenseCategory(c.categoryId, { name: c.name, isActive: !c.isActive }).subscribe({
      next: () => { this.saving.set(false); this.load(); },
      error: (e) => { this.saving.set(false); this.error.set(e?.error?.error ?? 'Toggle failed.'); }
    });
  }
}
