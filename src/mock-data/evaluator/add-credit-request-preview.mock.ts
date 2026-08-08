export const CREDIT_REQUEST_PREVIEW_MIN_TABLE_ROWS = 5;

export const CREDIT_REQUEST_PREVIEW_ELIGIBILITY_TEXT =
  'Eligibility: The maximum earned units that may be credited shall be limited by the minimum residency requirement as stated in the Student Handbook. Conditions for the accreditation of earned units (Refer to Accreditation of Earned Units Policy for detailed Guidelines & Procedure):';

export const CREDIT_REQUEST_PREVIEW_STI_PROGRAM_RULES = {
  title: 'TERTIARY PROGRAM From STI',
  toChed: [
    "Via Accreditation 'M' units^",
    'Major courses must have been taken within the last Five (5) years'
  ],
  toTesda: ["Via Accreditation 'M' units*"]
} as const;

export const CREDIT_REQUEST_PREVIEW_NON_STI_RULES = {
  title: 'From Non-STI',
  toChed: [
    'No validation of CHED-mandated GE courses from school with M major courses.',
    'Major courses must have been taken within the last three (3) years'
  ],
  toTesda: ['Selective validation']
} as const;

export const CREDIT_REQUEST_PREVIEW_DECLARATION_TEXT =
  'I hereby certify that the information provided in this application is true and correct. I authorize STI to verify any information contained herein and to obtain any additional information it may require.';
