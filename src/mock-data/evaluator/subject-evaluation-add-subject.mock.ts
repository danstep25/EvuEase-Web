import {
  isSelectorDemoStudent,
  SUBJECT_EVALUATION_SELECTOR_STUDENT_IDS
} from './subject-evaluation-demo-students.mock';

export interface AddSubjectCatalogItem {
  readonly courseCode: string;
  readonly subjectDescription: string;
  readonly prerequisite: string;
  readonly units: number;
  readonly termLabel?: string;
  readonly prerequisiteMet: boolean;
}

const SHARED_ADD_SUBJECT_CATALOG: readonly AddSubjectCatalogItem[] = [
    {
      courseCode: 'CITE3001',
      subjectDescription: 'Web Development',
      prerequisite: 'CITE2002',
      units: 3,
      termLabel: '2025-2026 - 2nd Semester',
      prerequisiteMet: false
    },
    {
      courseCode: 'CITE3002',
      subjectDescription: 'Software Engineering',
      prerequisite: 'INSY2002',
      units: 3,
      termLabel: '2025-2026 - 2nd Semester',
      prerequisiteMet: false
    },
    {
      courseCode: 'CITE3003',
      subjectDescription: 'Operating Systems',
      prerequisite: 'CITE2001',
      units: 3,
      termLabel: '2025-2026 - 2nd Semester',
      prerequisiteMet: false
    },
    {
      courseCode: 'INSY3001',
      subjectDescription: 'IT Project Management',
      prerequisite: 'INSY2002',
      units: 3,
      termLabel: '2025-2026 - 2nd Semester',
      prerequisiteMet: false
    },
    {
      courseCode: 'GE301',
      subjectDescription: 'Art Appreciation',
      prerequisite: 'None',
      units: 3,
      termLabel: '2025-2026 - 2nd Semester',
      prerequisiteMet: true
    },
    {
      courseCode: 'CITE3004',
      subjectDescription: 'Mobile Application Development',
      prerequisite: 'CITE3001',
      units: 3,
      termLabel: '2025-2026 - 2nd Semester',
      prerequisiteMet: false
    },
    {
      courseCode: 'CITE3005',
      subjectDescription: 'Computer Networks',
      prerequisite: 'CITE3003',
      units: 3,
      termLabel: '2024-2025 - 2nd Semester',
      prerequisiteMet: false
    },
    {
      courseCode: 'INSY3002',
      subjectDescription: 'Business Intelligence',
      prerequisite: 'CITE2003',
      units: 3,
      termLabel: '2024-2025 - 2nd Semester',
      prerequisiteMet: false
    },
    {
      courseCode: 'GE302',
      subjectDescription: 'Science, Technology and Society',
      prerequisite: 'None',
      units: 3,
      termLabel: '2025-2026 - 2nd Semester',
      prerequisiteMet: true
    },
    {
      courseCode: 'ELEC301',
      subjectDescription: 'Professional Elective 1',
      prerequisite: '3rd Year Standing',
      units: 3,
      termLabel: '2025-2026 - 2nd Semester',
      prerequisiteMet: true
    }
];

const ADD_SUBJECT_CATALOG_BY_STUDENT: Readonly<Record<string, readonly AddSubjectCatalogItem[]>> =
  Object.fromEntries(
    SUBJECT_EVALUATION_SELECTOR_STUDENT_IDS.map((id) => [id, SHARED_ADD_SUBJECT_CATALOG])
  );

const DEFAULT_CATALOG: readonly AddSubjectCatalogItem[] = [
  {
    courseCode: 'GEN101',
    subjectDescription: 'General Education Elective',
    prerequisite: 'None',
    units: 3,
    termLabel: '2025-2026 - 2nd Semester',
    prerequisiteMet: true
  }
];

export function getAddSubjectCatalog(studentId: string | null): readonly AddSubjectCatalogItem[] {
  if (!studentId) {
    return DEFAULT_CATALOG;
  }
  if (isSelectorDemoStudent(studentId)) {
    return SHARED_ADD_SUBJECT_CATALOG;
  }
  return ADD_SUBJECT_CATALOG_BY_STUDENT[studentId] ?? DEFAULT_CATALOG;
}

export function filterAddSubjectCatalog(
  catalog: readonly AddSubjectCatalogItem[],
  query: string,
  excludeCourseCodes: readonly string[] = []
): readonly AddSubjectCatalogItem[] {
  const excluded = new Set(excludeCourseCodes.map((code) => code.toUpperCase()));
  const normalized = query.trim().toLowerCase();

  return catalog.filter((item) => {
    if (excluded.has(item.courseCode.toUpperCase())) {
      return false;
    }
    if (!normalized) {
      return false;
    }
    return (
      item.courseCode.toLowerCase().includes(normalized) ||
      item.subjectDescription.toLowerCase().includes(normalized)
    );
  });
}
