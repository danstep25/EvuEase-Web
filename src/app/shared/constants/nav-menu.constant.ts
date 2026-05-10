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

export const REGISTRAR_NAV_MENU: NavItem[] = [
  { 
    label: 'Dashboard', 
    route: 'dashboard', 
    icon: 'home',
    module: 'dashboard',
    roles: ['Registrar']
  },
  { 
    label: 'Programs', 
    route: 'program-management', 
    icon: 'school',
    module: 'program',
    roles: ['Registrar']
  },
  { 
    label: 'School Year & Term', 
    route: 'school-year-term', 
    icon: 'calendar',
    module: 'school-year',
    roles: ['Registrar']
  },
  { 
    label: 'Curriculum Mgmt', 
    route: 'curriculum-management', 
    icon: 'briefcase',
    module: 'curriculum',
    roles: ['Registrar']
  },
  { 
    label: 'Students', 
    route: 'students', 
    icon: 'people',
    module: 'students',
    roles: ['Registrar']
  },
  { 
    label: 'Faculty Center', 
    route: 'faculty-center', 
    icon: 'bar-chart',
    module: 'faculty',
    roles: ['Registrar']
  },
  { 
    label: 'Archive', 
    route: 'archive', 
    icon: 'box',
    module: 'archive',
    roles: ['Registrar']
  }
];

export const EVALUATOR_NAV_MENU: NavItem[] = [
  {
    label: 'Dashboard',
    route: 'dashboard',
    icon: 'home',
    module: 'dashboard',
    roles: ['Evaluator']
  },
  {
    label: 'Curriculum',
    route: 'curriculum',
    icon: 'briefcase',
    module: 'curriculum',
    roles: ['Evaluator']
  },
  {
    label: 'Student Records',
    route: 'student-records',
    icon: 'clipboard',
    module: 'students',
    roles: ['Evaluator']
  },
  {
    label: 'Subject Evaluation',
    route: 'subject-evaluation',
    icon: 'people',
    module: 'evaluation',
    roles: ['Evaluator']
  },
  {
    label: 'Credit Subjects',
    route: 'credit-subjects',
    icon: 'people',
    module: 'credit-subjects',
    roles: ['Evaluator']
  },
  {
    label: 'Analytics',
    route: 'analytics',
    icon: 'bar-chart',
    module: 'analytics',
    roles: ['Evaluator']
  }
];




