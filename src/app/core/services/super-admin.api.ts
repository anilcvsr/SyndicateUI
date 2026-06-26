import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface SyndicateDto {
  syndicateId: number;
  syndicateName: string;
  address: string | null;
  phoneNumber: string | null;
  email: string | null;
  status: string;
  createdDate: string;
}

export interface SyndicateAdminInfoDto {
  userId: number;
  email: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface SyndicateDetailDto extends SyndicateDto {
  admin: SyndicateAdminInfoDto | null;
  memberCount: number;
}

export interface RecentActivityItemDto {
  type: string;
  message: string;
  timestamp: string;
}

export interface PlatformStatsDto {
  totalSyndicates: number;
  activeSyndicates: number;
  inactiveSyndicates: number;
  totalMembers: number;
  totalAdmins: number;
  totalCollections: number;
  totalLoans: number;
  recentActivity: RecentActivityItemDto[];
}

export interface CreateSyndicatePayload {
  syndicateName: string;
  address?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
}

export interface UpdateSyndicatePayload extends CreateSyndicatePayload {}

export interface CreateSyndicateAdminPayload {
  syndicateId: number;
  fullName: string;
  email: string;
  password: string;
}

export interface ResetAdminPasswordPayload {
  newPassword: string;
}

@Injectable({ providedIn: 'root' })
export class SuperAdminApi {
  private http = inject(HttpClient);
  private base = `${environment.apiBaseUrl}/api`;

  getPlatformStats() {
    return this.http.get<PlatformStatsDto>(`${this.base}/platform/stats`);
  }

  listSyndicates() {
    return this.http.get<SyndicateDto[]>(`${this.base}/syndicates`);
  }

  getSyndicate(id: number) {
    return this.http.get<SyndicateDetailDto>(`${this.base}/syndicates/${id}`);
  }

  createSyndicate(payload: CreateSyndicatePayload) {
    return this.http.post<SyndicateDto>(`${this.base}/syndicates`, payload);
  }

  updateSyndicate(id: number, payload: UpdateSyndicatePayload) {
    return this.http.put<SyndicateDto>(`${this.base}/syndicates/${id}`, payload);
  }

  updateSyndicateStatus(id: number, status: string) {
    return this.http.patch<SyndicateDto>(`${this.base}/syndicates/${id}/status`, { status });
  }

  createSyndicateAdmin(payload: CreateSyndicateAdminPayload) {
    return this.http.post<void>(`${this.base}/syndicates/admins`, payload);
  }

  resetAdminPassword(userId: number, newPassword: string) {
    return this.http.put<void>(`${this.base}/syndicates/admins/${userId}/reset-password`, { newPassword });
  }
}
