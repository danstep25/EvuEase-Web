import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Notification } from '../../services/notification.service';
import { NotificationType, NOTIFICATION_ICONS, NOTIFICATION_STYLES } from '../../constants/notification.constant';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification.component.html',
  styleUrl: './notification.component.scss'
})
export class NotificationComponent implements OnInit, OnDestroy {
  private readonly notificationService = inject(NotificationService);
  private readonly destroy$ = new Subject<void>();

  notifications: Notification[] = [];

  ngOnInit(): void {
    this.notificationService.notifications$
      .pipe(takeUntil(this.destroy$))
      .subscribe(notifications => {
        this.notifications = notifications;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  remove(id: string): void {
    this.notificationService.remove(id);
  }

  getIcon(type: Notification['type']): string {
    return NOTIFICATION_ICONS[type as NotificationType] || '';
  }

  getTypeClass(type: Notification['type']): string {
    const config = NOTIFICATION_STYLES[type as NotificationType];
    if (!config) {
      return 'bg-gray-50 border-gray-200 text-gray-800';
    }
    return `${config.bgClass} ${config.borderClass} ${config.textClass}`;
  }

  getIconColorClass(type: Notification['type']): string {
    const config = NOTIFICATION_STYLES[type as NotificationType];
    return config?.iconColorClass || 'text-gray-400';
  }
}
