import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminApi } from '../../../core/services/admin.api';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-settings.component.html',
  styleUrl: './admin-settings.component.scss'
})
export class AdminSettingsComponent {
  private api = inject(AdminApi);
  private fb = inject(FormBuilder);

  loading = signal(true);
  saving = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  form = this.fb.group({
    groupName: ['', [Validators.required, Validators.maxLength(150)]],
    fixedMonthlyAmount: [1000, [Validators.required, Validators.min(1)]],
    trackingStart: ['', [Validators.required]],
    trackingEnd: ['', [Validators.required]],
    currency: ['INR', [Validators.required]]
  });

  constructor() {
    this.api.getSettings().subscribe({
      next: (s) => {
        this.form.patchValue({
          groupName: s.groupName,
          fixedMonthlyAmount: s.fixedMonthlyAmount,
          trackingStart: s.trackingStart.slice(0, 10),
          trackingEnd: s.trackingEnd.slice(0, 10),
          currency: s.currency
        });
        this.loading.set(false);
      },
      error: (e) => { this.error.set(e?.error?.message ?? 'Failed to load.'); this.loading.set(false); }
    });
  }

  save() {
    this.success.set(null); this.error.set(null);
    if (this.form.invalid || this.saving()) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const v = this.form.getRawValue();
    this.api.updateSettings({
      groupName: v.groupName!,
      fixedMonthlyAmount: v.fixedMonthlyAmount!,
      trackingStart: v.trackingStart!,
      trackingEnd: v.trackingEnd!,
      currency: v.currency!
    }).subscribe({
      next: () => { this.saving.set(false); this.success.set('Settings saved.'); },
      error: (e) => { this.saving.set(false); this.error.set(e?.error?.message ?? 'Save failed.'); }
    });
  }
}
