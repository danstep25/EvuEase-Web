import { isSelectorDemoStudent } from './subject-evaluation-demo-students.mock';
import { findSubjectEvaluationStudent } from './subject-evaluation.mock';

export type AcademicPlanCourseStatus = 'Available' | 'Pending' | 'Future';

export type AcademicPlanTermHeaderVariant = 'recommended' | 'standard';

export interface AcademicPlanCourseRow {
  readonly courseCode: string;
  readonly subjectDescription: string;
  readonly prerequisite: string;
  readonly units: number;
  readonly status: AcademicPlanCourseStatus;
}

export interface AcademicPlanTermBlock {
  readonly termLabel: string;
  readonly schoolYearLabel: string;
  readonly headerVariant: AcademicPlanTermHeaderVariant;
  readonly badgeLabel?: string;
  readonly minCompletionYear: number;
  readonly courses: readonly AcademicPlanCourseRow[];
  readonly totalUnits: number;
}

export interface AcademicPlanStatusSummary {
  readonly totalUnitsRequired: number;
  readonly unitsCompleted: number;
  readonly unitsRemaining: number;
}

export interface StudentAcademicPlan {
  readonly statusSummary: AcademicPlanStatusSummary;
  readonly expectedCompletionYearOptions: readonly number[];
  readonly defaultExpectedCompletionYear: number;
  readonly suggestedTerms: readonly AcademicPlanTermBlock[];
}

const DELA_CRUZ_JUAN_ACADEMIC_PLAN: StudentAcademicPlan = {
  statusSummary: {
    totalUnitsRequired: 120,
    unitsCompleted: 56,
    unitsRemaining: 64
  },
  expectedCompletionYearOptions: [2025, 2026, 2027, 2028],
  defaultExpectedCompletionYear: 2026,
  suggestedTerms: [
    {
      termLabel: '3rd Year - 1st Term',
      schoolYearLabel: 'SY 2024-2025 (Upcoming)',
      headerVariant: 'recommended',
      badgeLabel: 'Recommended',
      minCompletionYear: 2025,
      totalUnits: 15,
      courses: [
        { courseCode: 'CITE3001', subjectDescription: 'Web Development', prerequisite: 'CITE2002', units: 3, status: 'Available' },
        { courseCode: 'CITE3002', subjectDescription: 'Software Engineering', prerequisite: 'INSY2002', units: 3, status: 'Available' },
        { courseCode: 'CITE3003', subjectDescription: 'Operating Systems', prerequisite: 'CITE2001', units: 3, status: 'Available' },
        { courseCode: 'INSY3001', subjectDescription: 'IT Project Management', prerequisite: 'INSY2002', units: 3, status: 'Available' },
        { courseCode: 'GE301', subjectDescription: 'Art Appreciation', prerequisite: 'None', units: 3, status: 'Available' }
      ]
    },
    {
      termLabel: '3rd Year - 2nd Term',
      schoolYearLabel: 'SY 2024-2025',
      headerVariant: 'standard',
      minCompletionYear: 2025,
      totalUnits: 15,
      courses: [
        { courseCode: 'CITE3004', subjectDescription: 'Mobile Application Development', prerequisite: 'CITE3001', units: 3, status: 'Pending' },
        { courseCode: 'CITE3005', subjectDescription: 'Computer Networks', prerequisite: 'CITE3003', units: 3, status: 'Pending' },
        { courseCode: 'INSY3002', subjectDescription: 'Business Intelligence', prerequisite: 'CITE2003', units: 3, status: 'Available' },
        { courseCode: 'GE302', subjectDescription: 'Science, Technology and Society', prerequisite: 'None', units: 3, status: 'Available' },
        { courseCode: 'ELEC301', subjectDescription: 'Professional Elective 1', prerequisite: '3rd Year Standing', units: 3, status: 'Available' }
      ]
    },
    {
      termLabel: '4th Year - 1st Term',
      schoolYearLabel: 'SY 2025-2026',
      headerVariant: 'standard',
      minCompletionYear: 2026,
      totalUnits: 12,
      courses: [
        { courseCode: 'CITE4001', subjectDescription: 'Capstone Project 1', prerequisite: '4th Year Standing', units: 3, status: 'Future' },
        { courseCode: 'CITE4002', subjectDescription: 'Information Assurance and Security', prerequisite: 'CITE3005', units: 3, status: 'Future' },
        { courseCode: 'INSY4001', subjectDescription: 'IT Audit and Controls', prerequisite: 'INSY3002', units: 3, status: 'Future' },
        { courseCode: 'GE401', subjectDescription: 'Philippine Popular Culture', prerequisite: 'None', units: 3, status: 'Future' }
      ]
    },
    {
      termLabel: '4th Year - 2nd Term',
      schoolYearLabel: 'SY 2025-2026',
      headerVariant: 'standard',
      minCompletionYear: 2026,
      totalUnits: 12,
      courses: [
        { courseCode: 'CITE4003', subjectDescription: 'Capstone Project 2', prerequisite: 'CITE4001', units: 3, status: 'Future' },
        { courseCode: 'CITE4004', subjectDescription: 'IT Ethics and Professional Practice', prerequisite: '4th Year Standing', units: 3, status: 'Future' },
        { courseCode: 'CITE4005', subjectDescription: 'Practicum (500 hours)', prerequisite: '4th Year Standing', units: 6, status: 'Future' }
      ]
    }
  ]
};

const GARCIA_MARIA_ACADEMIC_PLAN: StudentAcademicPlan = {
  statusSummary: {
    totalUnitsRequired: 120,
    unitsCompleted: 32,
    unitsRemaining: 88
  },
  expectedCompletionYearOptions: [2026, 2027, 2028, 2029],
  defaultExpectedCompletionYear: 2028,
  suggestedTerms: [
    {
      termLabel: '1st Year - 2nd Term',
      schoolYearLabel: 'SY 2024-2025 (Upcoming)',
      headerVariant: 'recommended',
      badgeLabel: 'Recommended',
      minCompletionYear: 2028,
      totalUnits: 18,
      courses: [
        { courseCode: 'COSC1002', subjectDescription: 'Discrete Structures 1 (Discrete Mathematics)', prerequisite: 'None', units: 3, status: 'Available' },
        { courseCode: 'GEDC1010', subjectDescription: 'Art Appreciation', prerequisite: 'None', units: 3, status: 'Available' },
        { courseCode: 'GEDC1009', subjectDescription: 'Ethics', prerequisite: 'None', units: 3, status: 'Available' },
        { courseCode: 'GEDC1016', subjectDescription: 'Purposive Communication', prerequisite: 'None', units: 3, status: 'Available' },
        { courseCode: 'INTE1006', subjectDescription: 'Systems Administration and Maintenance', prerequisite: 'None', units: 3, status: 'Available' }
      ]
    },
    {
      termLabel: '2nd Year - 1st Term',
      schoolYearLabel: 'SY 2025-2026',
      headerVariant: 'standard',
      minCompletionYear: 2028,
      totalUnits: 15,
      courses: [
        { courseCode: 'GEDC1006', subjectDescription: 'Readings in Philippine History', prerequisite: 'None', units: 3, status: 'Future' },
        { courseCode: 'COSC1001', subjectDescription: 'Principles of Communication', prerequisite: 'None', units: 3, status: 'Future' }
      ]
    }
  ]
};

const REYES_PEDRO_ACADEMIC_PLAN: StudentAcademicPlan = {
  ...DELA_CRUZ_JUAN_ACADEMIC_PLAN,
  statusSummary: {
    totalUnitsRequired: 120,
    unitsCompleted: 48,
    unitsRemaining: 72
  },
  defaultExpectedCompletionYear: 2027
};

const SANTOS_ANA_ACADEMIC_PLAN: StudentAcademicPlan = {
  statusSummary: {
    totalUnitsRequired: 120,
    unitsCompleted: 102,
    unitsRemaining: 18
  },
  expectedCompletionYearOptions: [2025, 2026],
  defaultExpectedCompletionYear: 2025,
  suggestedTerms: [
    {
      termLabel: '4th Year - 2nd Term',
      schoolYearLabel: 'SY 2024-2025 (Upcoming)',
      headerVariant: 'recommended',
      badgeLabel: 'Recommended',
      minCompletionYear: 2025,
      totalUnits: 15,
      courses: [
        { courseCode: 'INTE1043', subjectDescription: 'IT Practicum (486 hours)', prerequisite: 'None', units: 9, status: 'Available' },
        { courseCode: 'CITE4003', subjectDescription: 'Capstone Project 2', prerequisite: 'CITE4001', units: 3, status: 'Available' },
        { courseCode: 'CITE4004', subjectDescription: 'IT Ethics and Professional Practice', prerequisite: '4th Year Standing', units: 3, status: 'Available' }
      ]
    }
  ]
};

const TORRES_CARLOS_ACADEMIC_PLAN: StudentAcademicPlan = {
  statusSummary: {
    totalUnitsRequired: 120,
    unitsCompleted: 52,
    unitsRemaining: 68
  },
  expectedCompletionYearOptions: [2026, 2027, 2028],
  defaultExpectedCompletionYear: 2027,
  suggestedTerms: [
    {
      termLabel: '2nd Year - 2nd Term',
      schoolYearLabel: 'SY 2024-2025 (Upcoming)',
      headerVariant: 'recommended',
      badgeLabel: 'Recommended',
      minCompletionYear: 2027,
      totalUnits: 18,
      courses: [
        { courseCode: 'GEDC1041', subjectDescription: 'Philippine Popular Culture', prerequisite: 'None', units: 3, status: 'Available' },
        { courseCode: 'BUSS1013', subjectDescription: 'Technopreneurship', prerequisite: 'None', units: 3, status: 'Available' },
        { courseCode: 'INTE1021', subjectDescription: 'Systems Integration and Architecture', prerequisite: 'None', units: 3, status: 'Available' }
      ]
    },
    {
      termLabel: '3rd Year - 1st Term',
      schoolYearLabel: 'SY 2025-2026',
      headerVariant: 'standard',
      minCompletionYear: 2027,
      totalUnits: 12,
      courses: [
        { courseCode: 'GEDC1045', subjectDescription: 'Great Books', prerequisite: 'None', units: 3, status: 'Future' },
        { courseCode: 'INSY1007', subjectDescription: 'Management Information Systems', prerequisite: 'None', units: 3, status: 'Future' }
      ]
    }
  ]
};

const MOCK_ACADEMIC_PLANS: Readonly<Record<string, StudentAcademicPlan>> = {
  '010000145957': DELA_CRUZ_JUAN_ACADEMIC_PLAN,
  '010000145958': GARCIA_MARIA_ACADEMIC_PLAN,
  '010000145959': REYES_PEDRO_ACADEMIC_PLAN,
  '010000145960': SANTOS_ANA_ACADEMIC_PLAN,
  '010000145961': TORRES_CARLOS_ACADEMIC_PLAN
};

export interface AcademicPlanFilteredTerm extends AcademicPlanTermBlock {
  readonly courses: readonly AcademicPlanCourseRow[];
  readonly totalUnits: number;
}

function buildFallbackAcademicPlan(studentId: string): StudentAcademicPlan | null {
  const student = findSubjectEvaluationStudent(studentId);
  if (!student) {
    return null;
  }
  const yearKey = Number.parseInt(student.yearLevelKey, 10);
  const completionYear = 2025 + Math.max(0, 4 - yearKey);
  return {
    statusSummary: {
      totalUnitsRequired: 120,
      unitsCompleted: 24 + yearKey * 12,
      unitsRemaining: 96 - yearKey * 12
    },
    expectedCompletionYearOptions: [completionYear, completionYear + 1, completionYear + 2],
    defaultExpectedCompletionYear: completionYear,
    suggestedTerms: [
      {
        termLabel: `${yearKey + 1} Year - 1st Term`,
        schoolYearLabel: 'SY 2024-2025 (Upcoming)',
        headerVariant: 'recommended',
        badgeLabel: 'Recommended',
        minCompletionYear: completionYear,
        totalUnits: 15,
        courses: [
          {
            courseCode: 'CITE3001',
            subjectDescription: 'Web Development',
            prerequisite: 'CITE2002',
            units: 3,
            status: 'Available'
          },
          {
            courseCode: 'INSY3001',
            subjectDescription: 'IT Project Management',
            prerequisite: 'INSY2002',
            units: 3,
            status: 'Available'
          },
          {
            courseCode: 'GE301',
            subjectDescription: 'Art Appreciation',
            prerequisite: 'None',
            units: 3,
            status: 'Available'
          }
        ]
      }
    ]
  };
}

export function getStudentAcademicPlan(studentId: string | null): StudentAcademicPlan | null {
  if (!studentId) {
    return null;
  }
  if (MOCK_ACADEMIC_PLANS[studentId]) {
    return MOCK_ACADEMIC_PLANS[studentId];
  }
  if (isSelectorDemoStudent(studentId)) {
    return buildFallbackAcademicPlan(studentId);
  }
  return null;
}

export function filterAcademicPlanTerms(
  plan: StudentAcademicPlan,
  completionYear: number
): readonly AcademicPlanFilteredTerm[] {
  return plan.suggestedTerms
    .filter((term) => completionYear >= term.minCompletionYear)
    .map((term) => ({ ...term }));
}

export function getAcademicPlanProgressPercent(plan: StudentAcademicPlan): number {
  const { totalUnitsRequired, unitsCompleted } = plan.statusSummary;
  if (totalUnitsRequired <= 0) {
    return 0;
  }
  return Math.round((unitsCompleted / totalUnitsRequired) * 1000) / 10;
}
