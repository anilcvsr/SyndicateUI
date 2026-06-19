export interface MemberDto {
  memberId: number;
  memberCode: string;
  fullName: string;
  email: string | null;
  phone: string;
  joiningDate: string;
  isActive: boolean;
}

export interface CreateMemberPayload {
  fullName: string;
  email: string | null;
  phone: string;
  joiningDate: string;
}

export interface UpdateMemberPayload extends CreateMemberPayload {
  isActive: boolean;
}

export interface RecordPaymentPayload {
  memberId: number;
  dateReceived: string;
  months: string[];
  amountPaid: number;
  paymentMode: string;
  referenceNo: string | null;
  remarks: string | null;
}

export interface PaymentDto {
  paymentId: number;
  memberId: number;
  memberCode: string;
  memberName: string;
  monthYear: string;
  expectedAmount: number;
  paidAmount: number;
  datePaid: string | null;
  paymentMode: string | null;
  referenceNo: string | null;
  status: string;
  remarks: string | null;
}

export interface UpdatePaymentPayload {
  datePaid: string | null;
  paidAmount: number;
  paymentMode: string | null;
  referenceNo: string | null;
  remarks: string | null;
  reason: string | null;
}

export interface PaymentAuditEntryDto {
  auditLogId: number;
  userId: number | null;
  action: string;
  details: string | null;
  createdAt: string;
}

export interface DashboardSummaryDto {
  totalMembers: number;
  totalExpectedYtd: number;
  totalCollectedYtd: number;
  totalOutstanding: number;
  collectionRatePct: number;
  membersOverdue: number;
  membersPartial: number;
  membersOnTrack: number;
}

export interface MonthlyCollectionDto {
  month: string;
  activeMembers: number;
  expected: number;
  collected: number;
  gap: number;
  collectionPct: number;
}

export interface PendingDueDto {
  priority: 'HIGH' | 'MED' | 'LOW' | string;
  memberId: number;
  memberCode: string;
  memberName: string;
  monthsPending: number;
  totalDue: number;
  lastPaymentDate: string | null;
}

export interface AppSettingsDto {
  settingsId: number;
  groupName: string;
  fixedMonthlyAmount: number;
  trackingStart: string;
  trackingEnd: string;
  currency: string;
  allowMemberPaymentSubmission: boolean;
}

export interface UpdatePaymentSubmissionPayload {
  allowMemberPaymentSubmission: boolean;
}

export interface UpdateAppSettingsPayload {
  groupName: string;
  fixedMonthlyAmount: number;
  trackingStart: string;
  trackingEnd: string;
  currency: string;
}

export interface ProofVerificationDto {
  proofId: number;
  memberId: number;
  memberCode: string;
  memberName: string;
  monthYear: string;
  claimedAmount: number;
  paymentMode: string | null;
  referenceNo: string | null;
  fileUrl: string;
  status: string;
  rejectionReason: string | null;
  submittedAt: string;
  reviewedAt: string | null;
}

export interface MonthlyLogCellDto {
  month: string;
  expected: number;
  paid: number;
  status: string;
}

export interface MonthlyLogRowDto {
  memberId: number;
  memberCode: string;
  memberName: string;
  joiningDate: string;
  cells: MonthlyLogCellDto[];
  totalExpected: number;
  totalPaid: number;
  totalDue: number;
}

export interface MonthlyColumnTotalDto {
  month: string;
  expected: number;
  collected: number;
}

export interface MonthlyLogDto {
  months: string[];
  rows: MonthlyLogRowDto[];
  columnTotals: MonthlyColumnTotalDto[];
}

export interface YearlyContributionDto {
  id: number;
  year: number;
  startDate: string;
  endDate: string;
  monthlyAmount: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateYearlyContributionPayload {
  year: number;
  startDate: string;
  endDate: string;
  monthlyAmount: number;
  notes: string | null;
}

export interface UpdateYearlyContributionPayload {
  startDate: string;
  endDate: string;
  monthlyAmount: number;
  notes: string | null;
}
