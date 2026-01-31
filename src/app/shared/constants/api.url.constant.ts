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
    getLookup: (lookupType: string) => `/Lookup/${lookupType}`
  }
};
