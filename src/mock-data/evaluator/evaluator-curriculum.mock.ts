export type EvaluatorCurriculumStatus = 'active' | 'inactive';

export interface EvaluatorCourseFilterOption {
  value: string;
  label: string;
}

export const EVALUATOR_COURSE_PROGRAM_CODES = ['BSIT', 'BSCS', 'ACT', 'BSBA', 'BSHM'] as const;

export type EvaluatorCourseProgramCode = (typeof EVALUATOR_COURSE_PROGRAM_CODES)[number];

export const EVALUATOR_COURSE_PROGRAM_FILTER_OPTIONS: EvaluatorCourseFilterOption[] = [
  { value: '', label: 'All Programs' },
  ...EVALUATOR_COURSE_PROGRAM_CODES.map((code) => ({ value: code, label: code }))
];

export const EVALUATOR_COURSE_PREREQ_FILTER = {
  all: '',
  withPre: 'with-pre',
  noPre: 'no-pre'
} as const;

export type EvaluatorCoursePrereqFilterValue =
  (typeof EVALUATOR_COURSE_PREREQ_FILTER)[keyof typeof EVALUATOR_COURSE_PREREQ_FILTER];

export const EVALUATOR_COURSE_PREREQ_FILTER_OPTIONS: EvaluatorCourseFilterOption[] = [
  { value: EVALUATOR_COURSE_PREREQ_FILTER.all, label: 'All' },
  { value: EVALUATOR_COURSE_PREREQ_FILTER.withPre, label: 'With Pre-requisite(s)' },
  { value: EVALUATOR_COURSE_PREREQ_FILTER.noPre, label: 'No Pre-requisite(s)' }
];

export function evaluatorCourseHasPrerequisite(prerequisite: string): boolean {
  const normalized = prerequisite.trim().toLowerCase();
  return normalized !== '' && normalized !== 'none' && normalized !== 'n/a';
}

export const EVALUATOR_PROGRAM_TABLE_META: Record<
  EvaluatorCourseProgramCode,
  { programTitle: string; completionYears: number }
> = {
  BSIT: { programTitle: 'Bachelor of Science in Information Technology', completionYears: 4 },
  BSCS: { programTitle: 'Bachelor of Science in Computer Science', completionYears: 4 },
  ACT: { programTitle: 'Associate in Computer Technology', completionYears: 2 },
  BSBA: { programTitle: 'Bachelor of Science in Business Administration', completionYears: 4 },
  BSHM: { programTitle: 'Bachelor of Science in Hospitality Management', completionYears: 4 }
};

export type EvaluatorCourseSemesterLabel = '1st Semester' | '2nd Semester';

export function parseEvaluatorCourseYearSem(
  yearSem: string
): { year: string; semester: EvaluatorCourseSemesterLabel } | null {
  const match = yearSem.trim().match(/^(Year \d+)\s*-\s*(1st|2nd)/i);
  if (!match) {
    return null;
  }
  const semester: EvaluatorCourseSemesterLabel =
    match[2].toLowerCase() === '1st' ? '1st Semester' : '2nd Semester';
  return { year: match[1], semester };
}

export function groupEvaluatorCoursesByYearSemester(
  courses: EvaluatorCourseDetailRow[]
): Record<string, Record<EvaluatorCourseSemesterLabel, EvaluatorCourseDetailRow[]>> {
  const grouped: Record<string, Record<EvaluatorCourseSemesterLabel, EvaluatorCourseDetailRow[]>> = {};

  for (const course of courses) {
    const parsed = parseEvaluatorCourseYearSem(course.yearSem);
    if (!parsed) {
      continue;
    }
    if (!grouped[parsed.year]) {
      grouped[parsed.year] = { '1st Semester': [], '2nd Semester': [] };
    }
    grouped[parsed.year][parsed.semester].push(course);
  }

  return grouped;
}

export const EVALUATOR_TABLE_VIEW_YEAR_ORDER = ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5'] as const;

export function getEvaluatorTableViewYearHeading(year: string): string {
  const headings: Record<string, string> = {
    'Year 1': 'FIRST YEAR',
    'Year 2': 'SECOND YEAR',
    'Year 3': 'THIRD YEAR',
    'Year 4': 'FOURTH YEAR',
    'Year 5': 'FIFTH YEAR'
  };
  return headings[year] ?? year.toUpperCase();
}

export interface EvaluatorCurriculumRow {
  id: string;
  curriculumId: string;
  version: string;
  program: string;
  schoolYear: string;
  effectiveDate: string;
  status: EvaluatorCurriculumStatus;
}

export interface EvaluatorCurriculumProgramCard {
  readonly programCode: string;
  readonly versionCount: number;
  readonly activeCount: number;
}

export const EVALUATOR_CURRICULUM_PROGRAM_CARDS: readonly EvaluatorCurriculumProgramCard[] = [
  { programCode: 'BSCS', versionCount: 3, activeCount: 2 },
  { programCode: 'BSHM', versionCount: 2, activeCount: 2 },
  { programCode: 'BSIT', versionCount: 4, activeCount: 1 },
  { programCode: 'BSTM', versionCount: 2, activeCount: 1 }
];

export function getEvaluatorCurriculaForProgram(programCode: string): EvaluatorCurriculumRow[] {
  return EVALUATOR_CURRICULA_MOCK.filter((row) => row.program === programCode);
}

export interface EvaluatorCourseDetailRow {
  id: string;
  curriculum: string;
  program: string;
  courseCode: string;
  courseTitle: string;
  component: string;
  units: number;
  prerequisite: string;
  yearSem: string;
  description: string;
}

export interface EvaluatorFeeRow {
  feeName: string;
  amount: string;
  schoolYear: string;
}

export const EVALUATOR_CURRICULA_MOCK: EvaluatorCurriculumRow[] = [
  {
    id: 'bscs-25',
    curriculumId: 'BSCS-25-01',
    version: '25-01',
    program: 'BSCS',
    schoolYear: '2025-2026',
    effectiveDate: '2025-08-01',
    status: 'active'
  },
  {
    id: 'bscs-24',
    curriculumId: 'BSCS-24-01',
    version: '24-01',
    program: 'BSCS',
    schoolYear: '2024-2025',
    effectiveDate: '2024-08-01',
    status: 'active'
  },
  {
    id: 'bscs-23',
    curriculumId: 'BSCS-23-01',
    version: '23-01',
    program: 'BSCS',
    schoolYear: '2023-2024',
    effectiveDate: '2023-08-01',
    status: 'inactive'
  },
  {
    id: 'bshm-25',
    curriculumId: 'BSHM-25-01',
    version: '25-01',
    program: 'BSHM',
    schoolYear: '2025-2026',
    effectiveDate: '2025-08-01',
    status: 'active'
  },
  {
    id: 'bshm-24',
    curriculumId: 'BSHM-24-01',
    version: '24-01',
    program: 'BSHM',
    schoolYear: '2024-2025',
    effectiveDate: '2024-08-01',
    status: 'active'
  },
  {
    id: 'bsit-25',
    curriculumId: 'BSIT-25-01',
    version: '25-01',
    program: 'BSIT',
    schoolYear: '2025-2026',
    effectiveDate: '2025-08-01',
    status: 'active'
  },
  {
    id: 'bsit-24',
    curriculumId: 'BSIT-24-01',
    version: '24-01',
    program: 'BSIT',
    schoolYear: '2024-2025',
    effectiveDate: '2024-08-01',
    status: 'inactive'
  },
  {
    id: 'bsit-23',
    curriculumId: 'BSIT-23-01',
    version: '23-01',
    program: 'BSIT',
    schoolYear: '2023-2024',
    effectiveDate: '2023-08-01',
    status: 'inactive'
  },
  {
    id: 'bsit-22',
    curriculumId: 'BSIT-22-01',
    version: '22-01',
    program: 'BSIT',
    schoolYear: '2022-2023',
    effectiveDate: '2022-08-01',
    status: 'inactive'
  },
  {
    id: 'bstm-25',
    curriculumId: 'BSTM-25-01',
    version: '25-01',
    program: 'BSTM',
    schoolYear: '2025-2026',
    effectiveDate: '2025-08-01',
    status: 'active'
  },
  {
    id: 'bstm-24',
    curriculumId: 'BSTM-24-01',
    version: '24-01',
    program: 'BSTM',
    schoolYear: '2024-2025',
    effectiveDate: '2024-08-01',
    status: 'inactive'
  }
];

export const EVALUATOR_COURSES_DETAIL_MOCK: EvaluatorCourseDetailRow[] = [
  {
    id: 'c1',
    curriculum: 'BSIT-25-01',
    program: 'BSIT',
    courseCode: 'IT101',
    courseTitle: 'Introduction to Computing',
    component: 'Lec/Lab',
    units: 3,
    prerequisite: 'None',
    yearSem: 'Year 1 - 1st',
    description: 'Introduction to computer systems and IT fundamentals including hardware, software, and productivity tools.'
  },
  {
    id: 'c2',
    curriculum: 'BSIT-25-01',
    program: 'BSIT',
    courseCode: 'IT102',
    courseTitle: 'Computer Programming 1',
    component: 'Lec/Lab',
    units: 3,
    prerequisite: 'None',
    yearSem: 'Year 1 - 1st',
    description: 'Problem solving and algorithm development using a structured programming language.'
  },
  {
    id: 'c3',
    curriculum: 'BSIT-25-01',
    program: 'BSIT',
    courseCode: 'MATH101',
    courseTitle: 'College Algebra',
    component: 'Lecture',
    units: 3,
    prerequisite: 'None',
    yearSem: 'Year 1 - 1st',
    description: 'Sets, real numbers, polynomials, rational expressions, exponents, radicals, and linear equations.'
  },
  {
    id: 'c4',
    curriculum: 'BSIT-25-01',
    program: 'BSIT',
    courseCode: 'ENG101',
    courseTitle: 'Purposive Communication',
    component: 'Lecture',
    units: 3,
    prerequisite: 'None',
    yearSem: 'Year 1 - 1st',
    description: 'Writing and speaking for academic and professional contexts with emphasis on clarity and audience.'
  },
  {
    id: 'c5',
    curriculum: 'BSIT-25-01',
    program: 'BSIT',
    courseCode: 'NSTP101',
    courseTitle: 'National Service Training Program 1',
    component: 'Lecture',
    units: 3,
    prerequisite: 'None',
    yearSem: 'Year 1 - 1st',
    description: 'Citizenship training through community engagement and civic welfare service learning.'
  },
  {
    id: 'c6',
    curriculum: 'BSIT-25-01',
    program: 'BSIT',
    courseCode: 'PE101',
    courseTitle: 'Physical Education 1',
    component: 'Lecture',
    units: 2,
    prerequisite: 'None',
    yearSem: 'Year 1 - 1st',
    description: 'Fundamental movement skills, fitness concepts, and active lifestyle promotion.'
  },
  {
    id: 'c7',
    curriculum: 'BSIT-25-01',
    program: 'BSIT',
    courseCode: 'IT103',
    courseTitle: 'Computer Programming 2',
    component: 'Lec/Lab',
    units: 3,
    prerequisite: 'IT102',
    yearSem: 'Year 1 - 2nd',
    description: 'Object-oriented programming concepts, encapsulation, inheritance, and polymorphism using industry-standard practices.'
  },
  {
    id: 'c8',
    curriculum: 'BSCS-24-02',
    program: 'BSCS',
    courseCode: 'CS101',
    courseTitle: 'Discrete Structures',
    component: 'Lecture',
    units: 3,
    prerequisite: 'None',
    yearSem: 'Year 1 - 1st',
    description: 'Logic, sets, relations, functions, combinatorics, and graph theory for computing applications.'
  },
  {
    id: 'c9',
    curriculum: 'BSIT-25-01',
    program: 'BSIT',
    courseCode: 'HIST101',
    courseTitle: 'Readings in Philippine History',
    component: 'Lecture',
    units: 3,
    prerequisite: 'None',
    yearSem: 'Year 1 - 1st',
    description: 'Survey of Philippine history from pre-colonial society to contemporary nation-building themes and primary sources.'
  },
  {
    id: 'c10',
    curriculum: 'BSIT-25-01',
    program: 'BSIT',
    courseCode: 'ARTS101',
    courseTitle: 'Art Appreciation',
    component: 'Lecture',
    units: 3,
    prerequisite: 'None',
    yearSem: 'Year 1 - 2nd',
    description: 'Foundations of visual arts, architecture, music, and film with emphasis on analysis, context, and aesthetic judgment.'
  },
  {
    id: 'c11',
    curriculum: 'BSIT-25-01',
    program: 'BSIT',
    courseCode: 'FIL101',
    courseTitle: 'Komunikasyon sa Akademikong Filipino',
    component: 'Lecture',
    units: 3,
    prerequisite: 'None',
    yearSem: 'Year 1 - 1st',
    description: 'Malalim na pag-unawa at pagsulat sa Filipino sa akademikong diskurso at propesyonal na komunikasyon.'
  },
  {
    id: 'c12',
    curriculum: 'BSIT-25-01',
    program: 'BSIT',
    courseCode: 'GE101',
    courseTitle: 'Understanding the Self',
    component: 'Lecture',
    units: 3,
    prerequisite: 'None',
    yearSem: 'Year 1 - 1st',
    description: 'Exploration of self-concept, identity, well-being, and ethical decision-making across personal and social contexts.'
  },
  {
    id: 'c13',
    curriculum: 'BSIT-25-01',
    program: 'BSIT',
    courseCode: 'IT201',
    courseTitle: 'Data Structures and Algorithms',
    component: 'Lec/Lab',
    units: 3,
    prerequisite: 'IT102',
    yearSem: 'Year 2 - 1st',
    description: 'Abstract data types, lists, stacks, queues, trees, graphs, hashing, complexity analysis, and algorithm design techniques.'
  },
  {
    id: 'c14',
    curriculum: 'BSIT-25-01',
    program: 'BSIT',
    courseCode: 'IT202',
    courseTitle: 'Systems Analysis and Design',
    component: 'Lec/Lab',
    units: 3,
    prerequisite: 'IT102',
    yearSem: 'Year 2 - 1st',
    description: 'Requirements engineering, process modeling, data modeling, and structured approaches to building information systems.'
  },
  {
    id: 'c15',
    curriculum: 'BSIT-25-01',
    program: 'BSIT',
    courseCode: 'IT203',
    courseTitle: 'Application Development and Emerging Technologies',
    component: 'Lec/Lab',
    units: 3,
    prerequisite: 'IT102',
    yearSem: 'Year 2 - 2nd',
    description: 'Modern application stacks, APIs, cloud-native patterns, and hands-on development of multi-tier business applications.'
  },
  {
    id: 'c16',
    curriculum: 'BSIT-25-01',
    program: 'BSIT',
    courseCode: 'MATH201',
    courseTitle: 'Plane and Spherical Trigonometry',
    component: 'Lecture',
    units: 3,
    prerequisite: 'MATH101',
    yearSem: 'Year 2 - 1st',
    description: 'Trigonometric functions, identities, inverse functions, laws of sines and cosines, and applications to science and engineering.'
  },
  {
    id: 'c17',
    curriculum: 'BSIT-25-01',
    program: 'BSIT',
    courseCode: 'PATHFIT2',
    courseTitle: 'Exercise-based Fitness Activities II',
    component: 'Lecture',
    units: 2,
    prerequisite: 'PE101',
    yearSem: 'Year 2 - 1st',
    description: 'Progressive physical activity programming, motor skill refinement, and health-related fitness for active lifestyles.'
  },
  {
    id: 'c18',
    curriculum: 'BSIT-25-01',
    program: 'BSIT',
    courseCode: 'IT301',
    courseTitle: 'Information Management',
    component: 'Lec/Lab',
    units: 3,
    prerequisite: 'IT201',
    yearSem: 'Year 3 - 1st',
    description: 'Relational database design, normalization, SQL, transactions, concurrency control, and enterprise data management practices.'
  },
  {
    id: 'c19',
    curriculum: 'BSIT-25-01',
    program: 'BSIT',
    courseCode: 'IT302',
    courseTitle: 'Networking 1',
    component: 'Lec/Lab',
    units: 3,
    prerequisite: 'IT102',
    yearSem: 'Year 3 - 1st',
    description: 'OSI and TCP/IP models, IP addressing, subnetting, routing basics, switching, VLANs, and introductory network security.'
  },
  {
    id: 'c20',
    curriculum: 'BSIT-25-01',
    program: 'BSIT',
    courseCode: 'IT303',
    courseTitle: 'Integrative Programming and Technologies',
    component: 'Lec/Lab',
    units: 3,
    prerequisite: 'IT203',
    yearSem: 'Year 3 - 2nd',
    description: 'Integration of heterogeneous systems, messaging, web services, microservices concepts, and team-based integration projects.'
  },
  {
    id: 'c21',
    curriculum: 'ACT-25-01',
    program: 'ACT',
    courseCode: 'ACT101',
    courseTitle: 'Introduction to Information Technology',
    component: 'Lec/Lab',
    units: 3,
    prerequisite: 'None',
    yearSem: 'Year 1 - 1st',
    description: 'Foundations of computing, digital literacy, and introductory IT concepts for associate-level learners.'
  },
  {
    id: 'c22',
    curriculum: 'BSBA-23-01',
    program: 'BSBA',
    courseCode: 'BA101',
    courseTitle: 'Introduction to Business',
    component: 'Lecture',
    units: 3,
    prerequisite: 'None',
    yearSem: 'Year 1 - 1st',
    description: 'Overview of business organizations, management functions, and the economic environment of enterprise.'
  },
  {
    id: 'c23',
    curriculum: 'BSHM-22-01',
    program: 'BSHM',
    courseCode: 'HM101',
    courseTitle: 'Introduction to Hospitality Management',
    component: 'Lecture',
    units: 3,
    prerequisite: 'None',
    yearSem: 'Year 1 - 1st',
    description: 'Principles of hospitality operations, guest services, and industry career pathways in hotel and restaurant management.'
  }
];

export const EVALUATOR_FEES_MOCK: EvaluatorFeeRow[] = [
  { feeName: 'Tuition (per unit)', amount: '₱ 1,250.00', schoolYear: '2025–2026' },
  { feeName: 'Laboratory Fee', amount: '₱ 3,500.00', schoolYear: '2025–2026' },
  { feeName: 'Miscellaneous', amount: '₱ 2,100.00', schoolYear: '2025–2026' },
  { feeName: 'Library Fee', amount: '₱ 800.00', schoolYear: '2025–2026' }
];

