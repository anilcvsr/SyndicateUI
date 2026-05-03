import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminApi } from '../../../core/services/admin.api';
import { MemberDto, PaymentAuditEntryDto, PaymentDto } from '../../../core/models/admin.models';

@Component({
  selector: 'app-admin-payments',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './admin-payments.component.html',
  styleUrl: './admin-payments.component.scss'
})
export class AdminPaymentsComponent {
  private api = inject(AdminApi);
  private fb = inject(FormBuilder);

  members = signal<MemberDto[]>([]);
  saving = signal(false);
  success = signal<PaymentDto[] | null>(null);
  error = signal<string | null>(null);

  selectedMonths = signal<Set<string>>(new Set());

  form = this.fb.group({
    memberId: this.fb.control<number | null>(null, { validators: [Validators.required] }),
    dateReceived: [new Date().toISOString().slice(0, 10), Validators.required],
    amountPaid: this.fb.control<number | null>(null, { validators: [Validators.required, Validators.min(1)] }),
    paymentMode: ['UPI', Validators.required],
    referenceNo: [''],
    remarks: ['']
  });

  paymentModes = ['Cash', 'UPI', 'Bank Transfer', 'Cheque'];

  monthGrid = computed(() => this.generateRecentMonths(18));

  // --- Edit existing payments ---
  editFilterMemberId = signal<number | null>(null);
  existingPayments = signal<PaymentDto[]>([]);
  loadingExisting = signal(false);
  editing = signal<PaymentDto | null>(null);
  editSaving = signal(false);
  editError = signal<string | null>(null);
  editSuccess = signal<string | null>(null);
  auditHistory = signal<PaymentAuditEntryDto[]>([]);

  editForm = this.fb.group({
    datePaid: this.fb.control<string | null>(null),
    paidAmount: this.fb.control<number>(0, { validators: [Validators.required, Validators.min(0)], nonNullable: true }),
    paymentMode: this.fb.control<string | null>(null),
    referenceNo: this.fb.control<string | null>(null),
    remarks: this.fb.control<string | null>(null),
    reason: this.fb.control<string | null>(null)
  });

  constructor() {
    this.api.listMembers(false).subscribe({
      next: (m) => this.members.set(m),
      error: (e) => this.error.set(e?.error?.message ?? 'Failed to load members.')
    });
  }

  private generateRecentMonths(count: number): { iso: string; label: string }[] {
    const out: { iso: string; label: string }[] = [];
    const now = new Date();
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
      const label = d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
      out.push({ iso, label });
    }
    return out;
  }

  toggleMonth(iso: string) {
    const set = new Set(this.selectedMonths());
    if (set.has(iso)) set.delete(iso);
    else set.add(iso);
    this.selectedMonths.set(set);
  }

  isMonthSelected(iso: string): boolean {
    return this.selectedMonths().has(iso);
  }

  save() {
    this.error.set(null);
    this.success.set(null);
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.selectedMonths().size === 0) {
      this.error.set('Select at least one month.');
      return;
    }
    this.saving.set(true);
    const v = this.form.getRawValue();
    const months = [...this.selectedMonths()].sort();
    this.api.recordPayment({
      memberId: v.memberId!,
      dateReceived: v.dateReceived!,
      months,
      amountPaid: v.amountPaid!,
      paymentMode: v.paymentMode!,
      referenceNo: v.referenceNo || null,
      remarks: v.remarks || null
    }).subscribe({
      next: (r) => {
        this.saving.set(false);
        this.success.set(r);
        this.selectedMonths.set(new Set());
        this.form.reset({
          memberId: null,
          dateReceived: new Date().toISOString().slice(0, 10),
          amountPaid: null,
          paymentMode: 'UPI',
          referenceNo: '',
          remarks: ''
        });
        // refresh existing list if same member filter
        const filter = this.editFilterMemberId();
        if (filter) this.loadExistingPayments(filter);
      },
      error: (e) => {
        this.saving.set(false);
        this.error.set(e?.error?.message ?? 'Failed to record payment.');
      }
    });
  }

  onFilterMemberChange(memberId: number | null) {
    this.editFilterMemberId.set(memberId);
    if (memberId) {
      this.loadExistingPayments(memberId);
    } else {
      this.existingPayments.set([]);
    }
  }

  private loadExistingPayments(memberId: number) {
    this.loadingExisting.set(true);
    this.api.listPayments(memberId).subscribe({
      next: (list) => {
        this.existingPayments.set(list);
        this.loadingExisting.set(false);
      },
      error: (e) => {
        this.loadingExisting.set(false);
        this.editError.set(e?.error?.message ?? 'Failed to load payments.');
      }
    });
  }

  openEdit(p: PaymentDto) {
    this.editError.set(null);
    this.editSuccess.set(null);
    this.editing.set(p);
    this.editForm.reset({
      datePaid: p.datePaid ? p.datePaid.slice(0, 10) : null,
      paidAmount: p.paidAmount,
      paymentMode: p.paymentMode,
      referenceNo: p.referenceNo,
      remarks: p.remarks,
      reason: null
    });
    this.api.paymentAudit(p.paymentId).subscribe({
      next: (h) => this.auditHistory.set(h),
      error: () => this.auditHistory.set([])
    });
  }

  cancelEdit() {
    this.editing.set(null);
    this.auditHistory.set([]);
    this.editError.set(null);
  }

  saveEdit() {
    const p = this.editing();
    if (!p || this.editForm.invalid || this.editSaving()) {
      this.editForm.markAllAsTouched();
      return;
    }
    this.editSaving.set(true);
    this.editError.set(null);
    const v = this.editForm.getRawValue();
    this.api.updatePayment(p.paymentId, {
      datePaid: v.datePaid || null,
      paidAmount: v.paidAmount,
      paymentMode: v.paymentMode || null,
      referenceNo: v.referenceNo || null,
      remarks: v.remarks || null,
      reason: v.reason || null
    }).subscribe({
      next: (updated) => {
        this.editSaving.set(false);
        this.editSuccess.set(`Payment for ${updated.memberCode} (${this.formatMonth(updated.monthYear)}) updated.`);
        // refresh list
        const mid = this.editFilterMemberId();
        if (mid) this.loadExistingPayments(mid);
        this.editing.set(null);
        this.auditHistory.set([]);
      },
      error: (e) => {
        this.editSaving.set(false);
        this.editError.set(e?.error?.error ?? e?.error?.message ?? 'Failed to update payment.');
      }
    });
  }

  formatMonth(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
  }
}
