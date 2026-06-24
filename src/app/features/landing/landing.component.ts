import { Component, signal, HostListener, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RegisterModalComponent } from './register-modal.component';

interface Feature {
  icon: string;
  title: string;
  description: string;
}

interface Step {
  num: number;
  icon: string;
  title: string;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink, RegisterModalComponent],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss'
})
export class LandingComponent {
  private platformId = inject(PLATFORM_ID);

  showModal = signal(false);
  navScrolled = signal(false);
  mobileNavOpen = signal(false);

  @HostListener('window:scroll')
  onScroll() {
    if (isPlatformBrowser(this.platformId)) {
      this.navScrolled.set(window.scrollY > 20);
    }
  }

  openModal() { this.showModal.set(true); }
  closeModal() { this.showModal.set(false); }
  toggleMobileNav() { this.mobileNavOpen.update(v => !v); }
  closeMobileNav() { this.mobileNavOpen.set(false); }

  scrollTo(anchor: string) {
    if (isPlatformBrowser(this.platformId)) {
      document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth' });
      this.mobileNavOpen.set(false);
    }
  }

  features: Feature[] = [
    { icon: '👥', title: 'Member Management', description: 'Add, track, and manage all syndicate members with complete profiles and history.' },
    { icon: '💰', title: 'Collection Tracking', description: 'Monitor monthly contributions and dues with a full payment history at a glance.' },
    { icon: '📋', title: 'Payment History', description: 'Complete transaction records for every member, every payment, every month.' },
    { icon: '⚠️', title: 'Fine Management', description: 'Automatically calculate and track penalties for missed or delayed payments.' },
    { icon: '🏦', title: 'Fund Management', description: 'Track total fund balance, outstanding loans, and available funds centrally.' },
    { icon: '🔐', title: 'Role-Based Access', description: 'Separate secure portals for admin and members with controlled permissions.' }
  ];

  problems = [
    'Records not updated regularly',
    'Missing or incorrect member details',
    'Difficult to track contributions',
    'No real-time financial reports',
    'Disputes and miscommunication'
  ];

  solutions = [
    'Accurate, real-time member records',
    'Complete member profiles and history',
    'Contribution tracking in real-time',
    'Instant reports and insights',
    'Transparent, error-free records'
  ];

  benefits = [
    { icon: '✅', text: 'Transparent financial tracking' },
    { icon: '✅', text: 'Easy member management' },
    { icon: '✅', text: 'Automated calculations' },
    { icon: '✅', text: 'Centralized record keeping' },
    { icon: '✅', text: 'Secure role-based access' },
    { icon: '✅', text: 'Mobile-friendly experience' }
  ];

  steps: Step[] = [
    { num: 1, icon: '🏢', title: 'Create Syndicate' },
    { num: 2, icon: '👥', title: 'Add Members' },
    { num: 3, icon: '💰', title: 'Collect Contributions' },
    { num: 4, icon: '📋', title: 'Track Payments & Fines' },
    { num: 5, icon: '📊', title: 'Generate Reports' }
  ];
}
