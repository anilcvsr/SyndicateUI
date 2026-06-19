import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MemberApi } from '../../../core/services/member.api';
import {
  LoanDto,
  LoanListResultDto,
  LoanOutstandingDto,
  LoanPaymentMode,
  LoanRepaymentDto,
  LoanStatus,
  MemberCreateLoanRepaymentPayload,
  MemberLoanSnapshotDto,
  MemberRepaymentType
} from '../../../core/models/loan.models';

@Component({
  selector: 'app-member-loans',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './member-loans.component.html',
  styleUrl: './member-loans.component.scss'
})
export class MemberLoansComponent {
  private api = inject(MemberApi);
  private fb = inject(FormBuilder);

  result = signal<LoanListResultDto | null>(null);
  snapshot = signal<MemberLoanSnapshotDto | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  statusOptions: LoanStatus[] = ['Active', 'PartiallyPaid', 'Closed', 'Overdue'];

  filter = this.fb.group({
    statuses: this.fb.control<LoanStatus[]>([]),
    from: this.fb.control<string | null>(null),
    to: this.fb.control<string | null>(null),
    page: this.fb.control<number>(1, { nonNullable: true }),
    pageSize: this.fb.control<number>(25, { nonNullable: true })
  });

  // Detail drawer
  detailFor = signal<LoanDto | null>(null);
  repayments = signal<LoanRepaymentDto[]>([]);
  detailLoading = signal(false);

  // Repay modal
  repayFor = signal<LoanDto | null>(null);
  outstanding = signal<LoanOutstandingDto | null>(null);
  repayLoading = signal(false);
  repaySubmitting = signal(false);
  repayError = signal<string | null>(null);
  repaySuccess = signal<string | null>(null);

  repayForm = this.fb.group({
    repaymentType: this.fb.control<MemberRepaymentType>('PrincipalPlusInterest', { nonNullable: true }),
    principalAmount: this.fb.control<number | null>(null),
    interestAmount: this.fb.control<number | null>(null),
    repaymentDate: this.fb.control<string>(this.today(), { nonNullable: true, validators: [Validators.required] }),
    paymentMode: this.fb.control<LoanPaymentMode>('Cash', { nonNullable: true }),
    referenceNo: this.fb.control<string | null>(null),
    notes: this.fb.control<string | null>(null)
  });

  totalPages = computed(() => {
    const r = this.result();
    if (!r) return 1;
    return Math.max(1, Math.ceil(r.totalCount / r.pageSize));
  });

  constructor() {
    this.applyDefaultFyDates();
    this.loadAll();
  }

  private today(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  private applyDefaultFyDates() {
    const now = new Date();
    const y = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    this.filter.patchValue({ from: `${y}-04-01`, to: `${y + 1}-03-31` });
  }

  loadAll() {
    this.loading.set(true);
    this.error.set(null);
    const v = this.filter.getRawValue();
    const query = {
      statuses: v.statuses && v.statuses.length ? v.statuses : undefined,
      from: v.from || undefined,
      to: v.to || undefined,
      page: v.page,
      pageSize: v.pageSize
    };
    this.api.listLoans(query).subscribe({
      next: (r) => { this.result.set(r); this.loading.set(false); },
      error: (e) => { this.error.set(e?.error?.message ?? 'Failed to load loans.'); this.loading.set(false); }
    });
    this.api.loanSnapshot().subscribe({
      next: (s) => this.snapshot.set(s),
      error: () => { /* non-fatal */ }
    });
  }

  applyFilters() { this.filter.patchValue({ page: 1 }); this.loadAll(); }
  resetFilters() {
    this.filter.reset({ statuses: [], from: null, to: null, page: 1, pageSize: 25 });
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

  openDetail(l: LoanDto) {
    this.detailFor.set(l);
    this.repayments.set([]);
    this.detailLoading.set(true);
    this.api.listLoanRepayments(l.loanId).subscribe({
      next: (r) => { this.repayments.set(r); this.detailLoading.set(false); },
      error: () => { this.detailLoading.set(false); }
    });
  }
  closeDetail() { this.detailFor.set(null); this.repayments.set([]); }

  canRepay(l: LoanDto): boolean {
    return l.status !== 'Closed' && l.outstandingBalance > 0;
  }

  openRepay(l: LoanDto, ev?: Event) {
    ev?.stopPropagation();
    this.repayFor.set(l);
    this.outstanding.set(null);
    this.repayError.set(null);
    this.repaySuccess.set(null);
    this.repayForm.reset({
      repaymentType: 'PrincipalPlusInterest',
      principalAmount: null,
      interestAmount: null,
      repaymentDate: this.today(),
      paymentMode: 'Cash',
      referenceNo: null,
      notes: null
    });
    this.repayLoading.set(true);
    this.api.loanOutstanding(l.loanId).subscribe({
      next: (o) => {
        this.outstanding.set(o);
        this.repayLoading.set(false);
      },
      error: (e) => {
        this.repayError.set(e?.error?.error ?? e?.error?.message ?? 'Failed to load outstanding balance.');
        this.repayLoading.set(false);
      }
    });
  }

  closeRepay() {
    this.repayFor.set(null);
    this.outstanding.set(null);
    this.repayError.set(null);
    this.repaySuccess.set(null);
  }

  submitRepay() {
    const loan = this.repayFor();
    const out = this.outstanding();
    if (!loan || !out) return;

    this.repayError.set(null);
    const v = this.repayForm.getRawValue();

    // Client-side validation mirroring the server rules
    if (!v.repaymentDate) { this.repayError.set('Please choose a repayment date.'); return; }

    let principalAmount: number | null = null;
    let interestAmount: number | null = null;

    if (v.repaymentType === 'PrincipalOnly') {
      if (!v.principalAmount || v.principalAmount <= 0) { this.repayError.set('Please enter a principal amount greater than zero.'); return; }
      if (v.principalAmount > out.principalOutstanding) { this.repayError.set(`Principal cannot exceed outstanding principal (${out.principalOutstanding}).`); return; }
      principalAmount = v.principalAmount;
    } else if (v.repaymentType === 'InterestOnly') {
      if (!v.interestAmount || v.interestAmount <= 0) { this.repayError.set('Please enter an interest amount greater than zero.'); return; }
      if (v.interestAmount > out.interestOutstanding) { this.repayError.set(`Interest cannot exceed outstanding interest (${out.interestOutstanding}).`); return; }
      interestAmount = v.interestAmount;
    } else {
      if (!v.principalAmount || v.principalAmount <= 0) { this.repayError.set('Please enter a principal amount greater than zero.'); return; }
      if (!v.interestAmount || v.interestAmount <= 0) { this.repayError.set('Please enter an interest amount greater than zero.'); return; }
      if (v.principalAmount > out.principalOutstanding) { this.repayError.set(`Principal cannot exceed outstanding principal (${out.principalOutstanding}).`); return; }
      if (v.interestAmount > out.interestOutstanding) { this.repayError.set(`Interest cannot exceed outstanding interest (${out.interestOutstanding}).`); return; }
      principalAmount = v.principalAmount;
      interestAmount = v.interestAmount;
    }

    const payload: MemberCreateLoanRepaymentPayload = {
      repaymentDate: v.repaymentDate,
      repaymentType: v.repaymentType,
      principalAmount,
      interestAmount,
      paymentMode: v.paymentMode,
      referenceNo: v.referenceNo?.trim() || null,
      notes: v.notes?.trim() || null
    };

    this.repaySubmitting.set(true);
    this.api.recordLoanRepayment(loan.loanId, payload).subscribe({
      next: () => {
        const total = (principalAmount ?? 0) + (interestAmount ?? 0);
        this.repaySuccess.set(`Repayment of ${total.toLocaleString('en-IN', { maximumFractionDigits: 2 })} recorded successfully.`);
        this.repaySubmitting.set(false);
        // Refresh outstanding + data
        this.api.loanOutstanding(loan.loanId).subscribe({
          next: (o) => this.outstanding.set(o),
          error: () => { /* ignore */ }
        });
        this.loadAll();
        // If detail modal is open for same loan, refresh repayment history
        const d = this.detailFor();
        if (d && d.loanId === loan.loanId) {
          this.api.listLoanRepayments(loan.loanId).subscribe({
            next: (r) => this.repayments.set(r),
            error: () => { /* ignore */ }
          });
          this.api.getLoan(loan.loanId).subscribe({
            next: (lo) => this.detailFor.set(lo),
            error: () => { /* ignore */ }
          });
        }
      },
      error: (e) => {
        this.repayError.set(e?.error?.error ?? e?.error?.message ?? 'Failed to record repayment.');
        this.repaySubmitting.set(false);
      }
    });
  }

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
}
