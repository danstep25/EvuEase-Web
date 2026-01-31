import { FILTER_DEFAULTS } from './filter.constant';

export const SYSTEM_ACTIONS = [
  FILTER_DEFAULTS.ALL_ACTIONS,
  'CREATE',
  'UPDATE',
  'DELETE',
  'FINALIZE',
  'GENERATE',
  'VIEW'
] as const;

