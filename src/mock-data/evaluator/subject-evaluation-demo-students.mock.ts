/** Students shown in the Step 1 searchable selector (Figma list). */
export const SUBJECT_EVALUATION_SELECTOR_STUDENT_IDS = [
  '010000145957',
  '010000145958',
  '010000145959',
  '010000145960',
  '010000145961'
] as const;

export type SubjectEvaluationSelectorStudentId = (typeof SUBJECT_EVALUATION_SELECTOR_STUDENT_IDS)[number];

export interface SubjectEvaluationDemoStudentConfig {
  readonly id: SubjectEvaluationSelectorStudentId;
  readonly currentYearTerm: string;
  readonly chargeSlipCurriculumVersion: string;
  readonly defaultSelectionIds: readonly string[];
}

export const SUBJECT_EVALUATION_DEMO_STUDENT_CONFIG: Readonly<
  Record<SubjectEvaluationSelectorStudentId, SubjectEvaluationDemoStudentConfig>
> = {
  '010000145957': {
    id: '010000145957',
    currentYearTerm: '2Y1',
    chargeSlipCurriculumVersion: 'BSCS-22-01',
    defaultSelectionIds: [
      'GEDC1008-1Y1',
      'INTE1006-1Y2',
      'GEDC1006-2Y1',
      'GEDC1014-2Y1',
      'COSC1001-2Y1',
      'COSC1008-2Y1'
    ]
  },
  '010000145958': {
    id: '010000145958',
    currentYearTerm: '1Y2',
    chargeSlipCurriculumVersion: 'BSIT-22-01',
    defaultSelectionIds: [
      'COSC1002-1Y2',
      'GEDC1010-1Y2',
      'GEDC1009-1Y2',
      'GEDC1016-1Y2',
      'GEDC1013-1Y2',
      'INTE1006-1Y2'
    ]
  },
  '010000145959': {
    id: '010000145959',
    currentYearTerm: '2Y1',
    chargeSlipCurriculumVersion: 'BSIT-22-01',
    defaultSelectionIds: [
      'GEDC1006-2Y1',
      'GEDC1014-2Y1',
      'COSC1001-2Y1',
      'COSC1008-2Y1',
      'GEDC1008-1Y1',
      'INTE1006-1Y2'
    ]
  },
  '010000145960': {
    id: '010000145960',
    currentYearTerm: '4Y2',
    chargeSlipCurriculumVersion: 'BSIT-22-01',
    defaultSelectionIds: ['INTE1040-4Y1', 'INTE1013-4Y1', 'INTE1043-4Y2']
  },
  '010000145961': {
    id: '010000145961',
    currentYearTerm: '2Y2',
    chargeSlipCurriculumVersion: 'BSCS-22-01',
    defaultSelectionIds: [
      'GEDC1041-2Y2',
      'BUSS1013-2Y2',
      'INTE1021-2Y2',
      'GEDC1006-2Y1',
      'GEDC1014-2Y1',
      'COSC1008-2Y1'
    ]
  }
};

export function isSelectorDemoStudent(studentId: string | null): studentId is SubjectEvaluationSelectorStudentId {
  return (
    studentId != null &&
    (SUBJECT_EVALUATION_SELECTOR_STUDENT_IDS as readonly string[]).includes(studentId)
  );
}

export function getDemoStudentConfig(
  studentId: string | null
): SubjectEvaluationDemoStudentConfig | null {
  if (!isSelectorDemoStudent(studentId)) {
    return null;
  }
  return SUBJECT_EVALUATION_DEMO_STUDENT_CONFIG[studentId];
}

export function getDefaultSelectionIdsForStudent(studentId: string | null): readonly string[] {
  return getDemoStudentConfig(studentId)?.defaultSelectionIds ?? [];
}
