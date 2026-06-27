export interface NavItem {
  label: string;
  route: string;
  icon: string;
}

export const STUDENT_PORTAL_NAV_MENU: readonly NavItem[] = [
  { label: 'Dashboard', route: 'dashboard', icon: 'home' },
  { label: 'My Subjects', route: 'my-subjects', icon: 'book' },
  { label: 'Grade History', route: 'grade-history', icon: 'clipboard' },
  { label: 'Pending Subjects', route: 'pending-subjects', icon: 'clock' },
  { label: 'Print Grades', route: 'print-grades', icon: 'print' },
  { label: 'My Profile', route: 'profile', icon: 'user' },
  { label: 'Change Password', route: 'change-password', icon: 'lock' }
];
