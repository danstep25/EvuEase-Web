export enum NotificationType {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info'
}

export interface NotificationTypeConfig {
  icon: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  iconColorClass: string;
}

export const NOTIFICATION_ICONS: Record<NotificationType, string> = {
  [NotificationType.SUCCESS]: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  [NotificationType.ERROR]: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
  [NotificationType.WARNING]: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  [NotificationType.INFO]: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
};

export const NOTIFICATION_STYLES: Record<NotificationType, NotificationTypeConfig> = {
  [NotificationType.SUCCESS]: {
    icon: NOTIFICATION_ICONS[NotificationType.SUCCESS],
    bgClass: 'bg-green-50',
    borderClass: 'border-green-200',
    textClass: 'text-green-800',
    iconColorClass: 'text-green-400'
  },
  [NotificationType.ERROR]: {
    icon: NOTIFICATION_ICONS[NotificationType.ERROR],
    bgClass: 'bg-red-50',
    borderClass: 'border-red-200',
    textClass: 'text-red-800',
    iconColorClass: 'text-red-400'
  },
  [NotificationType.WARNING]: {
    icon: NOTIFICATION_ICONS[NotificationType.WARNING],
    bgClass: 'bg-yellow-50',
    borderClass: 'border-yellow-200',
    textClass: 'text-yellow-800',
    iconColorClass: 'text-yellow-400'
  },
  [NotificationType.INFO]: {
    icon: NOTIFICATION_ICONS[NotificationType.INFO],
    bgClass: 'bg-blue-50',
    borderClass: 'border-blue-200',
    textClass: 'text-blue-800',
    iconColorClass: 'text-blue-400'
  }
};

export const NOTIFICATION_DEFAULTS = {
  DURATION: 5000,
  ERROR_DURATION: 7000
} as const;

