import type {
  EvaluatorCourseDetailRow,
  EvaluatorCurriculumRow,
  EvaluatorTableViewCurriculumOption
} from '../../app/pages/Evaluator/curriculum-view/evaluator-curriculum-view.models';
import {
  EVALUATOR_CURRICULA_MOCK,
  getEvaluatorCurriculaForProgram
} from './evaluator-curriculum.mock';

export const EVALUATOR_BSIT_CURRICULUM_VERSIONS: EvaluatorTableViewCurriculumOption[] = [
  {
    id: 'bsit-25',
    curriculumId: 'BSIT-25-01',
    version: '25-01',
    versionSuffix: '25-01',
    program: 'BSIT',
    schoolYear: '2025-2026',
    effectiveDate: '2025-08-01',
    status: 'active'
  },
  {
    id: 'bsit-24',
    curriculumId: 'BSIT-24-01',
    version: '24-01',
    versionSuffix: '24-01',
    program: 'BSIT',
    schoolYear: '2024-2025',
    effectiveDate: '2024-08-01',
    status: 'inactive'
  },
  {
    id: 'bsit-23',
    curriculumId: 'BSIT-23-01',
    version: '23-01',
    versionSuffix: '23-01',
    program: 'BSIT',
    schoolYear: '2023-2024',
    effectiveDate: '2023-08-01',
    status: 'inactive'
  },
  {
    id: 'bsit-22',
    curriculumId: 'BSIT-22-01',
    version: '22-01',
    versionSuffix: '22-01',
    program: 'BSIT',
    schoolYear: '2022-2023',
    effectiveDate: '2022-08-01',
    status: 'inactive'
  }
];

export const EVALUATOR_BSIT_TABLE_VIEW_SUMMARY = {
  summaryTotalUnits: 166,
  footerTotalCourses: 37,
  footerTotalUnits: 110,
  completionYears: 4
} as const;

export function toTableViewCurriculumOption(row: EvaluatorCurriculumRow): EvaluatorTableViewCurriculumOption {
  return {
    ...row,
    versionSuffix: row.version
  };
}

export function getEvaluatorTableViewCurriculumOptions(
  programCode: string
): EvaluatorTableViewCurriculumOption[] {
  if (!programCode.trim()) {
    return EVALUATOR_CURRICULA_MOCK.map(toTableViewCurriculumOption);
  }
  return getEvaluatorCurriculaForProgram(programCode).map(toTableViewCurriculumOption);
}

export function formatTableViewCurriculumDropdownLabel(option: EvaluatorTableViewCurriculumOption): string {
  return `${option.curriculumId} - ${option.versionSuffix}`;
}

export function formatTableViewCurriculumVersionDisplay(option: EvaluatorTableViewCurriculumOption): string {
  return `${option.curriculumId} - ${option.versionSuffix}`;
}

type MatrixCourse = Omit<EvaluatorCourseDetailRow, 'id' | 'curriculum' | 'program' | 'description'>;

function matrixRow(id: string, course: MatrixCourse): EvaluatorCourseDetailRow {
  return {
    id,
    curriculum: 'BSIT-25-01',
    program: 'BSIT',
    description: '',
    ...course
  };
}

export const EVALUATOR_BSIT_MATRIX_COURSES_MOCK: EvaluatorCourseDetailRow[] = [
  matrixRow('m01', { courseCode: 'IT101', courseTitle: 'Introduction to Computing', component: 'Lec/Lab', units: 3, prerequisite: 'None', yearSem: 'Year 1 - 1st' }),
  matrixRow('m02', { courseCode: 'IT102', courseTitle: 'Computer Programming 1', component: 'Lec/Lab', units: 3, prerequisite: 'None', yearSem: 'Year 1 - 1st' }),
  matrixRow('m03', { courseCode: 'MATH101', courseTitle: 'College Algebra', component: 'Lecture', units: 3, prerequisite: 'None', yearSem: 'Year 1 - 1st' }),
  matrixRow('m04', { courseCode: 'ENG101', courseTitle: 'Purposive Communication', component: 'Lecture', units: 3, prerequisite: 'None', yearSem: 'Year 1 - 1st' }),
  matrixRow('m05', { courseCode: 'NSTP101', courseTitle: 'National Service Training Program 1', component: 'Lecture', units: 3, prerequisite: 'None', yearSem: 'Year 1 - 1st' }),
  matrixRow('m06', { courseCode: 'PE101', courseTitle: 'Physical Education 1', component: 'Lecture', units: 2, prerequisite: 'None', yearSem: 'Year 1 - 1st' }),
  matrixRow('m07', { courseCode: 'IT103', courseTitle: 'Computer Programming 2', component: 'Lec/Lab', units: 3, prerequisite: 'IT102', yearSem: 'Year 1 - 2nd' }),
  matrixRow('m08', { courseCode: 'IT104', courseTitle: 'Discrete Mathematics', component: 'Lecture', units: 3, prerequisite: 'MATH101', yearSem: 'Year 1 - 2nd' }),
  matrixRow('m09', { courseCode: 'IT105', courseTitle: 'Web Development 1', component: 'Lec/Lab', units: 3, prerequisite: 'IT102', yearSem: 'Year 1 - 2nd' }),
  matrixRow('m10', { courseCode: 'GE101', courseTitle: 'Understanding the Self', component: 'Lecture', units: 3, prerequisite: 'None', yearSem: 'Year 1 - 2nd' }),
  matrixRow('m11', { courseCode: 'NSTP102', courseTitle: 'National Service Training Program 2', component: 'Lecture', units: 3, prerequisite: 'NSTP101', yearSem: 'Year 1 - 2nd' }),
  matrixRow('m12', { courseCode: 'PE102', courseTitle: 'Physical Education 2', component: 'Lecture', units: 2, prerequisite: 'PE101', yearSem: 'Year 1 - 2nd' }),
  matrixRow('m13', { courseCode: 'IT201', courseTitle: 'Data Structures and Algorithms', component: 'Lec/Lab', units: 3, prerequisite: 'IT103', yearSem: 'Year 2 - 1st' }),
  matrixRow('m14', { courseCode: 'IT202', courseTitle: 'Database Management Systems', component: 'Lec/Lab', units: 3, prerequisite: 'IT103', yearSem: 'Year 2 - 1st' }),
  matrixRow('m15', { courseCode: 'IT203', courseTitle: 'Information Management', component: 'Lecture', units: 3, prerequisite: 'None', yearSem: 'Year 2 - 1st' }),
  matrixRow('m16', { courseCode: 'GE201', courseTitle: 'The Contemporary World', component: 'Lecture', units: 3, prerequisite: 'None', yearSem: 'Year 2 - 1st' }),
  matrixRow('m17', { courseCode: 'PE201', courseTitle: 'Physical Education 3', component: 'Lecture', units: 2, prerequisite: 'PE102', yearSem: 'Year 2 - 1st' }),
  matrixRow('m18', { courseCode: 'IT204', courseTitle: 'Object-Oriented Programming', component: 'Lec/Lab', units: 3, prerequisite: 'IT201', yearSem: 'Year 2 - 2nd' }),
  matrixRow('m19', { courseCode: 'IT205', courseTitle: 'Networking Fundamentals', component: 'Lec/Lab', units: 3, prerequisite: 'None', yearSem: 'Year 2 - 2nd' }),
  matrixRow('m20', { courseCode: 'IT206', courseTitle: 'Systems Analysis and Design', component: 'Lec/Lab', units: 3, prerequisite: 'IT202', yearSem: 'Year 2 - 2nd' }),
  matrixRow('m21', { courseCode: 'GE202', courseTitle: 'Ethics', component: 'Lecture', units: 3, prerequisite: 'None', yearSem: 'Year 2 - 2nd' }),
  matrixRow('m22', { courseCode: 'PE202', courseTitle: 'Physical Education 4', component: 'Lecture', units: 2, prerequisite: 'PE201', yearSem: 'Year 2 - 2nd' }),
  matrixRow('m23', { courseCode: 'IT301', courseTitle: 'Web Development 2', component: 'Lec/Lab', units: 3, prerequisite: 'IT105, IT202', yearSem: 'Year 3 - 1st' }),
  matrixRow('m24', { courseCode: 'IT302', courseTitle: 'Operating Systems', component: 'Lec/Lab', units: 3, prerequisite: 'IT201', yearSem: 'Year 3 - 1st' }),
  matrixRow('m25', { courseCode: 'IT303', courseTitle: 'Information Security', component: 'Lec/Lab', units: 3, prerequisite: 'IT205', yearSem: 'Year 3 - 1st' }),
  matrixRow('m26', { courseCode: 'IT304', courseTitle: 'Software Engineering 1', component: 'Lec/Lab', units: 3, prerequisite: 'IT206', yearSem: 'Year 3 - 1st' }),
  matrixRow('m27', { courseCode: 'GE301', courseTitle: 'Rizal: Life and Works', component: 'Lecture', units: 3, prerequisite: 'None', yearSem: 'Year 3 - 1st' }),
  matrixRow('m28', { courseCode: 'IT305', courseTitle: 'Mobile Application Development', component: 'Lec/Lab', units: 3, prerequisite: 'IT204', yearSem: 'Year 3 - 2nd' }),
  matrixRow('m29', { courseCode: 'IT306', courseTitle: 'Cloud Computing', component: 'Lec/Lab', units: 3, prerequisite: 'IT302', yearSem: 'Year 3 - 2nd' }),
  matrixRow('m30', { courseCode: 'IT307', courseTitle: 'Software Engineering 2', component: 'Lec/Lab', units: 3, prerequisite: 'IT304', yearSem: 'Year 3 - 2nd' }),
  matrixRow('m31', { courseCode: 'IT308', courseTitle: 'Human-Computer Interaction', component: 'Lecture', units: 3, prerequisite: 'None', yearSem: 'Year 3 - 2nd' }),
  matrixRow('m32', { courseCode: 'ELEC301', courseTitle: 'IT Elective 1', component: 'Lec/Lab', units: 3, prerequisite: 'None', yearSem: 'Year 3 - 2nd' }),
  matrixRow('m33', { courseCode: 'IT401', courseTitle: 'Capstone Project 1', component: 'Lec/Lab', units: 3, prerequisite: 'IT307', yearSem: 'Year 4 - 1st' }),
  matrixRow('m34', { courseCode: 'IT402', courseTitle: 'IT Project Management', component: 'Lecture', units: 3, prerequisite: 'IT307', yearSem: 'Year 4 - 1st' }),
  matrixRow('m35', { courseCode: 'ELEC401', courseTitle: 'IT Elective 2', component: 'Lec/Lab', units: 3, prerequisite: 'None', yearSem: 'Year 4 - 1st' }),
  matrixRow('m36', { courseCode: 'IT403', courseTitle: 'Capstone Project 2', component: 'Lec/Lab', units: 3, prerequisite: 'IT401', yearSem: 'Year 4 - 2nd' }),
  matrixRow('m37', { courseCode: 'IT404', courseTitle: 'Practicum (486 hours)', component: 'Practicum', units: 3, prerequisite: 'IT401', yearSem: 'Year 4 - 2nd' })
];

