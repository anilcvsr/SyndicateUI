import { Injectable, computed, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AdminLoginPayload,
  MemberOtpRequestPayload,
  MemberOtpVerifyPayload,
  OtpRequestResponse,
  TokenResponse,
  UserRole
} from '../models/auth.models';

const STORAGE_KEY = 'syndicate.auth';

interface StoredAuth {
  accessToken: string;
  refreshToken: string;
  role: UserRole;
  displayName: string;
  memberId: number | null;
  memberCode: string | null;
  expiresAtMs: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private _auth = signal<StoredAuth | null>(this.readStorage());
  auth = this._auth.asReadonly();
  isAuthenticated = computed(() => this._auth() !== null);
  role = computed(() => this._auth()?.role ?? null);
  displayName = computed(() => this._auth()?.displayName ?? '');
  memberId = computed(() => this._auth()?.memberId ?? null);
  memberCode = computed(() => this._auth()?.memberCode ?? null);

  adminLogin(payload: AdminLoginPayload): Observable<TokenResponse> {
    return this.http
      .post<TokenResponse>(`${environment.apiBaseUrl}/api/auth/admin/login`, payload)
      .pipe(tap((r) => this.persist(r)));
  }

  requestMemberOtp(payload: MemberOtpRequestPayload): Observable<OtpRequestResponse> {
    return this.http.post<OtpRequestResponse>(`${environment.apiBaseUrl}/api/auth/member/request-otp`, payload);
  }

  verifyMemberOtp(payload: MemberOtpVerifyPayload): Observable<TokenResponse> {
    return this.http
      .post<TokenResponse>(`${environment.apiBaseUrl}/api/auth/member/verify-otp`, payload)
      .pipe(tap((r) => this.persist(r)));
  }

  logout(): void {
    this._auth.set(null);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    this.router.navigate(['/login']);
  }

  getAccessToken(): string | null {
    const a = this._auth();
    if (!a) return null;
    if (Date.now() >= a.expiresAtMs) return null;
    return a.accessToken;
  }

  private persist(r: TokenResponse): void {
    const stored: StoredAuth = {
      accessToken: r.accessToken,
      refreshToken: r.refreshToken,
      role: r.role,
      displayName: r.displayName,
      memberId: r.memberId,
      memberCode: r.memberCode,
      expiresAtMs: Date.now() + r.expiresInSeconds * 1000
    };
    this._auth.set(stored);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    }
  }

  private readStorage(): StoredAuth | null {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as StoredAuth;
      if (!parsed.expiresAtMs || Date.now() >= parsed.expiresAtMs) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }
}
