export const USER_STATUSES = ['Active', 'Inactive'] as const;

export const STATUS_MAP: { [key: string]: number } = {
  'Active': 1,
  'Inactive': 0
};

export const DEFAULT_STATUS = 'Active';

