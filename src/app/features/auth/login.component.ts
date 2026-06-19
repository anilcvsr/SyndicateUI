import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

type Tab = 'admin' | 'member';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  tab = signal<Tab>('admin');
  loading = signal(false);
  error = signal<string | null>(null);
  otpSent = signal(false);
  resendIn = signal(0);
  devOtpHint = signal<string | null>(null);

  adminForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  memberIdForm = this.fb.group({
    phone: ['', [Validators.required, Validators.pattern(/^\+?\d[\d\s\-()]{7,}$/)]]
  });

  otpForm = this.fb.group({
    otp: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
  });

  setTab(t: Tab) {
    this.tab.set(t);
    this.error.set(null);
    this.otpSent.set(false);
    this.devOtpHint.set(null);
  }

  submitAdmin() {
    if (this.adminForm.invalid || this.loading()) {
      this.adminForm.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    const v = this.adminForm.getRawValue();
    this.auth.adminLogin({ email: v.email!, password: v.password! }).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/admin/dashboard']);
      },
      error: (e) => {
        this.loading.set(false);
        this.error.set(e?.error?.message ?? 'Invalid credentials or account locked.');
      }
    });
  }

  requestOtp() {
    if (this.memberIdForm.invalid || this.loading()) {
      this.memberIdForm.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    const phone = this.memberIdForm.value.phone!.trim();
    this.auth.requestMemberOtp({ phone }).subscribe({
      next: (r) => {
        this.loading.set(false);
        this.otpSent.set(true);
        this.devOtpHint.set(r.devOtp);
        this.startResendCooldown();
      },
      error: (e) => {
        this.loading.set(false);
        this.error.set(e?.error?.message ?? 'Unable to send OTP. Try again.');
      }
    });
  }

  submitOtp() {
    if (this.otpForm.invalid || this.loading()) {
      this.otpForm.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    const phone = this.memberIdForm.value.phone!.trim();
    const otp = this.otpForm.value.otp!;
    this.auth.verifyMemberOtp({ phone, otp }).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/member/home']);
      },
      error: (e) => {
        this.loading.set(false);
        this.error.set(e?.error?.message ?? 'Invalid or expired OTP.');
      }
    });
  }

  private startResendCooldown() {
    this.resendIn.set(30);
    const timer = setInterval(() => {
      const next = this.resendIn() - 1;
      this.resendIn.set(next);
      if (next <= 0) clearInterval(timer);
    }, 1000);
  }
}
