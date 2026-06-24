import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminApi } from '../../../core/services/admin.api';
import {
  AdditionalCollectionAuditEntryDto,
  AdditionalCollectionCategoryDto,
  AdditionalCollectionDto,
  AdditionalCollectionListResultDto
} from '../../../core/models/additional-collection.models';
import { MemberDto } from '../../../core/models/admin.models';

@Component({
  selector: 'app-admin-additional-collections',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './admin-additional-collections.component.html',
  styleUrl: './admin-additional-collections.component.scss'
})
export class AdminAdditionalCollectionsComponent {
  private api = inject(AdminApi);
  private fb = inject(FormBuilder);

  categories = signal<AdditionalCollectionCategoryDto[]>([]);
  members = signal<MemberDto[]>([]);
  result = signal<AdditionalCollectionListResultDto | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  activeCategories = computed(() => this.categories().filter(c => c.isActive));

  // Filters
  filter = this.fb.group({
    from: this.fb.control<string | null>(null),
    to: this.fb.control<string | null>(null),
    categoryIds: this.fb.control<number[]>([]),
    q: this.fb.control<string>(''),
    page: this.fb.control<number>(1, { nonNullable: true }),
    pageSize: this.fb.control<number>(25, { nonNullable: true })
  });

  totalPages = computed(() => {
    const r = this.result();
    if (!r) return 1;
    return Math.max(1, Math.ceil(r.totalCount / r.pageSize));
  });

  totalAmount = computed(() => {
    const r = this.result();
    if (!r) return 0;
    return r.items.reduce((sum, x) => sum + x.amount, 0);
  });

  // Add / Edit form
  showForm = signal(false);
  editing = signal<AdditionalCollectionDto | null>(null);
  saving = signal(false);
  formError = signal<string | null>(null);
  formSuccess = signal<string | null>(null);
  today = new Date().toISOString().slice(0, 10);

  form = this.fb.group({
    collectionDate: this.fb.control<string>(this.today, { nonNullable: true, validators: [Validators.required] }),
    categoryId: this.fb.control<number | null>(null, { validators: [Validators.required] }),
    amount: this.fb.control<number | null>(null, { validators: [Validators.required, Validators.min(0.01)] }),
    description: this.fb.control<string | null>(null),
    memberId: this.fb.control<number | null>(null),
    referenceNumber: this.fb.control<string | null>(null)
  });

  // History
  historyFor = signal<AdditionalCollectionDto | null>(null);
  history = signal<AdditionalCollectionAuditEntryDto[]>([]);
  historyLoading = signal(false);

  // Delete confirm
  deleting = signal<AdditionalCollectionDto | null>(null);

  // Category management
  showCategoryPanel = signal(false);
  allCategories = signal<AdditionalCollectionCategoryDto[]>([]);
  catLoading = signal(false);
  catError = signal<string | null>(null);
  catSuccess = signal<string | null>(null);
  catSaving = signal(false);
  editingCat = signal<AdditionalCollectionCategoryDto | null>(null);

  addCatForm = this.fb.group({
    name: this.fb.control<string>('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(100)] })
  });
  editCatForm = this.fb.group({
    name: this.fb.control<string>('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(100)] }),
    isActive: this.fb.control<boolean>(true, { nonNullable: true })
  });

  constructor() {
    this.loadCategories();
    this.loadMembers();
    this.loadAll();
  }

  loadCategories() {
    this.api.listAdditionalCollectionCategories(false).subscribe({
      next: c => this.categories.set(c),
      error: () => {}
    });
  }

  loadMembers() {
    this.api.listMembers(false).subscribe({
      next: m => this.members.set(m),
      error: () => {}
    });
  }

  loadAll() {
    this.loading.set(true);
    this.error.set(null);
    const v = this.filter.getRawValue();
    this.api.listAdditionalCollections({
      from: v.from || undefined,
      to: v.to || undefined,
      categoryIds: v.categoryIds && v.categoryIds.length ? v.categoryIds : undefined,
      q: v.q || undefined,
      page: v.page,
      pageSize: v.pageSize
    }).subscribe({
      next: r => { this.result.set(r); this.loading.set(false); },
      error: e => {
        this.error.set(e?.error?.error ?? e?.error?.message ?? 'Failed to load.');
        this.loading.set(false);
      }
    });
  }

  applyFilters() { this.filter.patchValue({ page: 1 }); this.loadAll(); }
  resetFilters() {
    this.filter.reset({ from: null, to: null, categoryIds: [], q: '', page: 1, pageSize: 25 });
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

  // ----- Collection Form -----
  openAdd() {
    this.editing.set(null);
    this.formError.set(null);
    this.formSuccess.set(null);
    this.form.reset({ collectionDate: this.today, categoryId: null, amount: null, description: null, memberId: null, referenceNumber: null });
    this.showForm.set(true);
  }

  openEdit(e: AdditionalCollectionDto) {
    this.editing.set(e);
    this.formError.set(null);
    this.formSuccess.set(null);
    this.form.reset({
      collectionDate: e.collectionDate.slice(0, 10),
      categoryId: e.categoryId,
      amount: e.amount,
      description: e.description,
      memberId: e.memberId,
      referenceNumber: e.referenceNumber
    });
    this.showForm.set(true);
  }

  cancelForm() { this.showForm.set(false); this.editing.set(null); this.formError.set(null); }

  saveForm() {
    if (this.form.invalid || this.saving()) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    this.formError.set(null);
    const v = this.form.getRawValue();
    const existing = this.editing();
    const payload = {
      collectionDate: v.collectionDate,
      categoryId: v.categoryId!,
      amount: v.amount!,
      description: v.description || null,
      memberId: v.memberId || null,
      referenceNumber: v.referenceNumber || null
    };
    const call = existing
      ? this.api.updateAdditionalCollection(existing.collectionId, payload)
      : this.api.createAdditionalCollection(payload);

    call.subscribe({
      next: () => {
        this.saving.set(false);
        this.formSuccess.set(existing ? 'Entry updated.' : 'Entry recorded.');
        this.showForm.set(false);
        this.editing.set(null);
        this.loadAll();
      },
      error: e => {
        this.saving.set(false);
        this.formError.set(e?.error?.error ?? e?.error?.message ?? 'Save failed.');
      }
    });
  }

  // ----- History -----
  openHistory(e: AdditionalCollectionDto) {
    this.historyFor.set(e);
    this.history.set([]);
    this.historyLoading.set(true);
    this.api.additionalCollectionHistory(e.collectionId).subscribe({
      next: h => { this.history.set(h); this.historyLoading.set(false); },
      error: () => { this.historyLoading.set(false); }
    });
  }
  closeHistory() { this.historyFor.set(null); this.history.set([]); }

  // ----- Delete -----
  confirmDelete(e: AdditionalCollectionDto) { this.deleting.set(e); }
  cancelDelete() { this.deleting.set(null); }
  performDelete() {
    const e = this.deleting();
    if (!e) return;
    this.api.deleteAdditionalCollection(e.collectionId).subscribe({
      next: () => { this.deleting.set(null); this.loadAll(); },
      error: err => { this.error.set(err?.error?.error ?? 'Delete failed.'); this.deleting.set(null); }
    });
  }

  // ----- Category management -----
  openCategoryPanel() {
    this.showCategoryPanel.set(true);
    this.loadAllCategories();
  }
  closeCategoryPanel() { this.showCategoryPanel.set(false); this.editingCat.set(null); }

  loadAllCategories() {
    this.catLoading.set(true);
    this.catError.set(null);
    this.api.listAdditionalCollectionCategories(true).subscribe({
      next: c => { this.allCategories.set(c); this.catLoading.set(false); },
      error: e => { this.catError.set(e?.error?.message ?? 'Failed to load categories.'); this.catLoading.set(false); }
    });
  }

  addCategory() {
    if (this.addCatForm.invalid || this.catSaving()) { this.addCatForm.markAllAsTouched(); return; }
    this.catSaving.set(true);
    this.catError.set(null);
    this.catSuccess.set(null);
    this.api.createAdditionalCollectionCategory({ name: this.addCatForm.controls.name.value }).subscribe({
      next: () => {
        this.catSaving.set(false);
        this.catSuccess.set('Category added.');
        this.addCatForm.reset({ name: '' });
        this.loadAllCategories();
        this.loadCategories();
      },
      error: e => { this.catSaving.set(false); this.catError.set(e?.error?.error ?? e?.error?.message ?? 'Add failed.'); }
    });
  }

  openEditCat(c: AdditionalCollectionCategoryDto) {
    this.editingCat.set(c);
    this.catError.set(null); this.catSuccess.set(null);
    this.editCatForm.reset({ name: c.name, isActive: c.isActive });
  }
  cancelEditCat() { this.editingCat.set(null); }

  saveEditCat() {
    const c = this.editingCat();
    if (!c || this.editCatForm.invalid || this.catSaving()) { this.editCatForm.markAllAsTouched(); return; }
    this.catSaving.set(true);
    const v = this.editCatForm.getRawValue();
    this.api.updateAdditionalCollectionCategory(c.categoryId, { name: v.name, isActive: v.isActive }).subscribe({
      next: () => {
        this.catSaving.set(false);
        this.catSuccess.set('Category updated.');
        this.editingCat.set(null);
        this.loadAllCategories();
        this.loadCategories();
      },
      error: e => { this.catSaving.set(false); this.catError.set(e?.error?.error ?? e?.error?.message ?? 'Update failed.'); }
    });
  }

  toggleCatActive(c: AdditionalCollectionCategoryDto) {
    this.catSaving.set(true);
    this.api.updateAdditionalCollectionCategory(c.categoryId, { name: c.name, isActive: !c.isActive }).subscribe({
      next: () => { this.catSaving.set(false); this.loadAllCategories(); this.loadCategories(); },
      error: e => { this.catSaving.set(false); this.catError.set(e?.error?.error ?? 'Toggle failed.'); }
    });
  }

  categoryColor(id: number): string {
    const palette = ['#6366f1', '#f97316', '#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#14b8a6', '#ec4899', '#84cc16'];
    return palette[id % palette.length];
  }
}
