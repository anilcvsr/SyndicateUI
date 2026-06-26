import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SuperAdminApi, PlatformStatsDto } from '../../core/services/super-admin.api';

@Component({
  selector: 'app-super-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './super-admin-dashboard.component.html',
  styleUrl: './super-admin-dashboard.component.scss'
})
export class SuperAdminDashboardComponent {
  private api = inject(SuperAdminApi);

  stats = signal<PlatformStatsDto | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  constructor() {
    this.api.getPlatformStats().subscribe({
      next: (s) => { this.stats.set(s); this.loading.set(false); },
      error: (e) => { this.error.set(e?.error?.message ?? 'Failed to load stats.'); this.loading.set(false); }
    });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
  }

  timeAgo(timestamp: string): string {
    const diff = Date.now() - new Date(timestamp).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} minute${mins !== 1 ? 's' : ''} ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hour${hrs !== 1 ? 's' : ''} ago`;
    const days = Math.floor(hrs / 24);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  }
}
