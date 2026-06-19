// ----- Expense Category DTOs -----

export interface ExpenseCategoryDto {
  categoryId: number;
  name: string;
  isSystem: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface CreateExpenseCategoryPayload {
  name: string;
}

export interface UpdateExpenseCategoryPayload {
  name: string;
  isActive: boolean;
}

// ----- Expense DTOs -----

export interface ExpenseDto {
  expenseId: number;
  expenseDate: string;
  categoryId: number;
  categoryName: string;
  amount: number;
  description: string;
  recordedByUserId: number | null;
  recordedByName: string | null;
  createdAt: string;
  updatedAt: string;
  rowVersion: string;
}

export interface CreateExpensePayload {
  expenseDate: string;
  categoryId: number;
  amount: number;
  description: string;
}

export interface UpdateExpensePayload {
  expenseDate: string;
  categoryId: number;
  amount: number;
  description: string;
  rowVersion: string;
}

export interface ExpenseListResultDto {
  totalCount: number;
  page: number;
  pageSize: number;
  items: ExpenseDto[];
}

export interface ExpenseAuditEntryDto {
  auditLogId: number;
  userId: number | null;
  action: string;
  details: string | null;
  createdAt: string;
}

// ----- Summary DTOs -----

export interface ExpenseCategoryBreakdownDto {
  categoryId: number;
  categoryName: string;
  count: number;
  totalAmount: number;
  percentage: number;
}

export interface ExpenseMonthlyTrendDto {
  month: string;
  totalAmount: number;
  count: number;
}

export interface CollectionVsExpenseDto {
  month: string;
  collected: number;
  expenses: number;
  net: number;
}

export interface TopExpenseDto {
  expenseId: number;
  expenseDate: string;
  categoryName: string;
  amount: number;
  description: string;
}

export interface ExpenseSummaryDto {
  totalCollected: number;
  totalExpenses: number;
  netBalance: number;
  expensesThisMonth: number;
  fromDate: string;
  toDate: string;
  categoryBreakdown: ExpenseCategoryBreakdownDto[];
  monthlyTrend: ExpenseMonthlyTrendDto[];
  top5Expenses: TopExpenseDto[];
  collectionVsExpense: CollectionVsExpenseDto[];
}

// ----- Filter Query -----

export interface ExpenseFilterQuery {
  from?: string;
  to?: string;
  categoryIds?: number[];
  minAmount?: number;
  maxAmount?: number;
  q?: string;
  page?: number;
  pageSize?: number;
}
