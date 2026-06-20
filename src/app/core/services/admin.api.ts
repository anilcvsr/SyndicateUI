import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AppSettingsDto,
  CreateMemberPayload,
  CreateYearlyContributionPayload,
  DashboardSummaryDto,
  FineSettingsDto,
  MemberDto,
  MemberFineDto,
  MemberFineOverridePayload,
  MonthlyCollectionDto,
  MonthlyLogDto,
  PaymentAuditEntryDto,
  PaymentDto,
  PendingDueDto,
  ProofVerificationDto,
  RecordFinePaymentPayload,
  RecordPaymentPayload,
  UpdateAppSettingsPayload,
  UpdateFineSettingsPayload,
  UpdateMemberPayload,
  UpdatePaymentPayload,
  UpdatePaymentSubmissionPayload,
  UpdateYearlyContributionPayload,
  WaiveFinePayload,
  YearlyContributionDto
} from '../models/admin.models';
import {
  CreateExpenseCategoryPayload,
  CreateExpensePayload,
  ExpenseAuditEntryDto,
  ExpenseCategoryDto,
  ExpenseDto,
  ExpenseFilterQuery,
  ExpenseListResultDto,
  ExpenseSummaryDto,
  UpdateExpenseCategoryPayload,
  UpdateExpensePayload
} from '../models/expense.models';
import {
  CreateLoanPayload,
  CreateLoanRepaymentPayload,
  LoanAuditEntryDto,
  LoanDto,
  LoanFilterQuery,
  LoanListResultDto,
  LoanReconciliationResultDto,
  LoanRepaymentAuditEntryDto,
  LoanRepaymentDto,
  LoanRepaymentMutationResultDto,
  LoanSummaryDto,
  UpdateLoanPayload,
  UpdateLoanRepaymentPayload
} from '../models/loan.models';

@Injectable({ providedIn: 'root' })
export class AdminApi {
  private http = inject(HttpClient);
  private base = `${environment.apiBaseUrl}/api/admin`;

  summary() {
    return this.http.get<DashboardSummaryDto>(`${this.base}/dashboard/summary`);
  }
  monthlyCollection() {
    return this.http.get<MonthlyCollectionDto[]>(`${this.base}/dashboard/monthly-collection`);
  }
  pendingDues() {
    return this.http.get<PendingDueDto[]>(`${this.base}/dues/pending`);
  }

  listMembers(includeInactive = false) {
    const params = new HttpParams().set('includeInactive', String(includeInactive));
    return this.http.get<MemberDto[]>(`${this.base}/members`, { params });
  }
  createMember(payload: CreateMemberPayload) {
    return this.http.post<MemberDto>(`${this.base}/members`, payload);
  }
  updateMember(id: number, payload: UpdateMemberPayload) {
    return this.http.put<MemberDto>(`${this.base}/members/${id}`, payload);
  }
  deactivateMember(id: number) {
    return this.http.delete<void>(`${this.base}/members/${id}`);
  }

  recordPayment(payload: RecordPaymentPayload) {
    return this.http.post<PaymentDto[]>(`${this.base}/payments`, payload);
  }
  listPayments(memberId?: number, month?: string) {
    let params = new HttpParams();
    if (memberId) params = params.set('memberId', String(memberId));
    if (month) params = params.set('month', month);
    return this.http.get<PaymentDto[]>(`${this.base}/payments`, { params });
  }
  getPayment(paymentId: number) {
    return this.http.get<PaymentDto>(`${this.base}/payments/${paymentId}`);
  }
  updatePayment(paymentId: number, payload: UpdatePaymentPayload) {
    return this.http.put<PaymentDto>(`${this.base}/payments/${paymentId}`, payload);
  }
  paymentAudit(paymentId: number) {
    return this.http.get<PaymentAuditEntryDto[]>(`${this.base}/payments/${paymentId}/audit`);
  }

  monthlyLog() {
    return this.http.get<MonthlyLogDto>(`${this.base}/monthly-log`);
  }

  listVerifications(): Observable<ProofVerificationDto[]> {
    return this.http.get<ProofVerificationDto[]>(`${this.base}/verifications`);
  }
  approveVerification(id: number) {
    return this.http.post<void>(`${this.base}/verifications/${id}/approve`, {});
  }
  rejectVerification(id: number, reason: string) {
    return this.http.post<void>(`${this.base}/verifications/${id}/reject`, { reason });
  }

  getSettings() {
    return this.http.get<AppSettingsDto>(`${this.base}/settings`);
  }
  updateSettings(payload: UpdateAppSettingsPayload) {
    return this.http.put<AppSettingsDto>(`${this.base}/settings`, payload);
  }
  updatePaymentSubmission(payload: UpdatePaymentSubmissionPayload) {
    return this.http.put<AppSettingsDto>(`${this.base}/settings/payment-submission`, payload);
  }

  // ----- Yearly Contributions -----
  listYearlyContributions() {
    return this.http.get<YearlyContributionDto[]>(`${this.base}/yearly-contributions`);
  }
  createYearlyContribution(payload: CreateYearlyContributionPayload) {
    return this.http.post<YearlyContributionDto>(`${this.base}/yearly-contributions`, payload);
  }
  updateYearlyContribution(id: number, payload: UpdateYearlyContributionPayload) {
    return this.http.put<YearlyContributionDto>(`${this.base}/yearly-contributions/${id}`, payload);
  }
  deleteYearlyContribution(id: number) {
    return this.http.delete<void>(`${this.base}/yearly-contributions/${id}`);
  }

  // ----- Expense Categories -----
  listExpenseCategories() {
    return this.http.get<ExpenseCategoryDto[]>(`${this.base}/expense-categories`);
  }
  createExpenseCategory(payload: CreateExpenseCategoryPayload) {
    return this.http.post<ExpenseCategoryDto>(`${this.base}/expense-categories`, payload);
  }
  updateExpenseCategory(id: number, payload: UpdateExpenseCategoryPayload) {
    return this.http.put<ExpenseCategoryDto>(`${this.base}/expense-categories/${id}`, payload);
  }

  // ----- Expenses -----
  listExpenses(query: ExpenseFilterQuery = {}) {
    let params = new HttpParams();
    if (query.from) params = params.set('from', query.from);
    if (query.to) params = params.set('to', query.to);
    if (query.categoryIds && query.categoryIds.length) {
      params = params.set('categoryIds', query.categoryIds.join(','));
    }
    if (query.minAmount != null) params = params.set('minAmount', String(query.minAmount));
    if (query.maxAmount != null) params = params.set('maxAmount', String(query.maxAmount));
    if (query.q) params = params.set('q', query.q);
    if (query.page) params = params.set('page', String(query.page));
    if (query.pageSize) params = params.set('pageSize', String(query.pageSize));
    return this.http.get<ExpenseListResultDto>(`${this.base}/expenses`, { params });
  }
  getExpense(expenseId: number) {
    return this.http.get<ExpenseDto>(`${this.base}/expenses/${expenseId}`);
  }
  createExpense(payload: CreateExpensePayload) {
    return this.http.post<ExpenseDto>(`${this.base}/expenses`, payload);
  }
  updateExpense(expenseId: number, payload: UpdateExpensePayload) {
    return this.http.put<ExpenseDto>(`${this.base}/expenses/${expenseId}`, payload);
  }
  deleteExpense(expenseId: number, reason?: string | null) {
    let params = new HttpParams();
    if (reason) params = params.set('reason', reason);
    return this.http.delete<void>(`${this.base}/expenses/${expenseId}`, { params });
  }
  expenseHistory(expenseId: number) {
    return this.http.get<ExpenseAuditEntryDto[]>(`${this.base}/expenses/${expenseId}/history`);
  }
  expenseSummary(from?: string, to?: string) {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get<ExpenseSummaryDto>(`${this.base}/expenses/summary`, { params });
  }

  // ----- Loans -----
  listLoans(query: LoanFilterQuery = {}) {
    let params = new HttpParams();
    if (query.memberId != null) params = params.set('memberId', String(query.memberId));
    if (query.statuses && query.statuses.length) params = params.set('statuses', query.statuses.join(','));
    if (query.from) params = params.set('from', query.from);
    if (query.to) params = params.set('to', query.to);
    if (query.overdueOnly) params = params.set('overdueOnly', 'true');
    if (query.q) params = params.set('q', query.q);
    if (query.page) params = params.set('page', String(query.page));
    if (query.pageSize) params = params.set('pageSize', String(query.pageSize));
    return this.http.get<LoanListResultDto>(`${this.base}/loans`, { params });
  }
  getLoan(loanId: number) {
    return this.http.get<LoanDto>(`${this.base}/loans/${loanId}`);
  }
  createLoan(payload: CreateLoanPayload) {
    return this.http.post<LoanDto>(`${this.base}/loans`, payload);
  }
  updateLoan(loanId: number, payload: UpdateLoanPayload) {
    return this.http.put<LoanDto>(`${this.base}/loans/${loanId}`, payload);
  }
  deleteLoan(loanId: number, reason?: string | null) {
    let params = new HttpParams();
    if (reason) params = params.set('reason', reason);
    return this.http.delete<void>(`${this.base}/loans/${loanId}`, { params });
  }
  loanHistory(loanId: number) {
    return this.http.get<LoanAuditEntryDto[]>(`${this.base}/loans/${loanId}/history`);
  }
  loanSummary(from?: string, to?: string) {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get<LoanSummaryDto>(`${this.base}/loans/summary`, { params });
  }
  markOverdueLoans() {
    return this.http.post<{ updated: number }>(`${this.base}/loans/mark-overdue`, {});
  }
  reconcileLoans(apply = false) {
    const params = new HttpParams().set('apply', String(apply));
    return this.http.post<LoanReconciliationResultDto>(`${this.base}/loans/reconcile`, {}, { params });
  }
  listLoanRepayments(loanId: number) {
    return this.http.get<LoanRepaymentDto[]>(`${this.base}/loans/${loanId}/repayments`);
  }
  recordLoanRepayment(loanId: number, payload: CreateLoanRepaymentPayload) {
    return this.http.post<LoanRepaymentDto>(`${this.base}/loans/${loanId}/repayments`, payload);
  }
  updateLoanRepayment(repaymentId: number, payload: UpdateLoanRepaymentPayload, force = false) {
    const params = new HttpParams().set('force', String(force));
    return this.http.put<LoanRepaymentMutationResultDto>(
      `${this.base}/loans/repayments/${repaymentId}`,
      payload,
      { params }
    );
  }
  deleteLoanRepayment(repaymentId: number, reason?: string | null, force = false) {
    let params = new HttpParams().set('force', String(force));
    if (reason) params = params.set('reason', reason);
    return this.http.delete<LoanRepaymentMutationResultDto>(
      `${this.base}/loans/repayments/${repaymentId}`,
      { params }
    );
  }
  loanRepaymentAudit(repaymentId: number) {
    return this.http.get<LoanRepaymentAuditEntryDto[]>(
      `${this.base}/loans/repayments/${repaymentId}/audit`
    );
  }

  // ----- Fines -----
  getMemberFines(memberId: number) {
    return this.http.get<MemberFineDto[]>(`${this.base}/fines/member/${memberId}`);
  }
  evaluateMemberFines(memberId: number) {
    return this.http.post<{ message: string }>(`${this.base}/fines/member/${memberId}/evaluate`, {});
  }
  evaluateAllFines() {
    return this.http.post<{ message: string }>(`${this.base}/fines/evaluate-all`, {});
  }
  waiveFine(fineId: number, payload: WaiveFinePayload) {
    return this.http.put<MemberFineDto>(`${this.base}/fines/${fineId}/waive`, payload);
  }
  recordFinePayment(fineId: number, payload: RecordFinePaymentPayload) {
    return this.http.post<MemberFineDto>(`${this.base}/fines/${fineId}/pay`, payload);
  }
  getFineSettings() {
    return this.http.get<FineSettingsDto>(`${this.base}/fines/settings`);
  }
  updateFineSettings(payload: UpdateFineSettingsPayload) {
    return this.http.put<FineSettingsDto>(`${this.base}/fines/settings`, payload);
  }
  setMemberFineOverride(memberId: number, payload: MemberFineOverridePayload) {
    return this.http.put<MemberDto>(`${this.base}/fines/member/${memberId}/override`, payload);
  }
}
