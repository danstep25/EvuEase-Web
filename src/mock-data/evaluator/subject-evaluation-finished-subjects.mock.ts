export interface SubjectEvaluationFinishedSubjectRow {
  readonly courseCode: string;
  readonly subjectDescription: string;
  readonly prerequisite: string;
  readonly units: number;
  readonly grade: string;
  readonly remarks: 'Passed' | 'Failed';
}

const DELA_CRUZ_JUAN_FINISHED_SUBJECTS: readonly SubjectEvaluationFinishedSubjectRow[] = [
  {
    courseCode: 'IT103',
    subjectDescription: 'Computer Programming 2',
    prerequisite: 'IT102',
    units: 3,
    grade: '1.75',
    remarks: 'Passed'
  },
  {
    courseCode: 'IT104',
    subjectDescription: 'Discrete Mathematics',
    prerequisite: 'MATH101',
    units: 3,
    grade: '2',
    remarks: 'Passed'
  },
  {
    courseCode: 'IT105',
    subjectDescription: 'Web Development 1',
    prerequisite: 'IT102',
    units: 3,
    grade: '1.75',
    remarks: 'Passed'
  },
  {
    courseCode: 'GE101',
    subjectDescription: 'Understanding the Self',
    prerequisite: 'None',
    units: 3,
    grade: '1.5',
    remarks: 'Passed'
  },
  {
    courseCode: 'NSTP102',
    subjectDescription: 'National Service Training Program 2',
    prerequisite: 'NSTP101',
    units: 3,
    grade: '1.75',
    remarks: 'Passed'
  },
  {
    courseCode: 'PE102',
    subjectDescription: 'Physical Education 2',
    prerequisite: 'PE101',
    units: 2,
    grade: '1.5',
    remarks: 'Passed'
  }
];

/** Mock finished-subject rows keyed by student id (BSIT/BSCS students only). */
export const SUBJECT_EVALUATION_FINISHED_SUBJECTS_BY_STUDENT: Readonly<
  Record<string, readonly SubjectEvaluationFinishedSubjectRow[]>
> = {
  '010000145957': DELA_CRUZ_JUAN_FINISHED_SUBJECTS,
  '010000145958': [
    {
      courseCode: 'CITE1001',
      subjectDescription: 'Introduction to Computing',
      prerequisite: 'None',
      units: 3,
      grade: '1.50',
      remarks: 'Passed'
    },
    {
      courseCode: 'CITE1002',
      subjectDescription: 'Computer Programming 1',
      prerequisite: 'None',
      units: 3,
      grade: '1.75',
      remarks: 'Passed'
    },
    {
      courseCode: 'GEDC1002',
      subjectDescription: 'The Contemporary World',
      prerequisite: 'None',
      units: 3,
      grade: '1.50',
      remarks: 'Passed'
    },
    {
      courseCode: 'NSTP1008',
      subjectDescription: 'National Service Training Program 1',
      prerequisite: 'None',
      units: 3,
      grade: '1.75',
      remarks: 'Passed'
    },
    {
      courseCode: 'PHED1005',
      subjectDescription: 'P.E./PATHFIT 1: Movement Competency Training',
      prerequisite: 'None',
      units: 2,
      grade: '1.50',
      remarks: 'Passed'
    }
  ],
  '010000145959': [
    {
      courseCode: 'CITE1003',
      subjectDescription: 'Computer Programming 2',
      prerequisite: 'CITE1002',
      units: 3,
      grade: '1.75',
      remarks: 'Passed'
    },
    {
      courseCode: 'CITE1004',
      subjectDescription: 'Discrete Mathematics',
      prerequisite: 'None',
      units: 3,
      grade: '2.00',
      remarks: 'Passed'
    },
    {
      courseCode: 'GEDC1008',
      subjectDescription: 'Understanding the Self',
      prerequisite: 'None',
      units: 3,
      grade: '1.50',
      remarks: 'Passed'
    },
    {
      courseCode: 'INSY2001',
      subjectDescription: 'Information Management',
      prerequisite: 'None',
      units: 3,
      grade: '1.75',
      remarks: 'Passed'
    },
    {
      courseCode: 'PE201',
      subjectDescription: 'Physical Education 3',
      prerequisite: 'PE101',
      units: 2,
      grade: '1.50',
      remarks: 'Passed'
    }
  ],
  '010000145960': [
    {
      courseCode: 'CITE4001',
      subjectDescription: 'Capstone Project 1',
      prerequisite: 'CITE3005',
      units: 3,
      grade: '1.25',
      remarks: 'Passed'
    },
    {
      courseCode: 'INSY4001',
      subjectDescription: 'IT Audit and Controls',
      prerequisite: 'INSY3002',
      units: 3,
      grade: '1.50',
      remarks: 'Passed'
    },
    {
      courseCode: 'CITE4002',
      subjectDescription: 'Information Assurance and Security',
      prerequisite: 'CITE3003',
      units: 3,
      grade: '1.75',
      remarks: 'Passed'
    },
    {
      courseCode: 'INTE1040',
      subjectDescription: 'IT Elective 4',
      prerequisite: 'None',
      units: 3,
      grade: '1.50',
      remarks: 'Passed'
    }
  ],
  '010000145961': [
    {
      courseCode: 'COSC1001',
      subjectDescription: 'Principles of Communication',
      prerequisite: 'None',
      units: 3,
      grade: '1.50',
      remarks: 'Passed'
    },
    {
      courseCode: 'COSC1008',
      subjectDescription: 'Platform Technology (Operating Systems)',
      prerequisite: 'None',
      units: 3,
      grade: '1.75',
      remarks: 'Passed'
    },
    {
      courseCode: 'GEDC1006',
      subjectDescription: 'Readings in Philippine History',
      prerequisite: 'None',
      units: 3,
      grade: '1.50',
      remarks: 'Passed'
    },
    {
      courseCode: 'GEDC1014',
      subjectDescription: "Rizal's Life and Works",
      prerequisite: 'None',
      units: 3,
      grade: '1.75',
      remarks: 'Passed'
    },
    {
      courseCode: 'BUSS1013',
      subjectDescription: 'Technopreneurship',
      prerequisite: 'None',
      units: 3,
      grade: '2.00',
      remarks: 'Passed'
    }
  ],
  '010000145962': [
    {
      courseCode: 'IT301',
      subjectDescription: 'Database Management Systems',
      prerequisite: 'IT201',
      units: 3,
      grade: '1.75',
      remarks: 'Passed'
    },
    {
      courseCode: 'IT302',
      subjectDescription: 'Web Systems and Technologies',
      prerequisite: 'IT301',
      units: 3,
      grade: '2.00',
      remarks: 'Passed'
    }
  ],
  '010000145965': [
    {
      courseCode: 'IT101',
      subjectDescription: 'Introduction to Computing',
      prerequisite: 'None',
      units: 3,
      grade: '1.50',
      remarks: 'Passed'
    }
  ],
  '010000145966': [
    {
      courseCode: 'CS101',
      subjectDescription: 'Introduction to Computer Science',
      prerequisite: 'None',
      units: 3,
      grade: '1.50',
      remarks: 'Passed'
    }
  ],
  '010000145970': [
    {
      courseCode: 'IT301',
      subjectDescription: 'Database Management Systems',
      prerequisite: 'IT201',
      units: 3,
      grade: '1.75',
      remarks: 'Passed'
    },
    {
      courseCode: 'IT302',
      subjectDescription: 'Web Systems and Technologies',
      prerequisite: 'IT301',
      units: 3,
      grade: '2.00',
      remarks: 'Passed'
    }
  ],
  '010000145973': [
    {
      courseCode: 'IT201',
      subjectDescription: 'Data Structures and Algorithms',
      prerequisite: 'IT102',
      units: 3,
      grade: '1.50',
      remarks: 'Passed'
    }
  ],
  '010000145977': [
    {
      courseCode: 'IT401',
      subjectDescription: 'Capstone Project 1',
      prerequisite: 'IT302',
      units: 3,
      grade: '1.25',
      remarks: 'Passed'
    }
  ]
};

export function getSubjectEvaluationFinishedSubjects(
  studentId: string | null
): readonly SubjectEvaluationFinishedSubjectRow[] {
  if (!studentId) {
    return [];
  }
  return SUBJECT_EVALUATION_FINISHED_SUBJECTS_BY_STUDENT[studentId] ?? [];
}
