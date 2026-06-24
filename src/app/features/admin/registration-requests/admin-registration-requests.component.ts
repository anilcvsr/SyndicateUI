import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface RegistrationRequest {
  id: number;
  syndicateName: string;
  contactPersonName: string;
  mobileNumber: string;
  emailAddress: string;
  city: string;
  state: string;
  expectedMembersCount: number;
  organizationName?: string;
  additionalNotes?: string;
  requestDate: string;
  status: string;
  adminNotes?: string;
  reviewedAt?: string;
}

interface PagedResult {
  total: number;
  page: number;
  pageSize: number;
  items: RegistrationRequest[];
}

@Component({
  selector: 'app-admin-registration-requests',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Registration Requests</h1>
        <p class="muted">New syndicate setup requests from the public</p>
      </div>

      <!-- Filters -->
      <div class="filters">
        <div class="filter-group">
          <label>Status</label>
          <select [(ngModel)]="filterStatus" (ngModelChange)="load()">
            <option value="">All</option>
            <option value="Pending">Pending</option>
            <option value="UnderReview">Under Review</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Search</label>
          <input type="text" [(ngModel)]="searchTerm" (ngModelChange)="onSearch()" placeholder="Name, syndicate, email..." />
        </div>
      </div>

      <!-- Table -->
      @if (loading()) {
        <div class="loading-state">Loading...</div>
      } @else if (items().length === 0) {
        <div class="empty-state">No registration requests found.</div>
      } @else {
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Syndicate Name</th>
                <th>Contact Person</th>
                <th>Mobile</th>
                <th>City / State</th>
                <th>Members</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (r of items(); track r.id) {
                <tr (click)="selectRequest(r)" class="clickable-row" [class.selected]="selected()?.id === r.id">
                  <td>{{ r.id }}</td>
                  <td>{{ r.syndicateName }}</td>
                  <td>{{ r.contactPersonName }}</td>
                  <td>{{ r.mobileNumber }}</td>
                  <td>{{ r.city }}, {{ r.state }}</td>
                  <td>{{ r.expectedMembersCount }}</td>
                  <td>{{ r.requestDate | date:'dd MMM yyyy' }}</td>
                  <td><span class="badge" [class]="'badge-' + r.status.toLowerCase()">{{ r.status }}</span></td>
                  <td class="actions-cell" (click)="$event.stopPropagation()">
                    @if (r.status === 'Pending' || r.status === 'UnderReview') {
                      <button class="btn-action approve" (click)="openAction(r, 'Approved')">Approve</button>
                      <button class="btn-action reject" (click)="openAction(r, 'Rejected')">Reject</button>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="pagination">
          <span class="muted">{{ total() }} total</span>
          <div class="page-btns">
            <button [disabled]="currentPage() <= 1" (click)="goPage(currentPage() - 1)">← Prev</button>
            <span>Page {{ currentPage() }} of {{ totalPages() }}</span>
            <button [disabled]="currentPage() >= totalPages()" (click)="goPage(currentPage() + 1)">Next →</button>
          </div>
        </div>
      }

      <!-- Detail panel -->
      @if (selected()) {
        <div class="detail-panel">
          <div class="detail-header">
            <h3>Request #{{ selected()!.id }} — {{ selected()!.syndicateName }}</h3>
            <button class="close-detail" (click)="selected.set(null)">✕</button>
          </div>
          <div class="detail-grid">
            <div class="detail-item"><span>Contact</span><strong>{{ selected()!.contactPersonName }}</strong></div>
            <div class="detail-item"><span>Mobile</span><strong>{{ selected()!.mobileNumber }}</strong></div>
            <div class="detail-item"><span>Email</span><strong>{{ selected()!.emailAddress }}</strong></div>
            <div class="detail-item"><span>Location</span><strong>{{ selected()!.city }}, {{ selected()!.state }}</strong></div>
            <div class="detail-item"><span>Expected Members</span><strong>{{ selected()!.expectedMembersCount }}</strong></div>
            @if (selected()!.organizationName) {
              <div class="detail-item"><span>Organization</span><strong>{{ selected()!.organizationName }}</strong></div>
            }
            @if (selected()!.additionalNotes) {
              <div class="detail-item full"><span>Notes</span><strong>{{ selected()!.additionalNotes }}</strong></div>
            }
            @if (selected()!.adminNotes) {
              <div class="detail-item full"><span>Admin Notes</span><strong>{{ selected()!.adminNotes }}</strong></div>
            }
          </div>
        </div>
      }

      <!-- Action dialog -->
      @if (actionTarget()) {
        <div class="dialog-backdrop" (click)="closeAction()">
          <div class="dialog" (click)="$event.stopPropagation()">
            <h3>{{ pendingAction() }} Request #{{ actionTarget()!.id }}</h3>
            <p>{{ actionTarget()!.syndicateName }} — {{ actionTarget()!.contactPersonName }}</p>
            <label class="dialog-label">Admin Notes (optional)</label>
            <textarea [(ngModel)]="actionNotes" rows="3" placeholder="Reason or notes..."></textarea>
            <div class="dialog-actions">
              <button class="btn-outline" (click)="closeAction()">Cancel</button>
              <button class="btn-confirm" [class.confirm-approve]="pendingAction() === 'Approved'" [class.confirm-reject]="pendingAction() === 'Rejected'" (click)="confirmAction()" [disabled]="actionLoading()">
                {{ actionLoading() ? 'Saving...' : 'Confirm ' + pendingAction() }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page { padding: 24px; max-width: 1100px; }
    .page-header { margin-bottom: 24px; h1 { margin: 0 0 4px; font-size: 1.5rem; color: #0D1B4B; } }
    .muted { color: #6b7280; font-size: 0.875rem; }
    .filters { display: flex; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
    .filter-group { display: flex; flex-direction: column; gap: 6px; min-width: 180px;
      label { font-size: 0.8125rem; font-weight: 500; color: #374151; }
      input, select { padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 0.9rem; }
    }
    .loading-state, .empty-state { padding: 48px; text-align: center; color: #6b7280; }
    .table-wrap { overflow-x: auto; border-radius: 10px; border: 1px solid #e5e7eb; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 0.875rem;
      th { background: #f9fafb; padding: 12px 14px; text-align: left; font-size: 0.8125rem; color: #6b7280; font-weight: 600; white-space: nowrap; border-bottom: 1px solid #e5e7eb; }
      td { padding: 12px 14px; border-bottom: 1px solid #f3f4f6; color: #111827; vertical-align: middle; }
    }
    .clickable-row { cursor: pointer; &:hover td { background: #f0f4ff; } &.selected td { background: #e8f0fe; } }
    .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; }
    .badge-pending { background: #fef3c7; color: #92400e; }
    .badge-underreview { background: #dbeafe; color: #1e40af; }
    .badge-approved { background: #d1fae5; color: #065f46; }
    .badge-rejected { background: #fee2e2; color: #991b1b; }
    .actions-cell { white-space: nowrap; display: flex; gap: 6px; }
    .btn-action { padding: 4px 12px; border-radius: 6px; font-size: 0.8125rem; font-weight: 600; cursor: pointer; border: none;
      &.approve { background: #d1fae5; color: #065f46; &:hover { background: #a7f3d0; } }
      &.reject { background: #fee2e2; color: #991b1b; &:hover { background: #fecaca; } }
    }
    .pagination { display: flex; align-items: center; justify-content: space-between; margin-top: 16px; flex-wrap: wrap; gap: 12px; }
    .page-btns { display: flex; align-items: center; gap: 12px; font-size: 0.875rem;
      button { padding: 6px 14px; border: 1px solid #d1d5db; border-radius: 6px; cursor: pointer; background: #fff; font-size: 0.875rem;
        &:disabled { opacity: 0.4; cursor: not-allowed; }
        &:not(:disabled):hover { background: #f3f4f6; }
      }
    }
    .detail-panel { margin-top: 24px; background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 20px; }
    .detail-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;
      h3 { margin: 0; font-size: 1rem; color: #0D1B4B; }
    }
    .close-detail { background: none; border: none; font-size: 1.25rem; cursor: pointer; color: #6b7280; }
    .detail-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;
      @media (max-width: 640px) { grid-template-columns: 1fr 1fr; }
    }
    .detail-item { display: flex; flex-direction: column; gap: 2px;
      span { font-size: 0.75rem; color: #6b7280; }
      strong { font-size: 0.9rem; color: #111827; }
      &.full { grid-column: 1 / -1; }
    }
    .dialog-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 16px; }
    .dialog { background: #fff; border-radius: 12px; padding: 28px; max-width: 440px; width: 100%;
      h3 { margin: 0 0 4px; color: #0D1B4B; }
      p { margin: 0 0 16px; color: #6b7280; font-size: 0.875rem; }
    }
    .dialog-label { display: block; font-size: 0.875rem; font-weight: 500; color: #374151; margin-bottom: 6px; }
    textarea { width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 0.9rem; resize: vertical; }
    .dialog-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px; }
    .btn-outline { padding: 8px 20px; border: 1.5px solid #d1d5db; border-radius: 8px; cursor: pointer; background: #fff; font-size: 0.9rem; }
    .btn-confirm { padding: 8px 20px; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.9rem; color: #fff;
      &.confirm-approve { background: #00C853; &:hover:not(:disabled) { background: #00a846; } }
      &.confirm-reject { background: #ef4444; &:hover:not(:disabled) { background: #dc2626; } }
      &:disabled { opacity: 0.6; cursor: not-allowed; }
    }
  `]
})
export class AdminRegistrationRequestsComponent implements OnInit {
  private http = inject(HttpClient);
  private base = environment.apiBaseUrl;

  items = signal<RegistrationRequest[]>([]);
  total = signal(0);
  currentPage = signal(1);
  pageSize = 20;
  loading = signal(false);

  filterStatus = '';
  searchTerm = '';
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  selected = signal<RegistrationRequest | null>(null);
  actionTarget = signal<RegistrationRequest | null>(null);
  pendingAction = signal<'Approved' | 'Rejected'>('Approved');
  actionNotes = '';
  actionLoading = signal(false);

  totalPages() {
    return Math.max(1, Math.ceil(this.total() / this.pageSize));
  }

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    const params: Record<string, string> = {
      page: String(this.currentPage()),
      pageSize: String(this.pageSize)
    };
    if (this.filterStatus) params['status'] = this.filterStatus;
    if (this.searchTerm.trim()) params['search'] = this.searchTerm.trim();

    const qs = new URLSearchParams(params).toString();
    this.http.get<PagedResult>(`${this.base}/api/registration-requests?${qs}`).subscribe({
      next: (r) => {
        this.items.set(r.items);
        this.total.set(r.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onSearch() {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => { this.currentPage.set(1); this.load(); }, 400);
  }

  goPage(p: number) { this.currentPage.set(p); this.load(); }

  selectRequest(r: RegistrationRequest) {
    this.selected.set(this.selected()?.id === r.id ? null : r);
  }

  openAction(r: RegistrationRequest, action: 'Approved' | 'Rejected') {
    this.actionTarget.set(r);
    this.pendingAction.set(action);
    this.actionNotes = '';
  }

  closeAction() { this.actionTarget.set(null); }

  confirmAction() {
    const target = this.actionTarget();
    if (!target) return;
    this.actionLoading.set(true);
    this.http.patch(`${this.base}/api/registration-requests/${target.id}/status`, {
      status: this.pendingAction() === 'Approved' ? 2 : 3,
      adminNotes: this.actionNotes || null
    }).subscribe({
      next: () => {
        this.actionLoading.set(false);
        this.actionTarget.set(null);
        if (this.selected()?.id === target.id) this.selected.set(null);
        this.load();
      },
      error: () => this.actionLoading.set(false)
    });
  }
}
