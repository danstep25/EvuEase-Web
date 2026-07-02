export const API_URL = {
  auth: {
    login: '/Auth/Login'
  },
  admin: {
    studentPortalPasswordResetRequests: '/Admin/student-portal/password-reset-requests',
    resolveStudentPortalPasswordReset: (id: number | string) =>
      `/Admin/student-portal/password-reset-requests/${id}/resolve`,
    rejectStudentPortalPasswordReset: (id: number | string) =>
      `/Admin/student-portal/password-reset-requests/${id}/reject`
  },
  studentPortal: {
    login: '/StudentPortal/Login',
    me: '/StudentPortal/Me',
    dashboard: '/StudentPortal/dashboard',
    enrollments: '/StudentPortal/enrollments',
    pendingSubjects: '/StudentPortal/pending-subjects',
    changePassword: '/StudentPortal/change-password',
    passwordResetRequest: '/StudentPortal/password-reset-request',
  },
  user: {
    base: '/User',
    getAll: '/User',
    getById: (id: string) => `/User/${id}`,
    create: '/User/new',
    update: (id: string) => `/User/${id}`,
    delete: (id: string) => `/User/${id}`,
    activate: (id: string) => `/User/${id}/activate`,
    deactivate: (id: string) => `/User/${id}/deactivate`,
    statistics: '/User/statistics',
    stats: '/User/stats'
  },
  systemLog: {
    base: '/SystemLog',
    getAll: '/SystemLog',
    statistics: '/SystemLog/statistics'
  },
  lookup: {
    base: '/Lookup',
    modules: '/Lookup/modules',
    programs: '/Lookup/programs',
    syTerms: '/Lookup/syterms',
    curricula: '/Lookup/curricula',
    curriculumVersions: '/Lookup/curriculum-versions',
    courses: '/Lookup/courses',
    
    gradeRosterClasses: '/Lookup/grade-roster-classes',
    getLookup: (lookupType: string) => `/Lookup/${lookupType}`
  },
  program: {
    base: '/Program',
    getAll: '/Program',
    getById: (id: string) => `/Program/${id}`,
    create: '/Program/new',
    update: (id: string) => `/Program/${id}`,
    delete: (id: string) => `/Program/${id}`
  },
  syTerm: {
    base: '/SyTerm',
    getAll: '/SyTerm',
    current: '/SyTerm/current',
    getById: (id: string) => `/SyTerm/${id}`,
    create: '/SyTerm/new',
    update: (id: string) => `/SyTerm/${id}`,
    setCurrent: (id: string) => `/SyTerm/${id}/set-current`,
    delete: (id: string) => `/SyTerm/${id}`
  },
  curricula: {
    base: '/Curricula',
    getAll: '/Curricula',
    getById: (id: string) => `/Curricula/${id}`,
    create: '/Curricula/new',
    update: (id: string) => `/Curricula/${id}`,
    delete: (id: string) => `/Curricula/${id}`
  },
  course: {
    base: '/Course',
    getAll: '/Course',
    getById: (code: string) => `/Course/${code}`,
    create: '/Course/new',
    update: (code: string) => `/Course/${code}`,
    delete: (code: string) => `/Course/${code}`,
    batchPreview: '/Course/batch/preview',
    batchDetectPdf: '/Course/batch/detect-pdf',
    batchParsePdf: '/Course/batch/parse-pdf',
    batchImport: '/Course/batch/import'
  },
  student: {
    base: '/Student',
    getAll: '/Student',
    getById: (id: string) => `/Student/${id}`,
    enrollments: (id: string) => `/Student/${id}/enrollments`,
    curriculumHistory: (id: string) => `/Student/${id}/curriculum-history`,
    migrateCurriculum: (id: string) => `/Student/${id}/migrate-curriculum`,
    create: '/Student/new',
    update: (id: string) => `/Student/${id}`,
    delete: (id: string) => `/Student/${id}`
  },
  tuitionFees: {
    base: '/TuitionFees',
    getAll: '/TuitionFees',
    getById: (id: string) => `/TuitionFees/${id}`,
    create: '/TuitionFees/new',
    update: (id: string) => `/TuitionFees/${id}`,
    delete: (id: string) => `/TuitionFees/${id}`
  },
  otherSchoolFees: {
    base: '/OtherSchoolFees',
    getAll: '/OtherSchoolFees',
    getById: (id: string) => `/OtherSchoolFees/${id}`,
    create: '/OtherSchoolFees/new',
    update: (id: string) => `/OtherSchoolFees/${id}`,
    delete: (id: string) => `/OtherSchoolFees/${id}`
  },
  miscellaneousFees: {
    base: '/MiscellaneousFees',
    getAll: '/MiscellaneousFees',
    getById: (id: string) => `/MiscellaneousFees/${id}`,
    create: '/MiscellaneousFees/new',
    update: (id: string) => `/MiscellaneousFees/${id}`,
    delete: (id: string) => `/MiscellaneousFees/${id}`
  },
  downpayment: {
    base: '/Downpayment',
    getAll: '/Downpayment',
    getById: (id: string) => `/Downpayment/${id}`,
    history: '/Downpayment/history',
    create: '/Downpayment/new',
    update: (id: string) => `/Downpayment/${id}`,
    delete: (id: string) => `/Downpayment/${id}`
  },
  paymentScheme: {
    base: '/PaymentScheme',
    getAll: '/PaymentScheme',
    getById: (id: string) => `/PaymentScheme/${id}`,
    create: '/PaymentScheme/new',
    update: (id: string) => `/PaymentScheme/${id}`,
    delete: (id: string) => `/PaymentScheme/${id}`
  },
  creditRequest: {
    base: '/CreditRequest',
    getAll: '/CreditRequest',
    getById: (id: string) => `/CreditRequest/${id}`,
    create: '/CreditRequest/new',
    updateStatus: (id: string) => `/CreditRequest/${id}/status`,
    uploadSignedPdf: (id: string) => `/CreditRequest/${id}/signed-pdf`,
    downloadSignedPdf: (id: string) => `/CreditRequest/${id}/signed-pdf`
  },
  classAssignment: {
    gradingSchemeBasis: '/ClassAssignment/grading-scheme-basis'
  },
  classRoster: {
    base: '/ClassRoster',
    byId: (id: number | string) => `/ClassRoster/${id}`,
    students: (classId: number | string) => `/ClassRoster/${classId}/students`,
    
    classEnrollment: (classId: number | string, enrollmentId: number | string) =>
      `/ClassRoster/${classId}/students/${enrollmentId}`,
    studentsUpload: (classId: number | string) => `/ClassRoster/${classId}/students/upload`,
    importPdf: '/ClassRoster/import-pdf',
    previewClassListPdf: '/ClassRoster/preview-class-list-pdf',
    enrollmentGrade: (enrollmentId: number | string) => `/ClassRoster/enrollments/${enrollmentId}/grade`
  },
  gradeRoster: {
    base: '/GradeRoster'
  },
  
  analytics: {
    dashboard: '/Analytics/dashboard'
  },
  archive: {
    programs: '/Archive/programs',
    students: '/Archive/students',
    schoolYears: '/Archive/school-years',
    curricula: '/Archive/curricula',
    restoreProgram: (id: number | string) => `/Archive/programs/${id}/restore`,
    permanentProgram: (id: number | string) => `/Archive/programs/${id}/permanent`,
    restoreStudent: (id: number | string) => `/Archive/students/${id}/restore`,
    permanentStudent: (id: number | string) => `/Archive/students/${id}/permanent`,
    restoreSchoolYear: (id: number | string) => `/Archive/school-years/${id}/restore`,
    permanentSchoolYear: (id: number | string) => `/Archive/school-years/${id}/permanent`,
    restoreCurriculum: (id: number | string) => `/Archive/curricula/${id}/restore`,
    permanentCurriculum: (id: number | string) => `/Archive/curricula/${id}/permanent`
  }
};
