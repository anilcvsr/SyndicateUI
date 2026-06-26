import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  SuperAdminApi,
  SyndicateDto,
  SyndicateDetailDto
} from '../../core/services/super-admin.api';

@Component({
  selector: 'app-super-admin-syndicates',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './super-admin-syndicates.component.html'
})
export class SuperAdminSyndicatesComponent {
  private api = inject(SuperAdminApi);
  private fb = inject(FormBuilder);

  syndicates = signal<SyndicateDto[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  saving = signal(false);
  search = signal('');

  filteredSyndicates = computed(() => {
    const q = this.search().toLowerCase().trim();
    if (!q) return this.syndicates();
    return this.syndicates().filter(s =>
      s.syndicateName.toLowerCase().includes(q) ||
      (s.email ?? '').toLowerCase().includes(q) ||
      (s.phoneNumber ?? '').toLowerCase().includes(q)
    );
  });

  // Syndicate create/edit modal
  showSyndicateModal = signal(false);
  editingSyndicate = signal<SyndicateDto | null>(null);

  syndicateForm = this.fb.group({
    syndicateName: ['', [Validators.required, Validators.maxLength(255)]],
    address: [''],
    phoneNumber: [''],
    email: ['', [Validators.email]]
  });

  // Syndicate detail/admin panel
  selectedDetail = signal<SyndicateDetailDto | null>(null);
  showDetailPanel = signal(false);
  loadingDetail = signal(false);

  // Create admin modal
  showAdminModal = signal(false);
  adminForm = this.fb.group({
    fullName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  // Reset password modal
  showResetModal = signal(false);
  resetForm = this.fb.group({
    newPassword: ['', [Validators.required, Validators.minLength(8)]]
  });

  syndicateNameConflict = signal<string | null>(null);
  adminEmailConflict = signal<string | null>(null);

  constructor() {
    this.load();
    this.syndicateForm.controls.syndicateName.valueChanges.subscribe(() => {
      if (this.syndicateNameConflict()) this.syndicateNameConflict.set(null);
    });
    this.adminForm.controls.email.valueChanges.subscribe(() => {
      if (this.adminEmailConflict()) this.adminEmailConflict.set(null);
    });
  }

  load() {
    this.loading.set(true);
    this.api.listSyndicates().subscribe({
      next: (s) => { this.syndicates.set(s); this.loading.set(false); },
      error: (e) => { this.error.set(e?.error?.message ?? 'Failed to load syndicates.'); this.loading.set(false); }
    });
  }

  openAdd() {
    this.editingSyndicate.set(null);
    this.syndicateNameConflict.set(null);
    this.syndicateForm.reset({ syndicateName: '', address: '', phoneNumber: '', email: '' });
    this.showSyndicateModal.set(true);
  }

  openEdit(s: SyndicateDto) {
    this.editingSyndicate.set(s);
    this.syndicateNameConflict.set(null);
    this.syndicateForm.reset({
      syndicateName: s.syndicateName,
      address: s.address ?? '',
      phoneNumber: s.phoneNumber ?? '',
      email: s.email ?? ''
    });
    this.showSyndicateModal.set(true);
  }

  saveSyndicate() {
    if (this.syndicateForm.invalid || this.saving() || this.syndicateNameConflict()) { this.syndicateForm.markAllAsTouched(); return; }
    this.saving.set(true);
    const v = this.syndicateForm.getRawValue();
    const payload = {
      syndicateName: v.syndicateName!,
      address: v.address || null,
      phoneNumber: v.phoneNumber || null,
      email: v.email || null
    };
    const current = this.editingSyndicate();
    const obs = current
      ? this.api.updateSyndicate(current.syndicateId, payload)
      : this.api.createSyndicate(payload);
    obs.subscribe({
      next: () => { this.saving.set(false); this.showSyndicateModal.set(false); this.load(); },
      error: (e) => {
        this.saving.set(false);
        if (e?.status === 409) {
          this.syndicateNameConflict.set(e?.error?.message ?? 'A syndicate with this name already exists.');
        } else {
          this.error.set(e?.error?.message ?? 'Save failed.');
        }
      }
    });
  }

  toggleStatus(s: SyndicateDto) {
    const newStatus = s.status === 'Active' ? 'Inactive' : 'Active';
    const msg = newStatus === 'Inactive'
      ? `Deactivate "${s.syndicateName}"? All admin and member logins will be disabled.`
      : `Activate "${s.syndicateName}"?`;
    if (!confirm(msg)) return;
    this.api.updateSyndicateStatus(s.syndicateId, newStatus).subscribe({
      next: () => this.load(),
      error: (e) => this.error.set(e?.error?.message ?? 'Status update failed.')
    });
  }

  viewDetail(s: SyndicateDto) {
    this.showDetailPanel.set(true);
    this.loadingDetail.set(true);
    this.selectedDetail.set(null);
    this.api.getSyndicate(s.syndicateId).subscribe({
      next: (d) => { this.selectedDetail.set(d); this.loadingDetail.set(false); },
      error: () => { this.loadingDetail.set(false); }
    });
  }

  closeDetail() {
    this.showDetailPanel.set(false);
    this.selectedDetail.set(null);
  }

  openCreateAdmin() {
    this.adminEmailConflict.set(null);
    this.adminForm.reset({ fullName: '', email: '', password: '' });
    this.showAdminModal.set(true);
  }

  saveAdmin() {
    if (this.adminForm.invalid || this.saving() || this.adminEmailConflict()) { this.adminForm.markAllAsTouched(); return; }
    const detail = this.selectedDetail();
    if (!detail) return;
    this.saving.set(true);
    const v = this.adminForm.getRawValue();
    this.api.createSyndicateAdmin({
      syndicateId: detail.syndicateId,
      fullName: v.fullName!,
      email: v.email!,
      password: v.password!
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.showAdminModal.set(false);
        this.viewDetail(detail);
      },
      error: (e) => {
        this.saving.set(false);
        if (e?.status === 409) {
          this.adminEmailConflict.set(e?.error?.message ?? 'This email is already in use.');
        } else {
          this.error.set(e?.error?.message ?? 'Create admin failed.');
        }
      }
    });
  }

  openResetPassword() {
    this.resetForm.reset({ newPassword: '' });
    this.showResetModal.set(true);
  }

  saveResetPassword() {
    if (this.resetForm.invalid || this.saving()) { this.resetForm.markAllAsTouched(); return; }
    const admin = this.selectedDetail()?.admin;
    if (!admin) return;
    this.saving.set(true);
    this.api.resetAdminPassword(admin.userId, this.resetForm.value.newPassword!).subscribe({
      next: () => { this.saving.set(false); this.showResetModal.set(false); },
      error: (e) => { this.saving.set(false); this.error.set(e?.error?.message ?? 'Reset failed.'); }
    });
  }
}
