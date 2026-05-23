import { isSelectorDemoStudent } from './subject-evaluation-demo-students.mock';
import { getStudentAcademicRecordProfile } from './student-academic-records.mock';
import { findSubjectEvaluationStudent } from './subject-evaluation.mock';

export interface CurriculumHistoryEntry {
  readonly curriculumCode: string;
  readonly academicYear: string;
  readonly dateLabel: string;
  readonly reason: string;
  readonly notes: string;
  readonly migratedBy: string;
  readonly isCurrent?: boolean;
}

export interface CurriculumHistoryViewModel {
  readonly studentLabel: string;
  readonly entries: readonly CurriculumHistoryEntry[];
}

const DELA_CRUZ_JUAN_HISTORY: readonly CurriculumHistoryEntry[] = [
  {
    curriculumCode: 'BSIT-25-01',
    academicYear: '2025-2026',
    dateLabel: 'January 10, 2025',
    reason: 'Latest curriculum version migration',
    notes: 'Migrated to current active curriculum for better alignment with industry standards',
    migratedBy: 'Juan Dela Cruz',
    isCurrent: true
  },
  {
    curriculumCode: 'BSIT-24-01',
    academicYear: '2024-2025',
    dateLabel: 'August 20, 2024',
    reason: 'Curriculum update - new version available',
    notes: 'Migrated to align with updated curriculum requirements',
    migratedBy: 'Maria Santos'
  },
  {
    curriculumCode: 'BSIT-23-01',
    academicYear: '2023-2024',
    dateLabel: 'August 15, 2023',
    reason: 'Initial enrollment',
    notes: 'Student enrolled with standard BSIT curriculum for incoming year level',
    migratedBy: 'Juan Dela Cruz'
  },
  {
    curriculumCode: 'BSIT-22-01',
    academicYear: '2022-2023',
    dateLabel: 'June 1, 2022',
    reason: 'Legacy curriculum assignment',
    notes: 'Assigned during pre-migration records transfer',
    migratedBy: 'System Administrator'
  }
];

const GARCIA_MARIA_HISTORY: readonly CurriculumHistoryEntry[] = [
  {
    curriculumCode: 'BSIT-24-01',
    academicYear: '2024-2025',
    dateLabel: 'August 18, 2024',
    reason: 'Curriculum update for incoming 1st year standing',
    notes: 'Aligned with revised general education requirements',
    migratedBy: 'Maria Santos',
    isCurrent: true
  },
  {
    curriculumCode: 'BSIT-23-01',
    academicYear: '2023-2024',
    dateLabel: 'June 10, 2023',
    reason: 'Initial enrollment',
    notes: 'Standard BSIT curriculum assigned at admission',
    migratedBy: 'Juan Dela Cruz'
  }
];

const REYES_PEDRO_HISTORY: readonly CurriculumHistoryEntry[] = [
  {
    curriculumCode: 'BSIT-22-01',
    academicYear: '2024-2025',
    dateLabel: 'January 5, 2025',
    reason: 'Program alignment migration',
    notes: 'Updated to active BSIT curriculum for 2nd year level',
    migratedBy: 'Juan Dela Cruz',
    isCurrent: true
  },
  {
    curriculumCode: 'BSIT-21-01',
    academicYear: '2022-2023',
    dateLabel: 'August 12, 2022',
    reason: 'Initial enrollment',
    notes: 'Enrolled under prior BSIT curriculum version',
    migratedBy: 'System Administrator'
  }
];

const SANTOS_ANA_HISTORY: readonly CurriculumHistoryEntry[] = [
  {
    curriculumCode: 'BSIT-22-01',
    academicYear: '2024-2025',
    dateLabel: 'December 2, 2024',
    reason: 'Senior year curriculum confirmation',
    notes: 'Retained current curriculum for practicum and capstone sequencing',
    migratedBy: 'Maria Santos',
    isCurrent: true
  },
  {
    curriculumCode: 'BSIT-20-01',
    academicYear: '2021-2022',
    dateLabel: 'August 8, 2021',
    reason: 'Initial enrollment',
    notes: 'Assigned standard BSIT curriculum at admission',
    migratedBy: 'Juan Dela Cruz'
  }
];

const TORRES_CARLOS_HISTORY: readonly CurriculumHistoryEntry[] = [
  {
    curriculumCode: 'BSCS-22-01',
    academicYear: '2024-2025',
    dateLabel: 'February 14, 2025',
    reason: 'Cross-program curriculum standardization',
    notes: 'Migrated to unified BSCS curriculum for operating systems track',
    migratedBy: 'Maria Santos',
    isCurrent: true
  },
  {
    curriculumCode: 'BSCS-21-01',
    academicYear: '2022-2023',
    dateLabel: 'August 16, 2022',
    reason: 'Initial enrollment',
    notes: 'Enrolled with legacy BSCS curriculum',
    migratedBy: 'System Administrator'
  }
];

const MOCK_CURRICULUM_HISTORY: Readonly<Record<string, readonly CurriculumHistoryEntry[]>> = {
  '010000145957': DELA_CRUZ_JUAN_HISTORY,
  '010000145958': GARCIA_MARIA_HISTORY,
  '010000145959': REYES_PEDRO_HISTORY,
  '010000145960': SANTOS_ANA_HISTORY,
  '010000145961': TORRES_CARLOS_HISTORY
};

function buildDefaultCurriculumHistory(studentId: string): readonly CurriculumHistoryEntry[] {
  const student = findSubjectEvaluationStudent(studentId);
  if (!student) {
    return [];
  }
  const priorCode = student.curriculumCode.replace(/-(\d{2})-/, (_, yy) => {
    const year = Number.parseInt(yy, 10);
    return `-${String(year - 1).padStart(2, '0')}-`;
  });
  return [
    {
      curriculumCode: student.curriculumCode,
      academicYear: '2024-2025',
      dateLabel: 'January 8, 2025',
      reason: 'Current curriculum assignment',
      notes: `Active ${student.programCode} curriculum for ${student.yearLevelShort} level`,
      migratedBy: 'Maria Santos',
      isCurrent: true
    },
    {
      curriculumCode: priorCode,
      academicYear: '2023-2024',
      dateLabel: 'August 15, 2023',
      reason: 'Initial enrollment',
      notes: 'Assigned at admission based on program and year level',
      migratedBy: 'Juan Dela Cruz'
    }
  ];
}

function buildStudentLabel(studentId: string): string | null {
  const student = findSubjectEvaluationStudent(studentId);
  if (student) {
    return `${student.studentNumber} - ${student.lastName}, ${student.firstName}`;
  }

  const profile = getStudentAcademicRecordProfile(studentId);
  if (!profile) {
    return null;
  }

  const nameParts = profile.fullName.split(', ');
  const shortName =
    nameParts.length >= 2 ? `${nameParts[0]}, ${nameParts[1].split(' ')[0]}` : profile.fullName;
  return `${profile.studentNumber} - ${shortName}`;
}

export function getCurriculumHistoryViewModel(studentId: string | null): CurriculumHistoryViewModel | null {
  if (!studentId) {
    return null;
  }

  const studentLabel = buildStudentLabel(studentId);
  const entries = MOCK_CURRICULUM_HISTORY[studentId];

  if (!studentLabel) {
    return null;
  }

  const resolvedEntries =
    entries ?? (isSelectorDemoStudent(studentId) ? buildDefaultCurriculumHistory(studentId) : []);

  return {
    studentLabel,
    entries: resolvedEntries
  };
}
