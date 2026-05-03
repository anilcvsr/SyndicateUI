import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminApi } from '../../../core/services/admin.api';
import { MemberDto } from '../../../core/models/admin.models';

@Component({
  selector: 'app-admin-members',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-members.component.html',
  styleUrl: './admin-members.component.scss'
})
export class AdminMembersComponent {
  private api = inject(AdminApi);
  private fb = inject(FormBuilder);

  members = signal<MemberDto[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  showModal = signal(false);
  editing = signal<MemberDto | null>(null);
  saving = signal(false);
  includeInactive = signal(false);

  form = this.fb.group({
    fullName: ['', [Validators.required, Validators.maxLength(150)]],
    email: ['', [Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s]{7,20}$/)]],
    joiningDate: ['', [Validators.required]],
    isActive: [true]
  });

  constructor() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.api.listMembers(this.includeInactive()).subscribe({
      next: (m) => { this.members.set(m); this.loading.set(false); },
      error: (e) => { this.error.set(e?.error?.message ?? 'Failed to load members.'); this.loading.set(false); }
    });
  }

  openAdd() {
    this.editing.set(null);
    this.form.reset({ fullName: '', email: '', phone: '', joiningDate: new Date().toISOString().slice(0, 10), isActive: true });
    this.showModal.set(true);
  }

  openEdit(m: MemberDto) {
    this.editing.set(m);
    this.form.reset({
      fullName: m.fullName,
      email: m.email ?? '',
      phone: m.phone,
      joiningDate: m.joiningDate.slice(0, 10),
      isActive: m.isActive
    });
    this.showModal.set(true);
  }

  save() {
    if (this.form.invalid || this.saving()) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const v = this.form.getRawValue();
    const payload = {
      fullName: v.fullName!,
      email: v.email ? v.email : null,
      phone: v.phone!,
      joiningDate: v.joiningDate!
    };
    const current = this.editing();
    const obs = current
      ? this.api.updateMember(current.memberId, { ...payload, isActive: !!v.isActive })
      : this.api.createMember(payload);
    obs.subscribe({
      next: () => { this.saving.set(false); this.showModal.set(false); this.load(); },
      error: (e) => { this.saving.set(false); this.error.set(e?.error?.message ?? 'Save failed.'); }
    });
  }

  deactivate(m: MemberDto) {
    if (!confirm(`Deactivate ${m.fullName}? Historical records will be preserved.`)) return;
    this.api.deactivateMember(m.memberId).subscribe({
      next: () => this.load(),
      error: (e) => this.error.set(e?.error?.message ?? 'Deactivate failed.')
    });
  }

  toggleInactive() {
    this.includeInactive.update((v) => !v);
    this.load();
  }
}
