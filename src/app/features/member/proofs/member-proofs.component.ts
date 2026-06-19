import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MemberApi } from '../../../core/services/member.api';
import { MemberProofDto } from '../../../core/models/member.models';

@Component({
  selector: 'app-member-proofs',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './member-proofs.component.html',
  styleUrl: './member-proofs.component.scss'
})
export class MemberProofsComponent {
  private api = inject(MemberApi);
  private fb = inject(FormBuilder);

  rows = signal<MemberProofDto[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  saving = signal(false);
  success = signal<string | null>(null);
  file = signal<File | null>(null);
  fileError = signal<string | null>(null);
  canSubmit = signal(false);

  paymentModes = ['Cash', 'UPI', 'Bank Transfer', 'Cheque'];

  form = this.fb.group({
    month: ['', Validators.required],
    claimedAmount: [0, [Validators.required, Validators.min(1)]],
    paymentMode: ['UPI', Validators.required],
    referenceNo: ['']
  });

  constructor() { this.load(); }

  load() {
    this.loading.set(true);
    this.api.homeSummary().subscribe({
      next: (s) => this.canSubmit.set(s.allowMemberPaymentSubmission),
      error: () => this.canSubmit.set(false)
    });
    this.api.listProofs().subscribe({
      next: (r) => { this.rows.set(r); this.loading.set(false); },
      error: (e) => { this.error.set(e?.error?.message ?? 'Failed to load.'); this.loading.set(false); }
    });
  }

  onFileSelect(evt: Event) {
    this.fileError.set(null);
    const input = evt.target as HTMLInputElement;
    const f = input.files?.[0] ?? null;
    if (!f) { this.file.set(null); return; }
    const ok = ['image/jpeg', 'image/png', 'application/pdf'].includes(f.type);
    if (!ok) { this.fileError.set('Only JPG, PNG, or PDF are allowed.'); return; }
    if (f.size > 5 * 1024 * 1024) { this.fileError.set('File must be under 5 MB.'); return; }
    this.file.set(f);
  }

  submit() {
    this.success.set(null); this.error.set(null);
    if (this.form.invalid || this.saving()) { this.form.markAllAsTouched(); return; }
    if (!this.file()) { this.fileError.set('Upload a proof file.'); return; }
    this.saving.set(true);

    const v = this.form.getRawValue();
    const fd = new FormData();
    fd.append('monthsCsv', v.month!);
    fd.append('claimedAmount', String(v.claimedAmount!));
    fd.append('paymentMode', v.paymentMode!);
    if (v.referenceNo) fd.append('referenceNo', v.referenceNo);
    fd.append('file', this.file()!);

    this.api.submitProof(fd).subscribe({
      next: () => {
        this.saving.set(false);
        this.success.set('Submitted — awaiting admin verification.');
        this.form.reset({ month: '', claimedAmount: 0, paymentMode: 'UPI', referenceNo: '' });
        this.file.set(null);
        this.load();
      },
      error: (e) => { this.saving.set(false); this.error.set(e?.error?.message ?? 'Submit failed.'); }
    });
  }

  statusBadge(s: string) {
    if (s === 'Approved') return 'badge-success';
    if (s === 'Rejected') return 'badge-danger';
    return 'badge-warning';
  }
}
