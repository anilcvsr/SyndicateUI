import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { AdminApi } from '../../../core/services/admin.api';
import { YearlyContributionDto } from '../../../core/models/admin.models';

function dateRangeValidator(): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
        const start = group.get('startDate')?.value as string | null;
        const end = group.get('endDate')?.value as string | null;
        if (!start || !end) return null;
        return start <= end ? null : { dateRange: true };
    };
}

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

    allowMemberPaymentSubmission = signal(false);
    submissionSaving = signal(false);
    submissionError = signal<string | null>(null);
    submissionSuccess = signal<string | null>(null);

    form = this.fb.group({
        groupName: ['', [Validators.required, Validators.maxLength(150)]],
        fixedMonthlyAmount: [1000, [Validators.required, Validators.min(1)]],
        trackingStart: ['', [Validators.required]],
        trackingEnd: ['', [Validators.required]],
        currency: ['INR', [Validators.required]],
        openingBalance: [0, [Validators.required, Validators.min(0)]]
    });

    // ----- Yearly Contributions -----
    readonly today = this.toIsoDate(new Date());
    readonly currentYear = new Date().getFullYear();
    yearly = signal<YearlyContributionDto[]>([]);
    yearlyLoading = signal(true);
    yearlyError = signal<string | null>(null);
    yearlySuccess = signal<string | null>(null);
    yearlySaving = signal(false);
    showAdd = signal(false);
    editing = signal<YearlyContributionDto | null>(null);
    deleting = signal<YearlyContributionDto | null>(null);

    hasActivePeriod = computed(() => this.yearly().some(y => this.today >= y.startDate && this.today <= y.endDate));

    addForm = this.fb.group({
        year: this.fb.control<number>(this.currentYear, {
            nonNullable: true,
            validators: [Validators.required, Validators.min(1900), Validators.max(2200)]
        }),
        startDate: this.fb.control<string>(`${this.currentYear}-01-01`, { nonNullable: true, validators: [Validators.required] }),
        endDate: this.fb.control<string>(`${this.currentYear}-12-31`, { nonNullable: true, validators: [Validators.required] }),
        monthlyAmount: this.fb.control<number>(1000, {
            nonNullable: true,
            validators: [Validators.required, Validators.min(1)]
        }),
        notes: this.fb.control<string>('', { nonNullable: true, validators: [Validators.maxLength(500)] })
    }, { validators: [dateRangeValidator()] });

    editForm = this.fb.group({
        startDate: this.fb.control<string>('', { nonNullable: true, validators: [Validators.required] }),
        endDate: this.fb.control<string>('', { nonNullable: true, validators: [Validators.required] }),
        monthlyAmount: this.fb.control<number>(1000, {
            nonNullable: true,
            validators: [Validators.required, Validators.min(1)]
        }),
        notes: this.fb.control<string>('', { nonNullable: true, validators: [Validators.maxLength(500)] })
    }, { validators: [dateRangeValidator()] });

    constructor() {
        this.api.getSettings().subscribe({
            next: (s) => {
                this.form.patchValue({
                    groupName: s.groupName,
                    fixedMonthlyAmount: s.fixedMonthlyAmount,
                    trackingStart: s.trackingStart.slice(0, 10),
                    trackingEnd: s.trackingEnd.slice(0, 10),
                    currency: s.currency,
                    openingBalance: s.openingBalance
                });
                this.allowMemberPaymentSubmission.set(s.allowMemberPaymentSubmission);
                this.loading.set(false);
            },
            error: (e) => { this.error.set(e?.error?.message ?? 'Failed to load.'); this.loading.set(false); }
        });

        this.loadYearly();
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
            currency: v.currency!,
            openingBalance: v.openingBalance ?? 0
        }).subscribe({
            next: () => { this.saving.set(false); this.success.set('Settings saved.'); },
            error: (e) => { this.saving.set(false); this.error.set(e?.error?.message ?? 'Save failed.'); }
        });
    }

    togglePaymentSubmission(allow: boolean) {
        if (this.submissionSaving()) return;
        this.submissionError.set(null);
        this.submissionSuccess.set(null);
        this.submissionSaving.set(true);
        this.api.updatePaymentSubmission({ allowMemberPaymentSubmission: allow }).subscribe({
            next: (s) => {
                this.submissionSaving.set(false);
                this.allowMemberPaymentSubmission.set(s.allowMemberPaymentSubmission);
                this.submissionSuccess.set(
                    s.allowMemberPaymentSubmission
                        ? 'Members can now submit payments.'
                        : 'Member payment submission disabled.'
                );
            },
            error: (e) => {
                this.submissionSaving.set(false);
                this.submissionError.set(e?.error?.message ?? 'Failed to update setting.');
            }
        });
    }

    loadYearly() {
        this.yearlyLoading.set(true);
        this.yearlyError.set(null);
        this.api.listYearlyContributions().subscribe({
            next: (rows) => { this.yearly.set(rows); this.yearlyLoading.set(false); },
            error: (e) => {
                this.yearlyError.set(e?.error?.error ?? e?.error?.message ?? 'Failed to load yearly amounts.');
                this.yearlyLoading.set(false);
            }
        });
    }

    isActive(y: YearlyContributionDto): boolean {
        return this.today >= y.startDate && this.today <= y.endDate;
    }

    formatRange(y: YearlyContributionDto): string {
        return `${this.formatDate(y.startDate)} – ${this.formatDate(y.endDate)}`;
    }

    private formatDate(iso: string): string {
        const d = new Date(iso + 'T00:00:00');
        return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
    }

    private toIsoDate(d: Date): string {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }

    openAdd() {
        this.yearlyError.set(null);
        this.yearlySuccess.set(null);
        const lastAmount = this.yearly().length > 0 ? this.yearly()[0].monthlyAmount : 1000;
        this.addForm.reset({
            year: this.currentYear,
            startDate: `${this.currentYear}-01-01`,
            endDate: `${this.currentYear}-12-31`,
            monthlyAmount: lastAmount,
            notes: ''
        });
        this.showAdd.set(true);
    }

    cancelAdd() { this.showAdd.set(false); }

    onAddYearChange() {
        const y = this.addForm.controls.year.value;
        if (!y || y < 1900 || y > 2200) return;
        // Only auto-populate dates if both still match prior year defaults (touched but defaults).
        this.addForm.patchValue({
            startDate: `${y}-01-01`,
            endDate: `${y}-12-31`
        });
    }

    addYearly() {
        if (this.addForm.invalid || this.yearlySaving()) { this.addForm.markAllAsTouched(); return; }
        this.yearlySaving.set(true);
        this.yearlyError.set(null);
        const v = this.addForm.getRawValue();
        this.api.createYearlyContribution({
            year: v.year,
            startDate: v.startDate,
            endDate: v.endDate,
            monthlyAmount: v.monthlyAmount,
            notes: v.notes?.trim() ? v.notes.trim() : null
        }).subscribe({
            next: () => {
                this.yearlySaving.set(false);
                this.yearlySuccess.set(`Added contribution amount for ${v.year} (${v.startDate} to ${v.endDate}).`);
                this.showAdd.set(false);
                this.loadYearly();
            },
            error: (e) => {
                this.yearlySaving.set(false);
                this.yearlyError.set(e?.error?.error ?? e?.error?.message ?? 'Failed to add.');
            }
        });
    }

    openEdit(y: YearlyContributionDto) {
        this.editing.set(y);
        this.yearlyError.set(null);
        this.yearlySuccess.set(null);
        this.editForm.reset({
            startDate: y.startDate,
            endDate: y.endDate,
            monthlyAmount: y.monthlyAmount,
            notes: y.notes ?? ''
        });
    }

    cancelEdit() { this.editing.set(null); }

    saveEdit() {
        const y = this.editing();
        if (!y || this.editForm.invalid || this.yearlySaving()) { this.editForm.markAllAsTouched(); return; }
        this.yearlySaving.set(true);
        this.yearlyError.set(null);
        const v = this.editForm.getRawValue();
        this.api.updateYearlyContribution(y.id, {
            startDate: v.startDate,
            endDate: v.endDate,
            monthlyAmount: v.monthlyAmount,
            notes: v.notes?.trim() ? v.notes.trim() : null
        }).subscribe({
            next: () => {
                this.yearlySaving.set(false);
                this.yearlySuccess.set(`Updated contribution amount for ${y.year}.`);
                this.editing.set(null);
                this.loadYearly();
            },
            error: (e) => {
                this.yearlySaving.set(false);
                this.yearlyError.set(e?.error?.error ?? e?.error?.message ?? 'Update failed.');
            }
        });
    }

    askDelete(y: YearlyContributionDto) {
        this.yearlyError.set(null);
        this.yearlySuccess.set(null);
        this.deleting.set(y);
    }

    cancelDelete() { this.deleting.set(null); }

    confirmDelete() {
        const y = this.deleting();
        if (!y || this.yearlySaving()) return;
        this.yearlySaving.set(true);
        this.api.deleteYearlyContribution(y.id).subscribe({
            next: () => {
                this.yearlySaving.set(false);
                this.yearlySuccess.set(`Deleted contribution amount for ${y.year}.`);
                this.deleting.set(null);
                this.loadYearly();
            },
            error: (e) => {
                this.yearlySaving.set(false);
                this.yearlyError.set(e?.error?.error ?? e?.error?.message ?? 'Delete failed.');
                this.deleting.set(null);
            }
        });
    }
}
