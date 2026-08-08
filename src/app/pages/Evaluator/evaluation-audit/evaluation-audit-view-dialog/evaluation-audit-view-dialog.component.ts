import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EvaluationAuditService } from '../evaluation-audit.service';
import { SubjectEvaluationChargeSlipPreviewComponent } from '../../subject-evaluation-charge-slip-preview/subject-evaluation-charge-slip-preview.component';
import type { EvaluationAuditDetail } from '../evaluation-audit.models';
import { DateUtil } from '../../../../shared/utils/date.util';

@Component({
  selector: 'app-evaluation-audit-view-dialog',
  standalone: true,
  imports: [CommonModule, SubjectEvaluationChargeSlipPreviewComponent],
  templateUrl: './evaluation-audit-view-dialog.component.html',
  styleUrl: './evaluation-audit-view-dialog.component.scss'
})
export class EvaluationAuditViewDialogComponent implements OnChanges {
  private readonly auditService = inject(EvaluationAuditService);

  @Input() isOpen = false;
  @Input() auditId: number | null = null;
  @Output() readonly closed = new EventEmitter<void>();

  detail: EvaluationAuditDetail | null = null;
  isLoading = false;
  activeTab: 'subjects' | 'charge-slip' = 'subjects';

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['isOpen']?.currentValue === true || changes['auditId']) && this.isOpen && this.auditId != null) {
      this.activeTab = 'subjects';
      this.loadDetail();
    }
    if (changes['isOpen'] && !this.isOpen) {
      this.detail = null;
      this.activeTab = 'subjects';
    }
  }

  setActiveTab(tab: 'subjects' | 'charge-slip'): void {
    this.activeTab = tab;
  }

  onBackdropClick(): void {
    this.onClose();
  }

  onClose(): void {
    this.closed.emit();
  }

  formatDate(value: string): string {
    return DateUtil.formatTimestamp(value);
  }

  private loadDetail(): void {
    if (this.auditId == null) {
      return;
    }

    this.isLoading = true;
    this.auditService.getAuditRecordById(this.auditId).subscribe({
      next: (detail) => {
        this.detail = detail;
        this.isLoading = false;
      },
      error: () => {
        this.detail = null;
        this.isLoading = false;
      }
    });
  }
}
