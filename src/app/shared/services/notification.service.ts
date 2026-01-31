import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { NotificationType, NOTIFICATION_DEFAULTS } from '../constants/notification.constant';

export type NotificationTypeString = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationTypeString;
  title: string;
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly notificationsSubject = new BehaviorSubject<Notification[]>([]);
  readonly notifications$: Observable<Notification[]> = this.notificationsSubject.asObservable();

  show(type: NotificationTypeString, title: string, message: string, duration?: number): void {
    const notification: Notification = {
      id: this.generateId(),
      type,
      title,
      message,
      duration: duration ?? NOTIFICATION_DEFAULTS.DURATION
    };

    const currentNotifications = this.notificationsSubject.value;
    this.notificationsSubject.next([...currentNotifications, notification]);

    if (notification.duration && notification.duration > 0) {
      setTimeout(() => {
        this.remove(notification.id);
      }, notification.duration);
    }
  }

  success(title: string, message: string, duration?: number): void {
    this.show(NotificationType.SUCCESS, title, message, duration);
  }

  error(title: string, message: string, duration?: number): void {
    this.show(NotificationType.ERROR, title, message, duration || NOTIFICATION_DEFAULTS.ERROR_DURATION);
  }

  warning(title: string, message: string, duration?: number): void {
    this.show(NotificationType.WARNING, title, message, duration);
  }

  info(title: string, message: string, duration?: number): void {
    this.show(NotificationType.INFO, title, message, duration);
  }

  remove(id: string): void {
    const currentNotifications = this.notificationsSubject.value;
    this.notificationsSubject.next(currentNotifications.filter(n => n.id !== id));
  }

  clear(): void {
    this.notificationsSubject.next([]);
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

