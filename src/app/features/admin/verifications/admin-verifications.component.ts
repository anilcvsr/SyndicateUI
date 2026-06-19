import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminApi } from '../../../core/services/admin.api';
import { ProofVerificationDto } from '../../../core/models/admin.models';

@Component({
  selector: 'app-admin-verifications',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-verifications.component.html',
  styleUrl: './admin-verifications.component.scss'
})
export class AdminVerificationsComponent {
  private api = inject(AdminApi);
  rows = signal<ProofVerificationDto[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  rejectingFor = signal<number | null>(null);
  rejectReason = new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(3)] });

  constructor() { this.load(); }

  load() {
    this.loading.set(true);
    this.api.listVerifications().subscribe({
      next: (r) => { this.rows.set(r); this.loading.set(false); },
      error: (e) => { this.error.set(e?.error?.message ?? 'Failed to load.'); this.loading.set(false); }
    });
  }

  approve(r: ProofVerificationDto) {
    this.api.approveVerification(r.proofId).subscribe({
      next: () => this.load(),
      error: (e) => this.error.set(e?.error?.message ?? 'Approval failed.')
    });
  }

  beginReject(r: ProofVerificationDto) {
    this.rejectingFor.set(r.proofId);
    this.rejectReason.reset('');
  }

  confirmReject(r: ProofVerificationDto) {
    if (this.rejectReason.invalid) { this.rejectReason.markAsTouched(); return; }
    this.api.rejectVerification(r.proofId, this.rejectReason.value).subscribe({
      next: () => { this.rejectingFor.set(null); this.load(); },
      error: (e) => this.error.set(e?.error?.message ?? 'Reject failed.')
    });
  }

  isImage(url: string) {
    return /\.(png|jpg|jpeg|webp|gif)(\?.*)?$/i.test(url);
  }
}
