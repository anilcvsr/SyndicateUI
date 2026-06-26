import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { filter, Subscription } from 'rxjs';

@Component({
  selector: 'app-super-admin-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './super-admin-shell.component.html',
  styleUrl: './super-admin-shell.component.scss'
})
export class SuperAdminShellComponent implements OnInit, OnDestroy {
  auth = inject(AuthService);
  private router = inject(Router);
  private routerSub?: Subscription;

  menuOpen = signal(false);

  nav = [
    { path: '/super-admin/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/super-admin/syndicates', label: 'Syndicates', icon: '🏛️' },
    { path: '/super-admin/registration-requests', label: 'New Requests', icon: '📩' }
  ];

  ngOnInit() {
    this.routerSub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => this.menuOpen.set(false));
  }

  ngOnDestroy() {
    this.routerSub?.unsubscribe();
  }

  toggleMenu() { this.menuOpen.update(v => !v); }
  closeMenu() { this.menuOpen.set(false); }
  logout() { this.auth.logout(); }
}
