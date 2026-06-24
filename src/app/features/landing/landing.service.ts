import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface CreateRegistrationRequestDto {
  syndicateName: string;
  contactPersonName: string;
  mobileNumber: string;
  emailAddress: string;
  city: string;
  state: string;
  expectedMembersCount: number;
  organizationName?: string;
  additionalNotes?: string;
}

@Injectable({ providedIn: 'root' })
export class LandingService {
  private http = inject(HttpClient);
  private base = environment.apiBaseUrl;

  submitRegistrationRequest(dto: CreateRegistrationRequestDto) {
    return this.http.post(`${this.base}/api/registration-requests`, dto);
  }
}
