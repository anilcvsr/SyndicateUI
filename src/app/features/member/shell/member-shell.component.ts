import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-member-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './member-shell.component.html',
  styleUrl: './member-shell.component.scss'
})
export class MemberShellComponent {
  auth = inject(AuthService);
  nav = [
    { path: '/member/home', label: 'Home', icon: '🏠' },
    { path: '/member/history', label: 'Payment History', icon: '📜' },
    { path: '/member/proofs', label: 'Upload Proof', icon: '📎' },
    { path: '/member/expenses', label: 'Group Expenses', icon: '💸' }
  ];
  logout() { this.auth.logout(); }
}
