export const API_URL = {
  auth: {
    login: '/Auth/Login'
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
    getById: (id: string) => `/SyTerm/${id}`,
    create: '/SyTerm/new',
    update: (id: string) => `/SyTerm/${id}`,
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
    delete: (code: string) => `/Course/${code}`
  },
  student: {
    base: '/Student',
    getAll: '/Student',
    getById: (id: string) => `/Student/${id}`,
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
  }
};
