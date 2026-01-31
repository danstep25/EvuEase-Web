export interface NavItem {
  label: string;
  route: string;
  icon: string;
  module?: string;
  roles?: string[];
}

export const ADMIN_NAV_MENU: NavItem[] = [
  { 
    label: 'Dashboard', 
    route: 'dashboard', 
    icon: 'home',
    module: 'dashboard'
  },
  { 
    label: 'User Management', 
    route: 'user-management', 
    icon: 'people',
    module: 'user'
  },
  { 
    label: 'System Logs', 
    route: 'system-logs', 
    icon: 'description',
    module: 'audit'
  }
];




