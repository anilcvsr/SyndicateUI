import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminApi } from '../../../core/services/admin.api';
import { MemberDto } from '../../../core/models/admin.models';
import {
  CreateLoanPayload,
  CreateLoanRepaymentPayload,
  LoanAuditEntryDto,
  LoanDto,
  LoanInterestType,
  LoanListResultDto,
  LoanPaymentMode,
  LoanReconciliationResultDto,
  LoanRepaymentAuditEntryDto,
  LoanRepaymentDto,
  LoanRepaymentMode,
  LoanRepaymentMutationResultDto,
  LoanStatus,
  LoanSummaryDto,
  SoftBlockResponseDto,
  UpdateLoanRepaymentPayload
} from '../../../core/models/loan.models';

@Component({
  selector: 'app-admin-loans',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink],
  templateUrl: './admin-loans.component.html',
  styleUrl: './admin-loans.component.scss'
})
export class AdminLoansComponent {
  private api = inject(AdminApi);
  private fb = inject(FormBuilder);

  members = signal<MemberDto[]>([]);
  result = signal<LoanListResultDto | null>(null);
  summary = signal<LoanSummaryDto | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  statusOptions: LoanStatus[] = ['Active', 'PartiallyPaid', 'Closed', 'Overdue'];

  filter = this.fb.group({
    memberId: this.fb.control<number | null>(null),
    statuses: this.fb.control<LoanStatus[]>([]),
    from: this.fb.control<string | null>(null),
    to: this.fb.control<string | null>(null),
    overdueOnly: this.fb.control<boolean>(false, { nonNullable: true }),
    q: this.fb.control<string>(''),
    page: this.fb.control<number>(1, { nonNullable: true }),
    pageSize: this.fb.control<number>(25, { nonNullable: true })
  });

  // Loan form
  showForm = signal(false);
  editing = signal<LoanDto | null>(null);
  saving = signal(false);
  formError = signal<string | null>(null);
  formSuccess = signal<string | null>(null);

  form = this.fb.group({
    memberId: this.fb.control<number | null>(null, { validators: [Validators.required] }),
    principalAmount: this.fb.control<number | null>(null, { validators: [Validators.required, Validators.min(1)] }),
    interestRate: this.fb.control<number>(0, { nonNullable: true, validators: [Validators.required, Validators.min(0), Validators.max(100)] }),
    interestType: this.fb.control<LoanInterestType>('Simple', { nonNullable: true, validators: [Validators.required] }),
    releaseDate: this.fb.control<string>(new Date().toISOString().slice(0, 10), { nonNullable: true, validators: [Validators.required] }),
    expectedReturnDate: this.fb.control<string>('', { nonNullable: true, validators: [Validators.required] }),
    repaymentMode: this.fb.control<LoanRepaymentMode>('Installment', { nonNullable: true, validators: [Validators.required] }),
    purpose: this.fb.control<string>('', { nonNullable: true }),
    remarks: this.fb.control<string>('', { nonNullable: true })
  });

  // Detail / history / repayments drawer
  detailFor = signal<LoanDto | null>(null);
  history = signal<LoanAuditEntryDto[]>([]);
  repayments = signal<LoanRepaymentDto[]>([]);
  detailLoading = signal(false);

  // Repayment modal
  repaymentFor = signal<LoanDto | null>(null);
  repaymentSaving = signal(false);
  repaymentError = signal<string | null>(null);
  repaymentForm = this.fb.group({
    repaymentDate: this.fb.control<string>(new Date().toISOString().slice(0, 10), { nonNullable: true, validators: [Validators.required] }),
    amount: this.fb.control<number | null>(null, { validators: [Validators.required, Validators.min(0.01)] }),
    paymentMode: this.fb.control<LoanPaymentMode>('Cash', { nonNullable: true, validators: [Validators.required] }),
    referenceNo: this.fb.control<string>('', { nonNullable: true }),
    notes: this.fb.control<string>('', { nonNullable: true })
  });

  // Edit-repayment modal (admin override — any loan status)
  editingRepayment = signal<LoanRepaymentDto | null>(null);
  editRepaymentSaving = signal(false);
  editRepaymentError = signal<string | null>(null);
  editRepaymentForm = this.fb.group({
    repaymentDate: this.fb.control<string>(new Date().toISOString().slice(0, 10), { nonNullable: true, validators: [Validators.required] }),
    principalPortion: this.fb.control<number>(0, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
    interestPortion: this.fb.control<number>(0, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
    paymentMode: this.fb.control<LoanPaymentMode>('Cash', { nonNullable: true, validators: [Validators.required] }),
    referenceNo: this.fb.control<string>('', { nonNullable: true }),
    notes: this.fb.control<string>('', { nonNullable: true }),
    reason: this.fb.control<string>('', { nonNullable: true })
  });

  // Delete confirm
  deleting = signal<LoanDto | null>(null);
  deleteReason = signal('');

  // Success/info toast shown at page level (reopen, reconcile, etc)
  infoToast = signal<string | null>(null);

  // Soft-block confirmation (edit/delete that would drive NET balance negative)
  softBlock = signal<{
    kind: 'edit' | 'delete';
    message: string;
    projected: number;
    current: number;
    retry: () => void;
  } | null>(null);

  // Reconciliation preview modal
  reconciling = signal(false);
  reconcilePreview = signal<LoanReconciliationResultDto | null>(null);

  // Per-repayment audit drawer
  auditFor = signal<LoanRepaymentDto | null>(null);
  auditEntries = signal<LoanRepaymentAuditEntryDto[]>([]);
  auditLoading = signal(false);
  auditError = signal<string | null>(null);

  today = new Date().toISOString().slice(0, 10);
  activeMembers = computed(() => this.members().filter((m) => m.isActive));

  totalPages = computed(() => {
    const r = this.result();
    if (!r) return 1;
    return Math.max(1, Math.ceil(r.totalCount / r.pageSize));
  });

  constructor() {
    this.loadMembers();
    this.applyDefaultFyDates();
    this.loadAll();
  }

  private applyDefaultFyDates() {
    const now = new Date();
    const y = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    this.filter.patchValue({ from: `${y}-04-01`, to: `${y + 1}-03-31` });
  }

  loadMembers() {
    this.api.listMembers(false).subscribe({
      next: (m) => this.members.set(m),
      error: () => { /* non-fatal */ }
    });
  }

  loadAll() {
    this.loading.set(true);
    this.error.set(null);
    const v = this.filter.getRawValue();
    const query = {
      memberId: v.memberId ?? undefined,
      statuses: v.statuses && v.statuses.length ? v.statuses : undefined,
      from: v.from || undefined,
      to: v.to || undefined,
      overdueOnly: v.overdueOnly || undefined,
      q: v.q || undefined,
      page: v.page,
      pageSize: v.pageSize
    };
    this.api.listLoans(query).subscribe({
      next: (r) => { this.result.set(r); this.loading.set(false); },
      error: (e) => { this.error.set(e?.error?.error ?? e?.error?.message ?? 'Failed to load loans.'); this.loading.set(false); }
    });
    this.api.loanSummary(v.from || undefined, v.to || undefined).subscribe({
      next: (s) => this.summary.set(s),
      error: () => { /* non-fatal */ }
    });
  }

  applyFilters() { this.filter.patchValue({ page: 1 }); this.loadAll(); }
  resetFilters() {
    this.filter.reset({ memberId: null, statuses: [], from: null, to: null, overdueOnly: false, q: '', page: 1, pageSize: 25 });
    this.applyDefaultFyDates();
    this.loadAll();
  }

  goToPage(p: number) {
    if (p < 1 || p > this.totalPages()) return;
    this.filter.patchValue({ page: p });
    this.loadAll();
  }

  toggleStatusFilter(s: LoanStatus) {
    const current = this.filter.controls.statuses.value ?? [];
    const set = new Set(current);
    if (set.has(s)) set.delete(s); else set.add(s);
    this.filter.patchValue({ statuses: [...set] });
  }

  isStatusFilterSelected(s: LoanStatus): boolean {
    return (this.filter.controls.statuses.value ?? []).includes(s);
  }

  // ----- Loan form -----
  openAdd() {
    this.editing.set(null);
    this.formError.set(null);
    this.formSuccess.set(null);
    const today = new Date().toISOString().slice(0, 10);
    const oneYear = new Date();
    oneYear.setFullYear(oneYear.getFullYear() + 1);
    this.form.reset({
      memberId: null,
      principalAmount: null,
      interestRate: 0,
      interestType: 'Simple',
      releaseDate: today,
      expectedReturnDate: oneYear.toISOString().slice(0, 10),
      repaymentMode: 'Installment',
      purpose: '',
      remarks: ''
    });
    this.showForm.set(true);
  }

  openEdit(l: LoanDto) {
    this.editing.set(l);
    this.formError.set(null);
    this.formSuccess.set(null);
    this.form.reset({
      memberId: l.memberId,
      principalAmount: l.principalAmount,
      interestRate: l.interestRate,
      interestType: l.interestType,
      releaseDate: l.releaseDate.slice(0, 10),
      expectedReturnDate: l.expectedReturnDate.slice(0, 10),
      repaymentMode: l.repaymentMode,
      purpose: l.purpose ?? '',
      remarks: l.remarks ?? ''
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
    const payload: CreateLoanPayload = {
      memberId: v.memberId!,
      principalAmount: v.principalAmount!,
      interestRate: v.interestRate,
      interestType: v.interestType,
      releaseDate: v.releaseDate,
      expectedReturnDate: v.expectedReturnDate,
      repaymentMode: v.repaymentMode,
      purpose: v.purpose || null,
      remarks: v.remarks || null
    };

    const existing = this.editing();
    if (existing) {
      this.api.updateLoan(existing.loanId, { ...payload, rowVersion: existing.rowVersion }).subscribe({
        next: () => {
          this.saving.set(false);
          this.formSuccess.set('Loan updated.');
          this.showForm.set(false);
          this.editing.set(null);
          this.loadAll();
        },
        error: (e) => {
          this.saving.set(false);
          this.formError.set(e?.error?.error ?? e?.error?.message ?? 'Failed to update loan.');
        }
      });
    } else {
      this.api.createLoan(payload).subscribe({
        next: () => {
          this.saving.set(false);
          this.formSuccess.set('Loan issued.');
          this.showForm.set(false);
          this.loadAll();
        },
        error: (e) => {
          this.saving.set(false);
          this.formError.set(e?.error?.error ?? e?.error?.message ?? 'Failed to issue loan.');
        }
      });
    }
  }

  // ----- Detail drawer -----
  openDetail(l: LoanDto) {
    this.detailFor.set(l);
    this.history.set([]);
    this.repayments.set([]);
    this.detailLoading.set(true);
    this.api.loanHistory(l.loanId).subscribe({ next: (h) => this.history.set(h), error: () => { /* non-fatal */ } });
    this.api.listLoanRepayments(l.loanId).subscribe({
      next: (r) => { this.repayments.set(r); this.detailLoading.set(false); },
      error: () => { this.detailLoading.set(false); }
    });
  }
  closeDetail() { this.detailFor.set(null); this.history.set([]); this.repayments.set([]); }

  // ----- Repayment -----
  openRepayment(l: LoanDto) {
    this.repaymentFor.set(l);
    this.repaymentError.set(null);
    this.repaymentForm.reset({
      repaymentDate: new Date().toISOString().slice(0, 10),
      amount: l.outstandingBalance,
      paymentMode: 'Cash',
      referenceNo: '',
      notes: ''
    });
  }
  cancelRepayment() { this.repaymentFor.set(null); this.repaymentError.set(null); }
  saveRepayment() {
    const loan = this.repaymentFor();
    if (!loan || this.repaymentForm.invalid || this.repaymentSaving()) {
      this.repaymentForm.markAllAsTouched();
      return;
    }
    this.repaymentSaving.set(true);
    this.repaymentError.set(null);
    const v = this.repaymentForm.getRawValue();
    const payload: CreateLoanRepaymentPayload = {
      repaymentDate: v.repaymentDate,
      amount: v.amount!,
      paymentMode: v.paymentMode,
      referenceNo: v.referenceNo || null,
      notes: v.notes || null
    };
    this.api.recordLoanRepayment(loan.loanId, payload).subscribe({
      next: () => {
        this.repaymentSaving.set(false);
        this.repaymentFor.set(null);
        this.loadAll();
      },
      error: (e) => {
        this.repaymentSaving.set(false);
        this.repaymentError.set(e?.error?.error ?? e?.error?.message ?? 'Failed to record repayment.');
      }
    });
  }

  deleteRepayment(r: LoanRepaymentDto, force = false) {
    if (!force && !confirm(`Delete repayment of ${r.amount} on ${r.repaymentDate.slice(0,10)}?`)) return;
    this.api.deleteLoanRepayment(r.repaymentId, 'Reversed by admin', force).subscribe({
      next: (res) => this.handleMutationSuccess(res),
      error: (e) => this.handleMutationError(e, 'delete', () => this.deleteRepayment(r, true))
    });
  }

  // ----- Edit Repayment (admin override) -----
  openEditRepayment(r: LoanRepaymentDto) {
    this.editingRepayment.set(r);
    this.editRepaymentError.set(null);
    this.editRepaymentForm.reset({
      repaymentDate: r.repaymentDate.slice(0, 10),
      principalPortion: r.principalPortion,
      interestPortion: r.interestPortion,
      paymentMode: r.paymentMode,
      referenceNo: r.referenceNo ?? '',
      notes: r.notes ?? '',
      reason: ''
    });
  }
  cancelEditRepayment() { this.editingRepayment.set(null); this.editRepaymentError.set(null); }
  editRepaymentTotal(): number {
    const v = this.editRepaymentForm.getRawValue();
    return (v.principalPortion || 0) + (v.interestPortion || 0);
  }
  saveEditRepayment(force = false) {
    const r = this.editingRepayment();
    if (!r || this.editRepaymentForm.invalid || this.editRepaymentSaving()) {
      this.editRepaymentForm.markAllAsTouched();
      return;
    }
    const v = this.editRepaymentForm.getRawValue();
    if ((v.principalPortion || 0) + (v.interestPortion || 0) <= 0) {
      this.editRepaymentError.set('Principal + Interest must be greater than zero.');
      return;
    }
    this.editRepaymentSaving.set(true);
    this.editRepaymentError.set(null);
    const payload: UpdateLoanRepaymentPayload = {
      repaymentDate: v.repaymentDate,
      principalPortion: v.principalPortion,
      interestPortion: v.interestPortion,
      paymentMode: v.paymentMode,
      referenceNo: v.referenceNo || null,
      notes: v.notes || null,
      reason: v.reason || null,
      expectedUpdatedAt: r.updatedAt
    };
    this.api.updateLoanRepayment(r.repaymentId, payload, force).subscribe({
      next: (res) => {
        this.editRepaymentSaving.set(false);
        this.editingRepayment.set(null);
        this.handleMutationSuccess(res);
      },
      error: (e) => {
        this.editRepaymentSaving.set(false);
        this.handleMutationError(e, 'edit', () => this.saveEditRepayment(true), (msg) => this.editRepaymentError.set(msg));
      }
    });
  }

  // ----- Mutation result helpers (reopen toast, conflict, soft-block) -----
  private handleMutationSuccess(res: LoanRepaymentMutationResultDto) {
    const loan = this.detailFor();
    if (loan) {
      this.api.listLoanRepayments(loan.loanId).subscribe({ next: (x) => this.repayments.set(x) });
      this.api.loanHistory(loan.loanId).subscribe({ next: (h) => this.history.set(h) });
    }
    this.loadAll();
    if (res.reopened) {
      this.infoToast.set(`↺ Loan auto-reopened (was Closed → now ${this.statusLabel(res.newLoanStatus)}).`);
      setTimeout(() => this.infoToast.set(null), 8000);
    } else if (res.prevLoanStatus !== res.newLoanStatus) {
      this.infoToast.set(`Loan status updated: ${this.statusLabel(res.prevLoanStatus)} → ${this.statusLabel(res.newLoanStatus)}.`);
      setTimeout(() => this.infoToast.set(null), 6000);
    }
  }

  private handleMutationError(e: any, kind: 'edit' | 'delete', retryForced: () => void, setLocalError?: (m: string) => void) {
    const status = e?.status;
    const body = e?.error;
    if (status === 409) {
      const msg = body?.error || 'This repayment was changed by another admin. Please reload and try again.';
      if (setLocalError) setLocalError(msg); else this.infoToast.set(msg);
      const loan = this.detailFor();
      if (loan) this.api.listLoanRepayments(loan.loanId).subscribe({ next: (x) => this.repayments.set(x) });
      return;
    }
    if (status === 422 && body && typeof body === 'object' && 'projectedAvailableBalance' in body) {
      const sb = body as SoftBlockResponseDto;
      this.softBlock.set({
        kind,
        message: sb.error,
        projected: sb.projectedAvailableBalance,
        current: sb.currentAvailableBalance,
        retry: retryForced
      });
      return;
    }
    const msg = body?.error ?? body?.message ?? (kind === 'edit' ? 'Failed to update repayment.' : 'Failed to reverse repayment.');
    if (setLocalError) setLocalError(msg); else this.infoToast.set(msg);
  }

  confirmSoftBlock() {
    const sb = this.softBlock();
    if (!sb) return;
    const retry = sb.retry;
    this.softBlock.set(null);
    retry();
  }
  cancelSoftBlock() { this.softBlock.set(null); }

  // ----- Reconciliation -----
  openReconcile() {
    this.reconciling.set(true);
    this.api.reconcileLoans(false).subscribe({
      next: (r) => { this.reconcilePreview.set(r); this.reconciling.set(false); },
      error: (e) => { this.reconciling.set(false); this.error.set(e?.error?.error ?? 'Failed to run reconcile.'); }
    });
  }
  applyReconcile() {
    this.reconciling.set(true);
    this.api.reconcileLoans(true).subscribe({
      next: (r) => {
        this.reconciling.set(false);
        this.reconcilePreview.set(null);
        this.infoToast.set(`✓ Reconciled ${r.loansFixed} loan(s). ${r.loansNeedingFix - r.loansFixed} remaining.`);
        setTimeout(() => this.infoToast.set(null), 8000);
        this.loadAll();
      },
      error: (e) => { this.reconciling.set(false); this.error.set(e?.error?.error ?? 'Failed to apply reconcile.'); }
    });
  }
  closeReconcile() { this.reconcilePreview.set(null); }

  // ----- Per-repayment audit drawer -----
  openRepaymentAudit(r: LoanRepaymentDto) {
    this.auditFor.set(r);
    this.auditEntries.set([]);
    this.auditError.set(null);
    this.auditLoading.set(true);
    this.api.loanRepaymentAudit(r.repaymentId).subscribe({
      next: (entries) => { this.auditEntries.set(entries); this.auditLoading.set(false); },
      error: (e) => { this.auditLoading.set(false); this.auditError.set(e?.error?.error ?? 'Failed to load audit trail.'); }
    });
  }
  closeRepaymentAudit() { this.auditFor.set(null); this.auditEntries.set([]); this.auditError.set(null); }

  formatAuditPayload(value: unknown): string {
    if (value === null || value === undefined) return '';
    try { return JSON.stringify(value, null, 2); } catch { return String(value); }
  }
  auditActionLabel(a: string): string {
    switch (a) {
      case 'LoanRepayment.Create': return 'Created';
      case 'LoanRepayment.MemberCreate': return 'Created by member';
      case 'LoanRepayment.Update': return 'Edited';
      case 'LoanRepayment.Delete': return 'Reversed';
      case 'Loan.Reopened': return 'Loan re-opened';
      default: return a;
    }
  }
  auditActionClass(a: string): string {
    if (a.endsWith('Delete')) return 'badge-danger';
    if (a.endsWith('Update')) return 'badge-warning';
    if (a === 'Loan.Reopened') return 'badge-info';
    return 'badge-success';
  }

  // ----- Delete -----
  confirmDelete(l: LoanDto) { this.deleting.set(l); this.deleteReason.set(''); }
  cancelDelete() { this.deleting.set(null); this.deleteReason.set(''); }
  performDelete() {
    const l = this.deleting();
    if (!l) return;
    this.api.deleteLoan(l.loanId, this.deleteReason() || null).subscribe({
      next: () => { this.deleting.set(null); this.deleteReason.set(''); this.loadAll(); },
      error: (err) => { this.formError.set(err?.error?.error ?? 'Failed to delete.'); this.deleting.set(null); }
    });
  }

  // ----- Overdue job -----
  runMarkOverdue() {
    this.api.markOverdueLoans().subscribe({
      next: (r) => { alert(`${r.updated} loan(s) marked overdue.`); this.loadAll(); },
      error: (e) => { this.error.set(e?.error?.error ?? 'Failed to run overdue job.'); }
    });
  }

  // ----- Helpers -----
  statusClass(s: LoanStatus): string {
    switch (s) {
      case 'Closed': return 'badge-success';
      case 'Active': return 'badge-info';
      case 'PartiallyPaid': return 'badge-warning';
      case 'Overdue': return 'badge-danger';
      default: return 'badge-neutral';
    }
  }

  statusLabel(s: LoanStatus): string {
    return s === 'PartiallyPaid' ? 'Partially Paid' : s;
  }

  isEditLocked(l: LoanDto): boolean {
    return l.repaymentCount > 0;
  }

  exportCsv() {
    const r = this.result();
    if (!r || r.items.length === 0) return;
    const headers = ['Loan Code', 'Member', 'Principal', 'Interest', 'Release Date', 'Expected Return', 'Tenure (M)', 'Status', 'Paid', 'Outstanding'];
    const rows = r.items.map((l) => [
      l.loanCode,
      `${l.memberName} (${l.memberCode})`,
      l.principalAmount,
      l.interestAmount,
      l.releaseDate.slice(0, 10),
      l.expectedReturnDate.slice(0, 10),
      l.tenureMonths,
      this.statusLabel(l.status),
      l.amountPaidSoFar,
      l.outstandingBalance
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `loans-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
