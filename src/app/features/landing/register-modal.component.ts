import { Component, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { LandingService } from './landing.service';

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
  'Uttarakhand','West Bengal','Andaman and Nicobar Islands','Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu','Delhi','Jammu and Kashmir',
  'Ladakh','Lakshadweep','Puducherry'
];

@Component({
  selector: 'app-register-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="modal-backdrop" (click)="onBackdropClick($event)">
      <div class="modal-box" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div class="modal-header">
          <h2 id="modal-title">Request Syndicate Setup</h2>
          <button class="close-btn" (click)="close.emit()" aria-label="Close">&times;</button>
        </div>

        @if (submitted()) {
          <div class="success-panel">
            <div class="success-icon">✅</div>
            <h3>Request Submitted!</h3>
            <p>Your request has been submitted. We'll contact you shortly.</p>
            <button class="btn btn-primary" (click)="close.emit()">Close</button>
          </div>
        } @else {
          <form [formGroup]="form" (ngSubmit)="submit()" novalidate class="modal-form">
            <div class="form-grid">
              <div class="field">
                <label for="syndicateName">Syndicate Name <span class="req">*</span></label>
                <input id="syndicateName" type="text" formControlName="syndicateName" placeholder="e.g. Sri Ram Finance Group" />
                @if (invalid('syndicateName')) { <span class="field-error">Required</span> }
              </div>

              <div class="field">
                <label for="contactPersonName">Contact Person Name <span class="req">*</span></label>
                <input id="contactPersonName" type="text" formControlName="contactPersonName" placeholder="Full name" />
                @if (invalid('contactPersonName')) { <span class="field-error">Required</span> }
              </div>

              <div class="field">
                <label for="mobileNumber">Mobile Number <span class="req">*</span></label>
                <input id="mobileNumber" type="tel" formControlName="mobileNumber" placeholder="10-digit number" maxlength="10" />
                @if (invalid('mobileNumber')) { <span class="field-error">Enter a valid 10-digit mobile number</span> }
              </div>

              <div class="field">
                <label for="emailAddress">Email Address <span class="req">*</span></label>
                <input id="emailAddress" type="email" formControlName="emailAddress" placeholder="you@example.com" />
                @if (invalid('emailAddress')) { <span class="field-error">Enter a valid email address</span> }
              </div>

              <div class="field">
                <label for="city">City <span class="req">*</span></label>
                <input id="city" type="text" formControlName="city" placeholder="City" />
                @if (invalid('city')) { <span class="field-error">Required</span> }
              </div>

              <div class="field">
                <label for="state">State <span class="req">*</span></label>
                <select id="state" formControlName="state">
                  <option value="">Select State</option>
                  @for (s of states; track s) {
                    <option [value]="s">{{ s }}</option>
                  }
                </select>
                @if (invalid('state')) { <span class="field-error">Required</span> }
              </div>

              <div class="field">
                <label for="expectedMembersCount">Expected Members <span class="req">*</span></label>
                <input id="expectedMembersCount" type="number" formControlName="expectedMembersCount" placeholder="e.g. 20" min="2" />
                @if (invalid('expectedMembersCount')) { <span class="field-error">Minimum 2 members required</span> }
              </div>

              <div class="field">
                <label for="organizationName">Business / Organization Name</label>
                <input id="organizationName" type="text" formControlName="organizationName" placeholder="Optional" />
              </div>
            </div>

            <div class="field full-width">
              <label for="additionalNotes">Additional Notes</label>
              <textarea id="additionalNotes" formControlName="additionalNotes" rows="3" placeholder="Any specific requirements or questions..."></textarea>
            </div>

            @if (error()) {
              <div class="error-banner">{{ error() }}</div>
            }

            <div class="modal-actions">
              <button type="button" class="btn btn-outline" (click)="close.emit()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="loading()">
                {{ loading() ? 'Submitting...' : 'Request Syndicate Setup' }}
              </button>
            </div>
          </form>
        }
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed; inset: 0; background: rgba(0,0,0,0.55); z-index: 1000;
      display: flex; align-items: center; justify-content: center; padding: 16px;
    }
    .modal-box {
      background: #fff; border-radius: 12px; width: 100%; max-width: 680px;
      max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    .modal-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 24px 28px 16px; border-bottom: 1px solid #e5e7eb;
    }
    .modal-header h2 { margin: 0; font-size: 1.25rem; color: #0D1B4B; }
    .close-btn {
      background: none; border: none; font-size: 1.5rem; cursor: pointer;
      color: #6b7280; line-height: 1; padding: 4px;
    }
    .close-btn:hover { color: #111; }
    .modal-form { padding: 24px 28px; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    @media (max-width: 540px) { .form-grid { grid-template-columns: 1fr; } }
    .field { display: flex; flex-direction: column; gap: 6px; }
    .field label { font-size: 0.875rem; font-weight: 500; color: #374151; }
    .req { color: #ef4444; }
    .field input, .field select, .field textarea {
      padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px;
      font-size: 0.9375rem; outline: none; transition: border-color 0.15s;
    }
    .field input:focus, .field select:focus, .field textarea:focus { border-color: #1565C0; box-shadow: 0 0 0 3px rgba(21,101,192,0.12); }
    .field-error { font-size: 0.8125rem; color: #ef4444; }
    .full-width { margin-top: 16px; }
    .modal-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px; }
    .btn { padding: 10px 22px; border-radius: 8px; font-size: 0.9375rem; font-weight: 600; cursor: pointer; border: none; transition: all 0.15s; }
    .btn-primary { background: #00C853; color: #fff; }
    .btn-primary:hover:not(:disabled) { background: #00a846; }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-outline { background: transparent; border: 1.5px solid #d1d5db; color: #374151; }
    .btn-outline:hover { border-color: #9ca3af; }
    .error-banner { background: #fef2f2; color: #dc2626; border: 1px solid #fca5a5; border-radius: 8px; padding: 12px 16px; font-size: 0.875rem; margin-top: 12px; }
    .success-panel { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 48px 28px; gap: 12px; }
    .success-icon { font-size: 3rem; }
    .success-panel h3 { margin: 0; font-size: 1.25rem; color: #0D1B4B; }
    .success-panel p { margin: 0; color: #6b7280; }
  `]
})
export class RegisterModalComponent {
  @Output() close = new EventEmitter<void>();

  private svc = inject(LandingService);
  private fb = inject(FormBuilder);

  states = INDIAN_STATES;
  submitted = signal(false);
  loading = signal(false);
  error = signal('');

  form = this.fb.group({
    syndicateName: ['', [Validators.required, Validators.maxLength(150)]],
    contactPersonName: ['', [Validators.required, Validators.maxLength(150)]],
    mobileNumber: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
    emailAddress: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
    city: ['', [Validators.required, Validators.maxLength(100)]],
    state: ['', Validators.required],
    expectedMembersCount: [null as number | null, [Validators.required, Validators.min(2)]],
    organizationName: [''],
    additionalNotes: ['']
  });

  invalid(ctrl: string): boolean {
    const c = this.form.get(ctrl);
    return !!(c && c.invalid && c.touched);
  }

  onBackdropClick(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.close.emit();
    }
  }

  submit() {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set('');

    const v = this.form.getRawValue();
    this.svc.submitRegistrationRequest({
      syndicateName: v.syndicateName!,
      contactPersonName: v.contactPersonName!,
      mobileNumber: v.mobileNumber!,
      emailAddress: v.emailAddress!,
      city: v.city!,
      state: v.state!,
      expectedMembersCount: v.expectedMembersCount!,
      organizationName: v.organizationName || undefined,
      additionalNotes: v.additionalNotes || undefined
    }).subscribe({
      next: () => { this.loading.set(false); this.submitted.set(true); },
      error: (err) => {
        this.loading.set(false);
        if (err.status === 409) {
          this.error.set('A request with this email is already pending. We will contact you soon.');
        } else {
          this.error.set('Something went wrong. Please try again.');
        }
      }
    });
  }
}
