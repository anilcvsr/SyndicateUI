export type LoanStatus = 'Active' | 'PartiallyPaid' | 'Closed' | 'Overdue';
export type LoanInterestType = 'Simple' | 'MonthlyRecurring';
export type LoanRepaymentMode = 'Full' | 'Installment';
export type LoanPaymentMode = 'Cash' | 'Transfer';

export interface LoanDto {
  loanId: number;
  loanCode: string;
  memberId: number;
  memberName: string;
  memberCode: string;
  principalAmount: number;
  interestRate: number;
  interestType: LoanInterestType;
  interestAmount: number;
  accruedInterest: number;
  releaseDate: string;
  expectedReturnDate: string;
  tenureMonths: number;
  purpose: string | null;
  repaymentMode: LoanRepaymentMode;
  status: LoanStatus;
  actualClosureDate: string | null;
  remarks: string | null;
  amountPaidSoFar: number;
  principalPaid: number;
  interestPaid: number;
  outstandingBalance: number;
  repaymentCount: number;
  daysOverdue: number | null;
  recordedByUserId: number | null;
  recordedByName: string | null;
  createdAt: string;
  updatedAt: string;
  rowVersion: string;
}

export interface CreateLoanPayload {
  memberId: number;
  principalAmount: number;
  interestRate: number;
  interestType: LoanInterestType;
  releaseDate: string;
  expectedReturnDate: string;
  purpose: string | null;
  repaymentMode: LoanRepaymentMode;
  remarks: string | null;
}

export interface UpdateLoanPayload extends CreateLoanPayload {
  rowVersion: string;
}

export interface LoanListResultDto {
  totalCount: number;
  page: number;
  pageSize: number;
  items: LoanDto[];
}

export interface LoanAuditEntryDto {
  auditLogId: number;
  userId: number | null;
  action: string;
  details: string | null;
  createdAt: string;
}

export interface LoanRepaymentAuditEntryDto {
  auditLogId: number;
  userId: number | null;
  userEmail: string | null;
  action: string;
  createdAt: string;
  before: unknown | null;
  after: unknown | null;
  prevLoanStatus: LoanStatus | null;
  newLoanStatus: LoanStatus | null;
  reason: string | null;
  forced: boolean | null;
  projectedAvailableBalance: number | null;
}

export interface LoanRepaymentDto {
  repaymentId: number;
  loanId: number;
  loanCode: string;
  repaymentDate: string;
  amount: number;
  principalPortion: number;
  interestPortion: number;
  paymentMode: LoanPaymentMode;
  referenceNo: string | null;
  notes: string | null;
  recordedByUserId: number | null;
  recordedByName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLoanRepaymentPayload {
  repaymentDate: string;
  amount: number;
  paymentMode: LoanPaymentMode;
  referenceNo: string | null;
  notes: string | null;
}

export interface UpdateLoanRepaymentPayload {
  repaymentDate: string;
  principalPortion: number;
  interestPortion: number;
  paymentMode: LoanPaymentMode;
  referenceNo: string | null;
  notes: string | null;
  reason: string | null;
  expectedUpdatedAt: string | null;
}

export interface LoanRepaymentMutationResultDto {
  repayment: LoanRepaymentDto | null;
  prevLoanStatus: LoanStatus;
  newLoanStatus: LoanStatus;
  reopened: boolean;
  projectedAvailableBalance: number;
}

export interface SoftBlockResponseDto {
  error: string;
  code: string;
  projectedAvailableBalance: number;
  currentAvailableBalance: number;
}

export interface LoanReconciliationItemDto {
  loanId: number;
  loanCode: string;
  memberName: string;
  storedStatus: LoanStatus;
  computedStatus: LoanStatus;
  storedClosureDate: string | null;
  computedClosureDate: string | null;
  principalOutstanding: number;
  interestOutstanding: number;
}

export interface LoanReconciliationResultDto {
  applied: boolean;
  totalLoansScanned: number;
  loansNeedingFix: number;
  loansFixed: number;
  currentAvailableBalance: number;
  diffs: LoanReconciliationItemDto[];
}

export type MemberRepaymentType = 'PrincipalOnly' | 'InterestOnly' | 'PrincipalPlusInterest';

export interface MemberCreateLoanRepaymentPayload {
  repaymentDate: string;
  repaymentType: MemberRepaymentType;
  principalAmount: number | null;
  interestAmount: number | null;
  paymentMode: LoanPaymentMode;
  referenceNo: string | null;
  notes: string | null;
}

export interface LoanOutstandingDto {
  loanId: number;
  loanCode: string;
  principalOutstanding: number;
  interestOutstanding: number;
  totalOutstanding: number;
  status: LoanStatus;
}

export interface LoanStatusBreakdownDto {
  status: LoanStatus;
  count: number;
  totalAmount: number;
}

export interface LoanMonthlyDisbursementDto {
  month: string;
  totalAmount: number;
  count: number;
}

export interface LoanMemberSummaryDto {
  memberId: number;
  memberName: string;
  memberCode: string;
  activeLoans: number;
  totalPrincipal: number;
  outstanding: number;
  repaid: number;
}

export interface LoanSummaryDto {
  totalLoansIssuedCount: number;
  totalLoansIssuedAmount: number;
  totalOutstanding: number;
  totalRepaidPrincipal: number;
  totalInterestEarned: number;
  activeCount: number;
  overdueCount: number;
  overdueAmount: number;
  availableFundAfterLoans: number;
  totalCollected: number;
  totalExpenses: number;
  fromDate: string;
  toDate: string;
  statusBreakdown: LoanStatusBreakdownDto[];
  monthlyDisbursement: LoanMonthlyDisbursementDto[];
  memberSummary: LoanMemberSummaryDto[];
}

export interface MemberLoanSnapshotDto {
  activeLoanCount: number;
  totalOutstanding: number;
  totalPrincipalBorrowed: number;
  totalRepaid: number;
  nextDueDate: string | null;
  nextDueInDays: number | null;
  overdueCount: number;
}

export interface LoanFilterQuery {
  memberId?: number;
  statuses?: LoanStatus[];
  from?: string;
  to?: string;
  overdueOnly?: boolean;
  q?: string;
  page?: number;
  pageSize?: number;
}
