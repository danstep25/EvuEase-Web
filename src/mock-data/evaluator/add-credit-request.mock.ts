/** Min / max for LEC & LAB numeric steppers on course credit mapping rows. */
export const EVALUATOR_CREDIT_REQUEST_MIN_UNIT = 0;
export const EVALUATOR_CREDIT_REQUEST_MAX_UNIT = 6;

/** Grade stepper increment (no min/max — free up/down). */
export const EVALUATOR_CREDIT_REQUEST_GRADE_STEP = 0.01;

export interface EquivalentStiCourseOption {
  readonly id: string;
  readonly code: string;
  readonly title: string;
  readonly totalUnits: number;
}

/** Dropdown options in exact Figma scroll order (all screenshot variants combined). */
const EQUIVALENT_STI_COURSE_TITLES: readonly string[] = [
  'Introduction to Computing',
  'Computer Programming 1',
  'College Algebra',
  'Purposive Communication',
  'National Service Training Program 1',
  'Physical Education 1',
  'Computer Programming 2',
  'Discrete Mathematics',
  'Web Development 1',
  'Understanding the Self',
  'National Service Training Program 2',
  'Physical Education 2',
  'Data Structures and Algorithms',
  'Database Management Systems',
  'Information Management',
  'The Contemporary World',
  'Physical Education 3',
  'Object-Oriented Programming',
  'Networking Fundamentals',
  'Systems Analysis and Design',
  'Ethics',
  'Physical Education 4',
  'Web Development 2',
  'Operating Systems',
  'Information Security',
  'Software Engineering 1',
  'Rizal: Life and Works',
  'Mobile Application Development',
  'Cloud Computing',
  'Software Engineering 2',
  'Human-Computer Interaction',
  'IT Elective 1',
  'Capstone Project 1',
  'IT Project Management',
  'IT Elective 2',
  'Capstone Project 2',
  'Practicum (486 hours)',
  'Euthenics 1',
  'The Entrepreneurial Mind',
  'Mathematics in the Modern World',
  'P.E./PATHFIT 1: Movement Competency Training',
  'Art Appreciation',
  'Discrete Structures 1 (Discrete Mathematics)',
  'P.E./PATHFIT 2: Exercise-based Fitness Activities',
  'Science, Technology, and Society',
  'Systems Administration and Maintenance',
  'Readings in Philippine History',
  'P.E./PATHFIT 3: Individual-Dual Sports',
  "Rizal's Life and Works",
  'Principles of Communication',
  'Platform Technology (Operating Systems)',
  'Philippine Popular Culture',
  'P.E./PATHFIT 4: Team Sports',
  'Network Technology 1',
  'Quantitative Methods',
  'Technopreneurship',
  'Systems Integration and Architecture',
  'Integrative Programming',
  'Application Development and Emerging Technologies',
  'Advanced Systems Integration and Architecture',
  'Advanced Database Systems',
  'Event-Driven Programming',
  'Professional Issues in Information Systems and Technology',
  'Data and Digital Communications (Data Communications)',
  'Mobile Systems and Technologies',
  'IT Elective 3',
  'Great Books',
  'Management Information Systems',
  'IT Capstone Project 1',
  'Information Assurance & Security (Cybersecurity Fundamentals)',
  'Web Systems and Technologies',
  'Euthenics 2',
  'Information Assurance and Security (Data Privacy)',
  'IT Capstone Project 2',
  'IT Elective 4',
  'Network Technology 2',
  'IT Service Management',
  'Computer Graphics Programming',
  'IT Practicum (486 hours)',
  'Enterprise Architecture',
  'Programming Languages',
  'Game Development'
];

const EQUIVALENT_STI_COURSE_CODES: Record<string, string> = {
  'Introduction to Computing': 'IT101',
  'Computer Programming 1': 'IT102',
  'College Algebra': 'MATH101',
  'Purposive Communication': 'ENG101',
  'National Service Training Program 1': 'NSTP101',
  'Physical Education 1': 'PE101',
  'Computer Programming 2': 'IT103',
  'Discrete Mathematics': 'MATH102',
  'Web Development 1': 'IT201',
  'Understanding the Self': 'GE101',
  'National Service Training Program 2': 'NSTP102',
  'Physical Education 2': 'PE102',
  'Data Structures and Algorithms': 'IT202',
  'Database Management Systems': 'IT203',
  'Information Management': 'IT204',
  'The Contemporary World': 'GE102',
  'Physical Education 3': 'PE103',
  'Object-Oriented Programming': 'IT301',
  'Networking Fundamentals': 'IT302',
  'Systems Analysis and Design': 'IT303',
  'Ethics': 'GE103',
  'Physical Education 4': 'PE104',
  'Web Development 2': 'IT304',
  'Operating Systems': 'IT305',
  'Information Security': 'IT306',
  'Software Engineering 1': 'IT307',
  'Rizal: Life and Works': 'GE104',
  "Rizal's Life and Works": 'GE104',
  'Mobile Application Development': 'IT308',
  'Cloud Computing': 'IT309',
  'Software Engineering 2': 'IT310',
  'Human-Computer Interaction': 'IT311',
  'IT Elective 1': 'IT312',
  'Capstone Project 1': 'IT401',
  'IT Project Management': 'IT402',
  'IT Elective 2': 'IT403',
  'Capstone Project 2': 'IT404',
  'Practicum (486 hours)': 'IT405',
  'Euthenics 1': 'GE105',
  'The Entrepreneurial Mind': 'GE106',
  'Mathematics in the Modern World': 'MATH103',
  'P.E./PATHFIT 1: Movement Competency Training': 'PE105',
  'Art Appreciation': 'GE107',
  'Discrete Structures 1 (Discrete Mathematics)': 'MATH104',
  'P.E./PATHFIT 2: Exercise-based Fitness Activities': 'PE106',
  'Science, Technology, and Society': 'GE108',
  'Systems Administration and Maintenance': 'IT313',
  'Readings in Philippine History': 'GE109',
  'P.E./PATHFIT 3: Individual-Dual Sports': 'PE107',
  'Principles of Communication': 'ENG102',
  'Platform Technology (Operating Systems)': 'IT314',
  'Philippine Popular Culture': 'GE110',
  'P.E./PATHFIT 4: Team Sports': 'PE108',
  'Network Technology 1': 'IT315',
  'Quantitative Methods': 'MATH105',
  'Technopreneurship': 'IT316',
  'Systems Integration and Architecture': 'IT317',
  'Integrative Programming': 'IT318',
  'Application Development and Emerging Technologies': 'IT319',
  'Advanced Systems Integration and Architecture': 'IT320',
  'Advanced Database Systems': 'IT321',
  'Event-Driven Programming': 'IT322',
  'Professional Issues in Information Systems and Technology': 'IT323',
  'Data and Digital Communications (Data Communications)': 'IT324',
  'Mobile Systems and Technologies': 'IT325',
  'IT Elective 3': 'IT326',
  'Great Books': 'GE111',
  'Management Information Systems': 'IT327',
  'IT Capstone Project 1': 'IT406',
  'Information Assurance & Security (Cybersecurity Fundamentals)': 'IT328',
  'Web Systems and Technologies': 'IT329',
  'Euthenics 2': 'GE112',
  'Information Assurance and Security (Data Privacy)': 'IT330',
  'IT Capstone Project 2': 'IT407',
  'IT Elective 4': 'IT331',
  'Network Technology 2': 'IT332',
  'IT Service Management': 'IT333',
  'Computer Graphics Programming': 'IT334',
  'IT Practicum (486 hours)': 'IT408',
  'Enterprise Architecture': 'IT335',
  'Programming Languages': 'IT336',
  'Game Development': 'IT337'
};

function defaultUnitsForTitle(title: string): number {
  if (title === 'IT Practicum (486 hours)') {
    return 9;
  }
  if (title === 'Practicum (486 hours)') {
    return 6;
  }
  if (title === 'Euthenics 1' || title === 'Euthenics 2') {
    return 1;
  }
  if (/^Physical Education [1-4]$/.test(title) || title.startsWith('P.E./PATHFIT')) {
    return 2;
  }
  return 3;
}

function buildEquivalentStiCourses(): EquivalentStiCourseOption[] {
  return EQUIVALENT_STI_COURSE_TITLES.map((title, index) => {
    const code = EQUIVALENT_STI_COURSE_CODES[title] ?? `CRS${String(index + 1).padStart(3, '0')}`;
    return {
      id: `sti-${index + 1}`,
      code,
      title,
      totalUnits: defaultUnitsForTitle(title)
    };
  });
}

export const EVALUATOR_EQUIVALENT_STI_COURSES: readonly EquivalentStiCourseOption[] =
  buildEquivalentStiCourses();

export function findEquivalentStiCourse(
  courses: readonly EquivalentStiCourseOption[],
  id: string | null | undefined
): EquivalentStiCourseOption | null {
  if (!id) {
    return null;
  }
  return courses.find((c) => c.id === id) ?? null;
}
