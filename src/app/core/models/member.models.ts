export interface MemberProfileDto {
  memberId: number;
  memberCode: string;
  fullName: string;
  email: string | null;
  phone: string;
  joiningDate: string;
}

export interface MemberHomeSummaryDto {
  profile: MemberProfileDto;
  totalExpected: number;
  totalPaid: number;
  outstanding: number;
  lastPaymentDate: string | null;
  status: 'Overdue' | 'Partial' | 'OnTrack' | string;
  groupCollectionPct: number;
  groupExpected: number;
  groupCollected: number;
  groupTotalCollected: number;
  groupTotalExpenses: number;
  groupInterestPaid: number;
  groupOutstandingLoans: number;
  groupNetBalance: number;
  allowMemberPaymentSubmission: boolean;
}

export interface MemberPaymentHistoryItemDto {
  month: string;
  expected: number;
  paid: number;
  datePaid: string | null;
  status: string;
  remarks: string | null;
}

export interface MemberProofDto {
  proofId: number;
  monthYear: string;
  claimedAmount: number;
  paymentMode: string | null;
  referenceNo: string | null;
  fileUrl: string;
  status: 'Pending' | 'Approved' | 'Rejected' | string;
  rejectionReason: string | null;
  submittedAt: string;
  reviewedAt: string | null;
}

export interface MemberFineViewDto {
  fineId: number;
  monthReference: string;
  fineAmount: number;
  status: string;
  waivedAmount: number;
  appliedAt: string;
}

export interface NotificationDto {
  notificationId: number;
  message: string;
  isRead: boolean;
  createdAt: string;
}
