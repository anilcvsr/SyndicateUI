// ----- Category DTOs -----

export interface AdditionalCollectionCategoryDto {
  categoryId: number;
  name: string;
  isSystem: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface CreateAdditionalCollectionCategoryPayload {
  name: string;
}

export interface UpdateAdditionalCollectionCategoryPayload {
  name: string;
  isActive: boolean;
}

// ----- Collection DTOs -----

export interface AdditionalCollectionDto {
  collectionId: number;
  collectionDate: string;
  categoryId: number;
  categoryName: string;
  amount: number;
  description: string | null;
  memberId: number | null;
  memberName: string | null;
  referenceNumber: string | null;
  createdByUserId: number | null;
  createdByName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAdditionalCollectionPayload {
  collectionDate: string;
  categoryId: number;
  amount: number;
  description?: string | null;
  memberId?: number | null;
  referenceNumber?: string | null;
}

export interface UpdateAdditionalCollectionPayload {
  collectionDate: string;
  categoryId: number;
  amount: number;
  description?: string | null;
  memberId?: number | null;
  referenceNumber?: string | null;
}

export interface AdditionalCollectionListResultDto {
  totalCount: number;
  page: number;
  pageSize: number;
  items: AdditionalCollectionDto[];
}

export interface AdditionalCollectionAuditEntryDto {
  auditLogId: number;
  userId: number | null;
  action: string;
  details: string | null;
  createdAt: string;
}

export interface AdditionalCollectionFilterQuery {
  from?: string;
  to?: string;
  categoryIds?: number[];
  memberId?: number;
  q?: string;
  page?: number;
  pageSize?: number;
}
