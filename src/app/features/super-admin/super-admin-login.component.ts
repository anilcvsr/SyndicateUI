import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-super-admin-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './super-admin-login.component.html',
  styleUrl: './super-admin-login.component.scss'
})
export class SuperAdminLoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  loading = signal(false);
  error = signal<string | null>(null);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  ngOnInit() {
    if (this.auth.role() === 'SuperAdmin') {
      this.router.navigate(['/super-admin/dashboard']);
    }
  }

  submit() {
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    const v = this.form.getRawValue();
    this.auth.superAdminLogin({ email: v.email!, password: v.password! }).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/super-admin/dashboard']);
      },
      error: (e) => {
        this.loading.set(false);
        this.error.set(e?.error?.message ?? 'Invalid credentials or account locked.');
      }
    });
  }
}
