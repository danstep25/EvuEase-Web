import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-system-logs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './system-logs.component.html',
  styleUrl: './system-logs.component.scss'
})
export class SystemLogsComponent {
  pageTitle = 'System Logs';
  pageSubtitle = 'View and monitor system activity logs';
}

