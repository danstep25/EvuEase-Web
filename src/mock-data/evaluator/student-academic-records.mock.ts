import type { SearchableSelectOption } from '../../app/shared/components/searchable-select/searchable-select-option.model';
import { isSelectorDemoStudent } from './subject-evaluation-demo-students.mock';
import {
  getSubjectEvaluationFinishedSubjects,
  type SubjectEvaluationFinishedSubjectRow
} from './subject-evaluation-finished-subjects.mock';
import {
  findSubjectEvaluationStudent,
  getSubjectEvaluationSelectorStudents,
  toSubjectEvaluationStudentOption
} from './subject-evaluation.mock';

export type AcademicRecordRemark = 'PASSED' | 'FAILED' | 'PASSED (RETAKE)';

export type AcademicRecordSemesterHeaderVariant = 'recent' | 'standard';

export interface AcademicRecordCourseRow {
  readonly courseCode: string;
  readonly subjectDescription: string;
  readonly units: number;
  readonly grade: string;
  readonly remarks: AcademicRecordRemark;
  readonly showGradeHistoryIcon?: boolean;
}

export interface AcademicRecordSemesterBlock {
  readonly label: string;
  readonly headerVariant: AcademicRecordSemesterHeaderVariant;
  readonly courses: readonly AcademicRecordCourseRow[];
  readonly totalUnits: number;
}

export interface AcademicRecordCurriculumCourseRow {
  readonly courseCode: string;
  readonly subjectDescription: string;
  readonly prerequisite: string;
  readonly units: number;
}

export interface AcademicRecordCurriculumTermBlock {
  readonly label: string;
  readonly courses: readonly AcademicRecordCurriculumCourseRow[];
  readonly totalUnits: number;
}

export interface StudentAcademicRecordProfile {
  readonly studentNumber: string;
  readonly fullName: string;
  readonly yearLevel: string;
  readonly status: string;
  readonly program: string;
  readonly currentCurriculum: string;
  readonly currentCurriculumCode?: string;
  readonly termSemesters: readonly AcademicRecordSemesterBlock[];
  readonly curriculumTerms: readonly AcademicRecordCurriculumTermBlock[];
}

const DELA_CRUZ_JUAN_TERM_SEMESTERS: readonly AcademicRecordSemesterBlock[] = [
  {
    label: '2023-2024 - 2nd Semester (Most Recent)',
    headerVariant: 'recent',
    totalUnits: 14,
    courses: [
      { courseCode: 'CITE2002', subjectDescription: 'Object-Oriented Programming', units: 3, grade: '2.00', remarks: 'PASSED' },
      { courseCode: 'CITE2003', subjectDescription: 'Database Management Systems', units: 3, grade: '1.75', remarks: 'PASSED' },
      { courseCode: 'INSY2002', subjectDescription: 'Systems Analysis and Design', units: 3, grade: '2.25', remarks: 'PASSED' },
      { courseCode: 'GE202', subjectDescription: 'Ethics', units: 3, grade: '1.50', remarks: 'PASSED' },
      { courseCode: 'PE202', subjectDescription: 'Physical Education 4', units: 2, grade: '1.75', remarks: 'PASSED' }
    ]
  },
  {
    label: '2023-2024 - 1st Semester',
    headerVariant: 'standard',
    totalUnits: 14,
    courses: [
      {
        courseCode: 'CITE1002',
        subjectDescription: 'Computer Programming 1',
        units: 3,
        grade: '2.00',
        remarks: 'PASSED (RETAKE)',
        showGradeHistoryIcon: true
      },
      { courseCode: 'INSY2001', subjectDescription: 'Information Management', units: 3, grade: '1.75', remarks: 'PASSED' },
      { courseCode: 'CITE2001', subjectDescription: 'Data Structures and Algorithms', units: 3, grade: '2.50', remarks: 'PASSED' },
      { courseCode: 'GE201', subjectDescription: 'The Contemporary World', units: 3, grade: '1.75', remarks: 'PASSED' },
      { courseCode: 'PE201', subjectDescription: 'Physical Education 3', units: 2, grade: '1.50', remarks: 'PASSED' }
    ]
  },
  {
    label: '2022-2023 - 2nd Semester',
    headerVariant: 'standard',
    totalUnits: 14,
    courses: [
      { courseCode: 'CITE1003', subjectDescription: 'Computer Programming 2', units: 3, grade: '1.75', remarks: 'PASSED' },
      { courseCode: 'CITE1004', subjectDescription: 'Discrete Mathematics', units: 3, grade: '2.25', remarks: 'PASSED' },
      { courseCode: 'GE102', subjectDescription: 'Understanding the Self', units: 3, grade: '1.50', remarks: 'PASSED' },
      { courseCode: 'GE103', subjectDescription: 'Readings in Philippine History', units: 3, grade: '2.00', remarks: 'PASSED' },
      { courseCode: 'PE102', subjectDescription: 'Physical Education 2', units: 2, grade: '1.50', remarks: 'PASSED' }
    ]
  },
  {
    label: '2022-2023 - 1st Semester',
    headerVariant: 'standard',
    totalUnits: 14,
    courses: [
      { courseCode: 'CITE1001', subjectDescription: 'Introduction to Computing', units: 3, grade: '1.50', remarks: 'PASSED' },
      { courseCode: 'CITE1002', subjectDescription: 'Computer Programming 1', units: 3, grade: '5.00', remarks: 'FAILED' },
      { courseCode: 'MATH1001', subjectDescription: 'College Algebra', units: 3, grade: '2.00', remarks: 'PASSED' },
      { courseCode: 'GE101', subjectDescription: 'Purposive Communication', units: 3, grade: '1.75', remarks: 'PASSED' },
      { courseCode: 'PE101', subjectDescription: 'Physical Education 1', units: 2, grade: '1.50', remarks: 'PASSED' }
    ]
  }
];

const DELA_CRUZ_JUAN_CURRICULUM_TERMS: readonly AcademicRecordCurriculumTermBlock[] = [
  {
    label: '1st Year - 1st Term',
    totalUnits: 14,
    courses: [
      { courseCode: 'CITE1001', subjectDescription: 'Introduction to Computing', prerequisite: 'None', units: 3 },
      { courseCode: 'CITE1002', subjectDescription: 'Computer Programming 1', prerequisite: 'None', units: 3 },
      { courseCode: 'MATH1001', subjectDescription: 'College Algebra', prerequisite: 'None', units: 3 },
      { courseCode: 'GE101', subjectDescription: 'Purposive Communication', prerequisite: 'None', units: 3 },
      { courseCode: 'PE101', subjectDescription: 'Physical Education 1', prerequisite: 'None', units: 2 }
    ]
  },
  {
    label: '1st Year - 2nd Term',
    totalUnits: 14,
    courses: [
      { courseCode: 'CITE1003', subjectDescription: 'Computer Programming 2', prerequisite: 'CITE1002', units: 3 },
      { courseCode: 'CITE1004', subjectDescription: 'Discrete Mathematics', prerequisite: 'None', units: 3 },
      { courseCode: 'GE102', subjectDescription: 'Understanding the Self', prerequisite: 'None', units: 3 },
      { courseCode: 'GE103', subjectDescription: 'Readings in Philippine History', prerequisite: 'None', units: 3 },
      { courseCode: 'PE102', subjectDescription: 'Physical Education 2', prerequisite: 'None', units: 2 }
    ]
  },
  {
    label: '2nd Year - 1st Term',
    totalUnits: 14,
    courses: [
      { courseCode: 'CITE1002', subjectDescription: 'Computer Programming 1', prerequisite: 'None', units: 3 },
      { courseCode: 'INSY2001', subjectDescription: 'Information Management', prerequisite: 'None', units: 3 },
      { courseCode: 'CITE2001', subjectDescription: 'Data Structures and Algorithms', prerequisite: 'CITE1003', units: 3 },
      { courseCode: 'GE201', subjectDescription: 'The Contemporary World', prerequisite: 'None', units: 3 },
      { courseCode: 'PE201', subjectDescription: 'Physical Education 3', prerequisite: 'None', units: 2 }
    ]
  },
  {
    label: '2nd Year - 2nd Term',
    totalUnits: 14,
    courses: [
      { courseCode: 'CITE2002', subjectDescription: 'Object-Oriented Programming', prerequisite: 'CITE2001', units: 3 },
      { courseCode: 'CITE2003', subjectDescription: 'Database Management Systems', prerequisite: 'CITE2001', units: 3 },
      { courseCode: 'INSY2002', subjectDescription: 'Systems Analysis and Design', prerequisite: 'INSY2001', units: 3 },
      { courseCode: 'GE202', subjectDescription: 'Ethics', prerequisite: 'None', units: 3 },
      { courseCode: 'PE202', subjectDescription: 'Physical Education 4', prerequisite: 'PE201', units: 2 }
    ]
  }
];

function finishedToAcademicCourses(
  finished: readonly SubjectEvaluationFinishedSubjectRow[]
): AcademicRecordCourseRow[] {
  return finished.map((row) => ({
    courseCode: row.courseCode,
    subjectDescription: row.subjectDescription,
    units: row.units,
    grade: row.grade,
    remarks: row.remarks === 'Passed' ? 'PASSED' : 'FAILED'
  }));
}

function buildTermSemestersFromFinished(
  finished: readonly SubjectEvaluationFinishedSubjectRow[]
): readonly AcademicRecordSemesterBlock[] {
  if (finished.length === 0) {
    return [];
  }
  const recentCourses = finishedToAcademicCourses(finished);
  const recentUnits = recentCourses.reduce((sum, row) => sum + row.units, 0);
  return [
    {
      label: '2023-2024 - 2nd Semester (Most Recent)',
      headerVariant: 'recent',
      courses: recentCourses,
      totalUnits: recentUnits
    },
    {
      label: '2022-2023 - 1st Semester',
      headerVariant: 'standard',
      courses: [
        {
          courseCode: 'CITE1001',
          subjectDescription: 'Introduction to Computing',
          units: 3,
          grade: '1.50',
          remarks: 'PASSED'
        },
        {
          courseCode: 'GEDC1002',
          subjectDescription: 'The Contemporary World',
          units: 3,
          grade: '1.75',
          remarks: 'PASSED'
        },
        {
          courseCode: 'PE101',
          subjectDescription: 'Physical Education 1',
          units: 2,
          grade: '1.50',
          remarks: 'PASSED'
        }
      ],
      totalUnits: 8
    }
  ];
}

function buildSelectorAcademicProfile(studentId: string): StudentAcademicRecordProfile | null {
  const student = findSubjectEvaluationStudent(studentId);
  if (!student) {
    return null;
  }
  const finished = getSubjectEvaluationFinishedSubjects(studentId);
  const curriculumTerms =
    student.programCode === 'BSCS' ? DELA_CRUZ_JUAN_CURRICULUM_TERMS : DELA_CRUZ_JUAN_CURRICULUM_TERMS;

  return {
    studentNumber: student.studentNumber,
    fullName: `${student.lastName}, ${student.firstName}`,
    yearLevel: `Year ${student.yearLevelShort}`,
    status: 'Active',
    program: student.programCode,
    currentCurriculum: `${student.curriculumCode} - 2024-2025`,
    currentCurriculumCode: student.curriculumCode,
    termSemesters: buildTermSemestersFromFinished(finished),
    curriculumTerms
  };
}

const MOCK_PROFILES: Readonly<Record<string, StudentAcademicRecordProfile>> = {
  '010000145957': {
    studentNumber: '010000145957',
    fullName: 'Dela Cruz, Juan',
    yearLevel: 'Year 2Y1',
    status: 'Active',
    program: 'BSIT',
    currentCurriculum: 'BSIT-22-01 - 2022-2023',
    currentCurriculumCode: 'BSIT-22-01',
    termSemesters: DELA_CRUZ_JUAN_TERM_SEMESTERS,
    curriculumTerms: DELA_CRUZ_JUAN_CURRICULUM_TERMS
  },
  '010000145958': {
    studentNumber: '010000145958',
    fullName: 'Garcia, Maria',
    yearLevel: 'Year 1Y2',
    status: 'Active',
    program: 'BSIT',
    currentCurriculum: 'BSIT-22-01 - 2023-2024',
    currentCurriculumCode: 'BSIT-22-01',
    termSemesters: buildTermSemestersFromFinished(
      getSubjectEvaluationFinishedSubjects('010000145958')
    ),
    curriculumTerms: DELA_CRUZ_JUAN_CURRICULUM_TERMS
  },
  '010000145959': {
    studentNumber: '010000145959',
    fullName: 'Reyes, Pedro',
    yearLevel: 'Year 2Y1',
    status: 'Active',
    program: 'BSIT',
    currentCurriculum: 'BSIT-22-01 - 2024-2025',
    currentCurriculumCode: 'BSIT-22-01',
    termSemesters: buildTermSemestersFromFinished(
      getSubjectEvaluationFinishedSubjects('010000145959')
    ),
    curriculumTerms: DELA_CRUZ_JUAN_CURRICULUM_TERMS
  },
  '010000145960': {
    studentNumber: '010000145960',
    fullName: 'Santos, Ana',
    yearLevel: 'Year 4Y2',
    status: 'Active',
    program: 'BSIT',
    currentCurriculum: 'BSIT-22-01 - 2021-2022',
    currentCurriculumCode: 'BSIT-22-01',
    termSemesters: buildTermSemestersFromFinished(
      getSubjectEvaluationFinishedSubjects('010000145960')
    ),
    curriculumTerms: DELA_CRUZ_JUAN_CURRICULUM_TERMS
  },
  '010000145961': {
    studentNumber: '010000145961',
    fullName: 'Torres, Carlos',
    yearLevel: 'Year 2Y2',
    status: 'Active',
    program: 'BSCS',
    currentCurriculum: 'BSCS-22-01 - 2024-2025',
    currentCurriculumCode: 'BSCS-22-01',
    termSemesters: buildTermSemestersFromFinished(
      getSubjectEvaluationFinishedSubjects('010000145961')
    ),
    curriculumTerms: DELA_CRUZ_JUAN_CURRICULUM_TERMS
  }
};

function buildFallbackProfile(studentId: string): StudentAcademicRecordProfile | null {
  if (isSelectorDemoStudent(studentId)) {
    return buildSelectorAcademicProfile(studentId);
  }
  const student = findSubjectEvaluationStudent(studentId);
  if (!student) {
    return null;
  }
  const finished = getSubjectEvaluationFinishedSubjects(studentId);
  return {
    studentNumber: student.studentNumber,
    fullName: `${student.lastName}, ${student.firstName}`,
    yearLevel: `Year ${student.yearLevelShort}`,
    status: 'Active',
    program: student.programCode,
    currentCurriculum: `${student.curriculumCode} - 2024-2025`,
    currentCurriculumCode: student.curriculumCode,
    termSemesters: buildTermSemestersFromFinished(finished),
    curriculumTerms: []
  };
}

export function getAcademicRecordsStudentOptions(): SearchableSelectOption[] {
  return getSubjectEvaluationSelectorStudents().map((student) => toSubjectEvaluationStudentOption(student));
}

export function getStudentAcademicRecordProfile(studentId: string | null): StudentAcademicRecordProfile | null {
  if (!studentId) {
    return null;
  }
  return MOCK_PROFILES[studentId] ?? buildFallbackProfile(studentId);
}
