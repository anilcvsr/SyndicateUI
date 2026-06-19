export type UserRole = 'Admin' | 'Member';

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  role: UserRole;
  expiresInSeconds: number;
  displayName: string;
  memberId: number | null;
  memberCode: string | null;
}

export interface OtpRequestResponse {
  message: string;
  devOtp: string | null;
}

export interface AdminLoginPayload {
  email: string;
  password: string;
}

export interface MemberOtpRequestPayload {
  phone: string;
}

export interface MemberOtpVerifyPayload {
  phone: string;
  otp: string;
}
