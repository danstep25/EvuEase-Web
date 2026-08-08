
export interface EvaluatorStudentPermanentRecordMock {
  readonly studentId: string;
  readonly lastName: string;
  readonly firstName: string;
  readonly programCode: string;
  readonly yearLevel: string;
}

function row(
  studentId: string,
  lastName: string,
  firstName: string,
  programCode: string,
  yearLevel: string
): EvaluatorStudentPermanentRecordMock {
  return { studentId, lastName, firstName, programCode, yearLevel };
}

export const MOCK_EVALUATOR_STUDENT_PERMANENT_RECORDS: readonly EvaluatorStudentPermanentRecordMock[] = [
  row('010000145957', 'Dela Cruz', 'Juan', 'BSIT', 'Year 2Y1'),
  row('010000145958', 'Santos', 'Maria', 'BSCS', 'Year 3Y2'),
  row('010000145959', 'Reyes', 'Jose', 'BSIT', 'Year 1Y1'),
  row('010000145960', 'Garcia', 'Ana', 'BSBA', 'Year 4Y1'),
  row('010000145961', 'Torres', 'Carlos', 'BSCS', 'Year 2Y2'),
  row('010000145962', 'Flores', 'Liza', 'BSIT', 'Year 3Y1'),
  row('010000145963', 'Ramos', 'Miguel', 'BSCE', 'Year 1Y2'),
  row('010000145964', 'Mendoza', 'Angela', 'BSN', 'Year 2Y1'),
  row('010000145965', 'Cruz', 'Paolo', 'BSIT', 'Year 4Y2'),
  row('010000145966', 'Bautista', 'Rica', 'BSCS', 'Year 1Y1'),
  row('010000145967', 'Villanueva', 'Mark', 'BSBA', 'Year 3Y2'),
  row('010000145968', 'Navarro', 'Jen', 'BSIT', 'Year 2Y2'),
  row('010000145969', 'Ocampo', 'Kevin', 'BSCE', 'Year 3Y1'),
  row('010000145970', 'Aquino', 'Sofia', 'BSN', 'Year 1Y1'),
  row('010000145971', 'Lim', 'Daniel', 'BSCS', 'Year 4Y1'),
  row('010000145972', 'Tan', 'Grace', 'BSIT', 'Year 3Y1')
];

