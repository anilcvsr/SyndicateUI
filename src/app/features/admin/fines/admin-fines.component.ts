import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminApi } from '../../../core/services/admin.api';
import { FineSummaryDto, MemberDto, MemberFineDto } from '../../../core/models/admin.models';

@Component({
    selector: 'app-admin-fines',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './admin-fines.component.html',
    styleUrl: './admin-fines.component.scss'
})
export class AdminFinesComponent {
    private api = inject(AdminApi);
    private fb = inject(FormBuilder);

    members = signal<MemberDto[]>([]);
    selectedMemberId = signal<number | null>(null);
    fines = signal<MemberFineDto[]>([]);
    summary = signal<FineSummaryDto | null>(null);

    memberSearch = signal('');
    dropdownOpen = signal(false);

    loading = signal(false);
    evaluating = signal(false);
    saving = signal(false);
    error = signal<string | null>(null);
    success = signal<string | null>(null);

    waivedFine = signal<MemberFineDto | null>(null);
    payingFine = signal<MemberFineDto | null>(null);

    waiveForm = this.fb.group({
        waiveType: ['full', Validators.required],
        waiveAmount: [null as number | null],
        reason: ['', Validators.maxLength(500)]
    });

    paymentForm = this.fb.group({
        paymentType: ['full', Validators.required],
        amountPaid: [null as number | null],
        notes: ['', Validators.maxLength(500)]
    });

    activeFines = computed(() => this.fines().filter(f => f.status === 'Active' || f.status === 'PartiallyWaived'));
    resolvedFines = computed(() => this.fines().filter(f => f.status === 'Waived' || f.status === 'Paid'));
    totalActiveFineAmount = computed(() =>
        this.activeFines().reduce((sum, f) => sum + this.fineBalance(f), 0)
    );

    filteredMembers = computed(() => {
        const q = this.memberSearch().toLowerCase();
        if (!q) return this.members();
        return this.members().filter(m =>
            m.fullName.toLowerCase().includes(q) || m.memberCode.toLowerCase().includes(q)
        );
    });

    selectedMemberName = computed(() => {
        const id = this.selectedMemberId();
        return this.members().find(m => m.memberId === id)?.fullName ?? '';
    });

    constructor() {
        this.api.listMembers().subscribe({
            next: (m) => this.members.set(m),
            error: () => {}
        });
        this.api.getFinesSummary().subscribe({
            next: (s) => this.summary.set(s),
            error: () => {}
        });
    }

    onSearchInput(value: string) {
        this.memberSearch.set(value);
        this.dropdownOpen.set(true);
    }

    selectMember(id: number) {
        const member = this.members().find(m => m.memberId === id);
        this.selectedMemberId.set(id);
        this.memberSearch.set(member?.fullName ?? '');
        this.dropdownOpen.set(false);
        this.loadFines(id);
    }

    clearSelection() {
        this.selectedMemberId.set(null);
        this.memberSearch.set('');
        this.fines.set([]);
        this.dropdownOpen.set(false);
    }

    onSearchFocus() { this.dropdownOpen.set(true); }
    onSearchBlur() { setTimeout(() => this.dropdownOpen.set(false), 150); }

    loadFines(memberId: number) {
        this.loading.set(true);
        this.error.set(null);
        this.api.getMemberFines(memberId).subscribe({
            next: (f) => { this.fines.set(f); this.loading.set(false); },
            error: (e) => { this.error.set(e?.error?.message ?? 'Failed to load fines.'); this.loading.set(false); }
        });
    }

    evaluate() {
        const id = this.selectedMemberId();
        if (!id || this.evaluating()) return;
        this.evaluating.set(true);
        this.error.set(null);
        this.success.set(null);
        this.api.evaluateMemberFines(id).subscribe({
            next: (r) => {
                this.evaluating.set(false);
                this.success.set(r.message);
                this.loadFines(id);
                this.api.getFinesSummary().subscribe({ next: (s) => this.summary.set(s), error: () => {} });
            },
            error: (e) => { this.evaluating.set(false); this.error.set(e?.error?.message ?? 'Evaluation failed.'); }
        });
    }

    evaluateAll() {
        if (this.evaluating()) return;
        this.evaluating.set(true);
        this.error.set(null);
        this.success.set(null);
        this.api.evaluateAllFines().subscribe({
            next: (r) => {
                this.evaluating.set(false);
                this.success.set(r.message);
                const id = this.selectedMemberId();
                if (id) this.loadFines(id);
                this.api.getFinesSummary().subscribe({ next: (s) => this.summary.set(s), error: () => {} });
            },
            error: (e) => { this.evaluating.set(false); this.error.set(e?.error?.message ?? 'Evaluation failed.'); }
        });
    }

    openWaive(fine: MemberFineDto) {
        this.waivedFine.set(fine);
        this.waiveForm.reset({ waiveType: 'full', waiveAmount: null, reason: '' });
        this.error.set(null);
        this.success.set(null);
    }

    cancelWaive() { this.waivedFine.set(null); }

    openPayment(fine: MemberFineDto) {
        this.payingFine.set(fine);
        const maxAmount = this.fineBalance(fine);
        this.paymentForm.reset({ paymentType: 'full', amountPaid: maxAmount, notes: '' });
        this.error.set(null);
        this.success.set(null);
    }

    cancelPayment() { this.payingFine.set(null); }

    confirmPayment() {
        const fine = this.payingFine();
        if (!fine || this.saving()) return;
        const v = this.paymentForm.getRawValue();
        const isPartial = v.paymentType === 'partial';
        if (!v.amountPaid || v.amountPaid <= 0) {
            this.error.set('Enter a valid payment amount.');
            return;
        }
        if (isPartial && v.amountPaid >= this.fineBalance(fine)) {
            this.error.set('For full payment, select "Full Payment" instead.');
            return;
        }
        this.saving.set(true);
        this.error.set(null);
        this.api.recordFinePayment(fine.fineId, {
            amountPaid: v.amountPaid,
            notes: v.notes?.trim() || null
        }).subscribe({
            next: () => {
                this.saving.set(false);
                this.payingFine.set(null);
                this.success.set('Fine payment recorded successfully.');
                const id = this.selectedMemberId();
                if (id) this.loadFines(id);
                this.api.getFinesSummary().subscribe({ next: (s) => this.summary.set(s), error: () => {} });
            },
            error: (e) => { this.saving.set(false); this.error.set(e?.error?.message ?? 'Payment recording failed.'); }
        });
    }

    confirmWaive() {
        const fine = this.waivedFine();
        if (!fine || this.saving()) return;
        const v = this.waiveForm.getRawValue();
        const isPartial = v.waiveType === 'partial';
        if (isPartial && (!v.waiveAmount || v.waiveAmount <= 0)) {
            this.error.set('Enter a valid waive amount for partial waive.');
            return;
        }
        this.saving.set(true);
        this.error.set(null);
        this.api.waiveFine(fine.fineId, {
            waiveAmount: isPartial ? v.waiveAmount : null,
            reason: v.reason?.trim() || null
        }).subscribe({
            next: () => {
                this.saving.set(false);
                this.waivedFine.set(null);
                this.success.set('Fine updated successfully.');
                const id = this.selectedMemberId();
                if (id) this.loadFines(id);
                this.api.getFinesSummary().subscribe({ next: (s) => this.summary.set(s), error: () => {} });
            },
            error: (e) => { this.saving.set(false); this.error.set(e?.error?.message ?? 'Waive failed.'); }
        });
    }

    fineBalance(f: MemberFineDto) { return f.fineAmount - f.waivedAmount - f.amountPaidSoFar; }

    statusBadge(s: string) {
        if (s === 'Active') return 'badge-danger';
        if (s === 'PartiallyWaived') return 'badge-warning';
        if (s === 'Paid') return 'badge-success';
        return 'badge-neutral';
    }
}
