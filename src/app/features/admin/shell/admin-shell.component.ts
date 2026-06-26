import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { filter, Subscription } from 'rxjs';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

interface NavGroup {
  id: string;
  label: string;
  icon: string;
  items: NavItem[];
}

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './admin-shell.component.html',
  styleUrl: './admin-shell.component.scss'
})
export class AdminShellComponent implements OnInit, OnDestroy {
  auth = inject(AuthService);
  private router = inject(Router);
  private routerSub?: Subscription;

  menuOpen = signal(false);
  expandedGroups = signal<Set<string>>(new Set<string>());

  dashboardItem: NavItem = { path: '/admin/dashboard', label: 'Dashboard', icon: '📊' };

  navGroups: NavGroup[] = [
    {
      id: 'members',
      label: 'Members',
      icon: '👥',
      items: [
        { path: '/admin/members', label: 'Members', icon: '👥' },
        { path: '/admin/payments', label: 'Record Payment', icon: '💵' },
        { path: '/admin/monthly-log', label: 'Monthly Log', icon: '🗓️' },
        { path: '/admin/dues', label: 'Pending Dues', icon: '⚠️' },
        { path: '/admin/verifications', label: 'Verifications', icon: '📎' },
        { path: '/admin/fines', label: 'Fines', icon: '🚨' }
      ]
    },
    {
      id: 'expenses',
      label: 'Expenses',
      icon: '💸',
      items: [
        { path: '/admin/expenses', label: 'Expenses', icon: '💸' },
        { path: '/admin/expense-summary', label: 'Expense Summary', icon: '📈' },
        { path: '/admin/expense-categories', label: 'Expense Categories', icon: '🏷️' }
      ]
    },
    {
      id: 'loans',
      label: 'Loans',
      icon: '🏦',
      items: [
        { path: '/admin/loans', label: 'Loans', icon: '🏦' },
        { path: '/admin/loan-summary', label: 'Loan Summary', icon: '📉' }
      ]
    },
    {
      id: 'collections',
      label: 'Additional Collections',
      icon: '💰',
      items: [
        { path: '/admin/additional-collections', label: 'Additional Collections', icon: '💰' }
      ]
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: '⚙️',
      items: [
        { path: '/admin/settings', label: 'Settings', icon: '⚙️' }
      ]
    }
  ];

  ngOnInit() {
    this.expandActiveGroup(this.router.url);
    this.routerSub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(e => {
        this.menuOpen.set(false);
        this.expandActiveGroup((e as NavigationEnd).url);
      });
  }

  ngOnDestroy() {
    this.routerSub?.unsubscribe();
  }

  private expandActiveGroup(url: string) {
    const activeGroup = this.navGroups.find(g => g.items.some(item => url.startsWith(item.path)));
    if (activeGroup) {
      this.expandedGroups.update(set => {
        const next = new Set(set);
        next.add(activeGroup.id);
        return next;
      });
    }
  }

  isGroupExpanded(groupId: string): boolean {
    return this.expandedGroups().has(groupId);
  }

  toggleGroup(groupId: string) {
    this.expandedGroups.update(set => {
      const next = new Set(set);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }

  isGroupActive(group: NavGroup): boolean {
    return group.items.some(item => this.router.url.startsWith(item.path));
  }

  toggleMenu() { this.menuOpen.update(v => !v); }
  closeMenu() { this.menuOpen.set(false); }
  logout() { this.auth.logout(); }
}
