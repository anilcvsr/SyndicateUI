import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import {
  MemberHomeSummaryDto,
  MemberPaymentHistoryItemDto,
  MemberProfileDto,
  MemberProofDto
} from '../models/member.models';
import {
  ExpenseCategoryDto,
  ExpenseFilterQuery,
  ExpenseListResultDto,
  ExpenseSummaryDto
} from '../models/expense.models';
import {
  LoanDto,
  LoanFilterQuery,
  LoanListResultDto,
  LoanOutstandingDto,
  LoanRepaymentDto,
  MemberCreateLoanRepaymentPayload,
  MemberLoanSnapshotDto
} from '../models/loan.models';

@Injectable({ providedIn: 'root' })
export class MemberApi {
  private http = inject(HttpClient);
  private base = `${environment.apiBaseUrl}/api/member`;

  me() {
    return this.http.get<MemberProfileDto>(`${this.base}/me`);
  }
  homeSummary() {
    return this.http.get<MemberHomeSummaryDto>(`${this.base}/home/summary`);
  }
  history() {
    return this.http.get<MemberPaymentHistoryItemDto[]>(`${this.base}/payments`);
  }
  listProofs() {
    return this.http.get<MemberProofDto[]>(`${this.base}/proofs`);
  }
  submitProof(form: FormData) {
    return this.http.post<MemberProofDto>(`${this.base}/proofs`, form);
  }

  // ----- Expenses (read-only) -----
  listExpenseCategories() {
    return this.http.get<ExpenseCategoryDto[]>(`${this.base}/expense-categories`);
  }
  listExpenses(query: ExpenseFilterQuery = {}) {
    let params = new HttpParams();
    if (query.from) params = params.set('from', query.from);
    if (query.to) params = params.set('to', query.to);
    if (query.categoryIds && query.categoryIds.length) {
      params = params.set('categoryIds', query.categoryIds.join(','));
    }
    if (query.q) params = params.set('q', query.q);
    if (query.page) params = params.set('page', String(query.page));
    if (query.pageSize) params = params.set('pageSize', String(query.pageSize));
    return this.http.get<ExpenseListResultDto>(`${this.base}/expenses`, { params });
  }
  expenseSummary(from?: string, to?: string) {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get<ExpenseSummaryDto>(`${this.base}/expenses/summary`, { params });
  }

  // ----- Loans (read-only) -----
  listLoans(query: LoanFilterQuery = {}) {
    let params = new HttpParams();
    if (query.statuses && query.statuses.length) params = params.set('statuses', query.statuses.join(','));
    if (query.from) params = params.set('from', query.from);
    if (query.to) params = params.set('to', query.to);
    if (query.page) params = params.set('page', String(query.page));
    if (query.pageSize) params = params.set('pageSize', String(query.pageSize));
    return this.http.get<LoanListResultDto>(`${this.base}/loans`, { params });
  }
  getLoan(loanId: number) {
    return this.http.get<LoanDto>(`${this.base}/loans/${loanId}`);
  }
  listLoanRepayments(loanId: number) {
    return this.http.get<LoanRepaymentDto[]>(`${this.base}/loans/${loanId}/repayments`);
  }
  loanOutstanding(loanId: number) {
    return this.http.get<LoanOutstandingDto>(`${this.base}/loans/${loanId}/outstanding`);
  }
  recordLoanRepayment(loanId: number, payload: MemberCreateLoanRepaymentPayload) {
    return this.http.post<LoanRepaymentDto>(`${this.base}/loans/${loanId}/repayments`, payload);
  }
  loanSnapshot() {
    return this.http.get<MemberLoanSnapshotDto>(`${this.base}/loans/snapshot`);
  }
}
