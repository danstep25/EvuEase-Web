export const USER_ROLES = ['Admin', 'Evaluator', 'Registrar'] as const;

export const ROLE_MAP: { [key: string]: number } = {
  'Admin': 0,
  'Evaluator': 1,
  'Registrar': 2
};

export const DEFAULT_ROLE = 'Evaluator';

