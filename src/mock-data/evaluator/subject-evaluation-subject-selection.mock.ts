export type SubjectSelectionViewMode = 'current' | 'all';

export interface SubjectSelectionSuggestedRow {
  readonly id: string;
  readonly courseCode: string;
  readonly subjectDescription: string;
  readonly prerequisite: string;
  readonly units: number;
  readonly component: string;
  readonly yearTerm: string;
}

export interface SubjectSelectionUnitsSummary {
  readonly regularUnitsForNextTerm: number;
  readonly totalUnitsSelected: number;
  readonly unitLimit: number;
}

export interface SubjectSelectionLimits {
  readonly regularUnitsForNextTerm: number;
  readonly unitLimit: number;
}

export interface SubjectSelectionMockState {
  readonly limits: SubjectSelectionLimits;
  readonly currentYearTerm: string;
  readonly allTermCourses: readonly SubjectSelectionSuggestedRow[];
}

export const SUGGESTED_NEW_SUBJECTS_MOCK: readonly SubjectSelectionSuggestedRow[] = [
  {
    id: 'CITE1004-1Y1',
    courseCode: 'CITE1004',
    subjectDescription: 'Introduction to Computing',
    prerequisite: 'None',
    units: 3,
    component: 'Lec/Lab',
    yearTerm: '1Y1'
  },
  {
    id: 'CITE1003-1Y1',
    courseCode: 'CITE1003',
    subjectDescription: 'Computer Programming 1',
    prerequisite: 'None',
    units: 3,
    component: 'Lec/Lab',
    yearTerm: '1Y1'
  },
  {
    id: 'GEDC1002-1Y1',
    courseCode: 'GEDC1002',
    subjectDescription: 'The Contemporary World',
    prerequisite: 'None',
    units: 3,
    component: 'Lecture',
    yearTerm: '1Y1'
  },
  {
    id: 'STPC1002-1Y1',
    courseCode: 'STPC1002',
    subjectDescription: 'Euthenics 1',
    prerequisite: 'None',
    units: 1,
    component: 'Lecture',
    yearTerm: '1Y1'
  },
  {
    id: 'GEDC1013-1Y1',
    courseCode: 'GEDC1013',
    subjectDescription: 'The Entrepreneurial Mind',
    prerequisite: 'None',
    units: 3,
    component: 'Lecture',
    yearTerm: '1Y1'
  },
  {
    id: 'GEDC1005-1Y1',
    courseCode: 'GEDC1005',
    subjectDescription: 'Mathematics in the Modern World',
    prerequisite: 'None',
    units: 3,
    component: 'Lecture',
    yearTerm: '1Y1'
  },
  {
    id: 'NSTP1008-1Y1',
    courseCode: 'NSTP1008',
    subjectDescription: 'National Service Training Program 1',
    prerequisite: 'None',
    units: 3,
    component: 'Lecture',
    yearTerm: '1Y1'
  },
  {
    id: 'PHED1005-1Y1',
    courseCode: 'PHED1005',
    subjectDescription: 'P.E./PATHFIT 1: Movement Competency Training',
    prerequisite: 'None',
    units: 2,
    component: 'Lecture',
    yearTerm: '1Y1'
  },
  {
    id: 'GEDC1008-1Y1',
    courseCode: 'GEDC1008',
    subjectDescription: 'Understanding the Self',
    prerequisite: 'None',
    units: 3,
    component: 'Lecture',
    yearTerm: '1Y1'
  },
  {
    id: 'COSC1002-1Y2',
    courseCode: 'COSC1002',
    subjectDescription: 'Discrete Structures 1 (Discrete Mathematics)',
    prerequisite: 'None',
    units: 3,
    component: 'Lecture',
    yearTerm: '1Y2'
  },
  {
    id: 'GEDC1010-1Y2',
    courseCode: 'GEDC1010',
    subjectDescription: 'Art Appreciation',
    prerequisite: 'None',
    units: 3,
    component: 'Lecture',
    yearTerm: '1Y2'
  },
  {
    id: 'GEDC1009-1Y2',
    courseCode: 'GEDC1009',
    subjectDescription: 'Ethics',
    prerequisite: 'None',
    units: 3,
    component: 'Lecture',
    yearTerm: '1Y2'
  },
  {
    id: 'GEDC1016-1Y2',
    courseCode: 'GEDC1016',
    subjectDescription: 'Purposive Communication',
    prerequisite: 'None',
    units: 3,
    component: 'Lecture',
    yearTerm: '1Y2'
  },
  {
    id: 'GEDC1013-1Y2',
    courseCode: 'GEDC1013',
    subjectDescription: 'Science, Technology, and Society',
    prerequisite: 'None',
    units: 3,
    component: 'Lecture',
    yearTerm: '1Y2'
  },
  {
    id: 'INTE1006-1Y2',
    courseCode: 'INTE1006',
    subjectDescription: 'Systems Administration and Maintenance',
    prerequisite: 'None',
    units: 3,
    component: 'Lec/Lab',
    yearTerm: '1Y2'
  },
  {
    id: 'GEDC1006-2Y1',
    courseCode: 'GEDC1006',
    subjectDescription: 'Readings in Philippine History',
    prerequisite: 'None',
    units: 3,
    component: 'Lecture',
    yearTerm: '2Y1'
  },
  {
    id: 'GEDC1014-2Y1',
    courseCode: 'GEDC1014',
    subjectDescription: "Rizal's Life and Works",
    prerequisite: 'None',
    units: 3,
    component: 'Lecture',
    yearTerm: '2Y1'
  },
  {
    id: 'COSC1001-2Y1',
    courseCode: 'COSC1001',
    subjectDescription: 'Principles of Communication',
    prerequisite: 'None',
    units: 3,
    component: 'Lecture',
    yearTerm: '2Y1'
  },
  {
    id: 'COSC1008-2Y1',
    courseCode: 'COSC1008',
    subjectDescription: 'Platform Technology (Operating Systems)',
    prerequisite: 'None',
    units: 3,
    component: 'Lec/Lab',
    yearTerm: '2Y1'
  },
  {
    id: 'GEDC1041-2Y2',
    courseCode: 'GEDC1041',
    subjectDescription: 'Philippine Popular Culture',
    prerequisite: 'None',
    units: 3,
    component: 'Lecture',
    yearTerm: '2Y2'
  },
  {
    id: 'BUSS1013-2Y2',
    courseCode: 'BUSS1013',
    subjectDescription: 'Technopreneurship',
    prerequisite: 'None',
    units: 3,
    component: 'Lecture',
    yearTerm: '2Y2'
  },
  {
    id: 'INTE1021-2Y2',
    courseCode: 'INTE1021',
    subjectDescription: 'Systems Integration and Architecture',
    prerequisite: 'None',
    units: 3,
    component: 'Lec/Lab',
    yearTerm: '2Y2'
  },
  {
    id: 'GEDC1045-3Y2',
    courseCode: 'GEDC1045',
    subjectDescription: 'Great Books',
    prerequisite: 'None',
    units: 3,
    component: 'Lecture',
    yearTerm: '3Y2'
  },
  {
    id: 'INSY1007-3Y2',
    courseCode: 'INSY1007',
    subjectDescription: 'Management Information Systems',
    prerequisite: 'None',
    units: 3,
    component: 'Lecture',
    yearTerm: '3Y2'
  },
  {
    id: 'INTE1040-4Y1',
    courseCode: 'INTE1040',
    subjectDescription: 'IT Elective 4',
    prerequisite: 'None',
    units: 3,
    component: 'Lec/Lab',
    yearTerm: '4Y1'
  },
  {
    id: 'INTE1013-4Y1',
    courseCode: 'INTE1013',
    subjectDescription: 'IT Service Management',
    prerequisite: 'None',
    units: 3,
    component: 'Lecture',
    yearTerm: '4Y1'
  },
  {
    id: 'INTE1043-4Y2',
    courseCode: 'INTE1043',
    subjectDescription: 'IT Practicum (486 hours)',
    prerequisite: 'None',
    units: 9,
    component: 'Practicum',
    yearTerm: '4Y2'
  }
];

import {
  getDefaultSelectionIdsForStudent,
  getDemoStudentConfig,
  isSelectorDemoStudent
} from './subject-evaluation-demo-students.mock';
import { findSubjectEvaluationStudent } from './subject-evaluation.mock';

const SHARED_SUBJECT_SELECTION_LIMITS: SubjectSelectionLimits = {
  regularUnitsForNextTerm: 23,
  unitLimit: 23
};

function buildSubjectSelectionForDemoStudent(
  currentYearTerm: string
): SubjectSelectionMockState {
  return {
    limits: SHARED_SUBJECT_SELECTION_LIMITS,
    currentYearTerm,
    allTermCourses: SUGGESTED_NEW_SUBJECTS_MOCK
  };
}

const DEFAULT_SUBJECT_SELECTION: SubjectSelectionMockState = {
  limits: SHARED_SUBJECT_SELECTION_LIMITS,
  currentYearTerm: '1Y1',
  allTermCourses: SUGGESTED_NEW_SUBJECTS_MOCK
};

export function pickDefaultSelectionIdsForYearTerm(
  yearTerm: string,
  unitLimit = 23
): readonly string[] {
  const termMatches = SUGGESTED_NEW_SUBJECTS_MOCK.filter((row) => row.yearTerm === yearTerm);
  const pool = termMatches.length > 0 ? termMatches : SUGGESTED_NEW_SUBJECTS_MOCK;
  const selected: string[] = [];
  let totalUnits = 0;

  for (const row of pool) {
    if (totalUnits + row.units > unitLimit) {
      continue;
    }
    selected.push(row.id);
    totalUnits += row.units;
  }

  return selected;
}

export function getSubjectSelectionState(studentId: string | null): SubjectSelectionMockState {
  if (!studentId) {
    return DEFAULT_SUBJECT_SELECTION;
  }

  const config = getDemoStudentConfig(studentId);
  if (config) {
    return buildSubjectSelectionForDemoStudent(config.currentYearTerm);
  }

  const student = findSubjectEvaluationStudent(studentId);
  if (student && isSelectorDemoStudent(studentId)) {
    return buildSubjectSelectionForDemoStudent(student.yearLevelShort);
  }

  return DEFAULT_SUBJECT_SELECTION;
}

export function getCurrentTermSuggestedCourses(
  state: SubjectSelectionMockState
): readonly SubjectSelectionSuggestedRow[] {
  return state.allTermCourses.filter((row) => row.yearTerm === state.currentYearTerm);
}

export function computeSuggestedUnitsSelected(
  courses: readonly SubjectSelectionSuggestedRow[],
  selectedIds: ReadonlySet<string>
): number {
  return courses.reduce((sum, row) => (selectedIds.has(row.id) ? sum + row.units : sum), 0);
}

export function buildUnitsSummary(
  regularUnitsForNextTerm: number,
  totalUnitsSelected: number,
  unitLimit: number
): SubjectSelectionUnitsSummary {
  return {
    regularUnitsForNextTerm,
    totalUnitsSelected,
    unitLimit
  };
}

export function getDefaultSuggestedSelectionIds(studentId: string | null): readonly string[] {
  const preset = getDefaultSelectionIdsForStudent(studentId);
  if (preset.length > 0) {
    return preset;
  }

  const student = findSubjectEvaluationStudent(studentId);
  if (!student || !isSelectorDemoStudent(studentId)) {
    return [];
  }

  return pickDefaultSelectionIdsForYearTerm(student.yearLevelShort);
}

export function subjectSelectionExceedsLimit(summary: SubjectSelectionUnitsSummary): boolean {
  return summary.totalUnitsSelected > summary.unitLimit;
}
