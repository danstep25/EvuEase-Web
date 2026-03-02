import { Component, OnInit, OnDestroy, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SyTerm, CreateSyTermRequest, UpdateSyTermRequest } from '../../../core/models/sy-term.model';
import { PaginatedResponse } from '../../../core/models/api-response.model';
import { DateUtil } from '../../../shared/utils/date.util';
import { BadgeUtil } from '../../../shared/utils/badge.util';
import { BasePaginationHandler } from '../../../shared/handlers/base-pagination.handler';
import { NotificationService } from '../../../shared/services/notification.service';
import { ConfirmationModalComponent, ConfirmationModalConfig } from '../../../shared/components/confirmation-modal/confirmation-modal.component';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { SchoolYearTermFormComponent } from './school-year-term-form/school-year-term-form.component';
import { SchoolYearTermService } from './school-year-term.service';
import { SORT_DEFAULTS } from '../../../shared/constants/sort.constant';

@Component({
  selector: 'app-school-year-term',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SchoolYearTermFormComponent, ConfirmationModalComponent],
  templateUrl: './school-year-term.component.html',
  styleUrl: './school-year-term.component.scss'
})
export class SchoolYearTermComponent extends BasePaginationHandler implements OnInit, OnDestroy {
  private readonly syTermService = inject(SchoolYearTermService);
  private readonly fb = inject(FormBuilder);
  private readonly notificationService = inject(NotificationService);
  private readonly destroy$ = new Subject<void>();

  pageTitle = 'School Year & Term';
  pageSubtitle = 'Manage school year progression and semester schedules';

  @ViewChild(SchoolYearTermFormComponent) syTermFormComponent!: SchoolYearTermFormComponent;

  searchForm!: FormGroup;
  syTerms: SyTerm[] = [];
  isLoading = false;
  searchTerm = '';
  showSyTermForm = false;
  selectedSyTerm: SyTerm | null = null;
  showDeleteConfirmation = false;
  syTermToDelete: SyTerm | null = null;
  deleteConfirmationConfig: ConfirmationModalConfig = {
    title: 'Delete School Year',
    message: 'Are you sure you want to delete this school year entry?\nThis action cannot be undone.',
    confirmText: 'Confirm',
    cancelText: 'Cancel'
  };

  ngOnInit(): void {
    this.searchForm = this.fb.group({
      search: ['']
    });

    this.searchForm.get('search')?.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      this.searchTerm = searchTerm || '';
      this.resetToFirstPage();
      this.loadSyTerms();
    });

    this.loadSyTerms();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadSyTerms(): void {
    this.isLoading = true;
    const params = {
      PageIndex: this.currentPage,
      PageSize: this.pageSize,
      SortDirection: SORT_DEFAULTS.DIRECTION,
      SortKey: '',
      searchTerm: this.searchTerm || ''
    };

    this.syTermService.getSyTerms(params).subscribe({
      next: (response: PaginatedResponse<SyTerm>) => {
        if (response.success && response.data) {
          this.syTerms = response.data;
          if (response.pagination) {
            this.updatePagination(
              response.pagination.total,
              response.pagination.totalPages,
              response.pagination.page
            );
          }
        } else {
          this.syTerms = [];
          this.resetPagination();
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading school year terms:', error);
        this.isLoading = false;
        this.syTerms = [];
        this.resetPagination();
        this.notificationService.error('Loading Failed', error.userMessage || error.message || 'Failed to load school year terms.');
      }
    });
  }

  getStatusText(syTerm: SyTerm): string {
    return syTerm.syStatus === 'Active' ? 'Active' : 'Inactive';
  }

  getStatusBadgeClass = BadgeUtil.getStatusBadgeClass;

  formatEnrollmentPeriod(syTerm: SyTerm): string {
    return `${DateUtil.formatDate(syTerm.syEnrollmentStart)} to ${DateUtil.formatDate(syTerm.syEnrollmentEnd)}`;
  }

  onAddSyTerm(): void {
    this.selectedSyTerm = null;
    this.showSyTermForm = true;
  }

  onEditSyTerm(syTerm: SyTerm): void {
    this.selectedSyTerm = syTerm;
    this.showSyTermForm = true;
  }

  onDeleteSyTerm(syTerm: SyTerm): void {
    this.syTermToDelete = syTerm;
    this.deleteConfirmationConfig = {
      title: 'Delete School Year',
      message: 'Are you sure you want to delete this school year entry?\nThis action cannot be undone.',
      confirmText: 'Confirm',
      cancelText: 'Cancel'
    };
    this.showDeleteConfirmation = true;
  }

  onConfirmDelete(): void {
    if (!this.syTermToDelete) {
      return;
    }

    const syTerm = this.syTermToDelete;
    this.syTermService.deleteSyTerm(syTerm.syId.toString()).subscribe({
      next: () => {
        this.notificationService.success(
          'School Year Term Deleted',
          `School Year Term "${syTerm.syCode}" has been successfully deleted.`
        );
        this.showDeleteConfirmation = false;
        this.syTermToDelete = null;
        this.loadSyTerms();
      },
      error: (error) => {
        console.error('Error deleting school year term:', error);
        this.notificationService.error('Delete Failed', error.userMessage || error.message || 'Failed to delete school year term. Please try again.');
        this.showDeleteConfirmation = false;
        this.syTermToDelete = null;
      }
    });
  }

  onCancelDelete(): void {
    this.showDeleteConfirmation = false;
    this.syTermToDelete = null;
  }

  onCloseSyTermForm(): void {
    this.showSyTermForm = false;
    this.selectedSyTerm = null;
  }

  onSaveSyTerm(syTermData: CreateSyTermRequest | UpdateSyTermRequest): void {
    if (this.syTermFormComponent) {
      this.syTermFormComponent.setSubmitting(true);
    }

    if (this.selectedSyTerm) {
      const updateData: UpdateSyTermRequest = {
        ...syTermData as UpdateSyTermRequest,
        syId: this.selectedSyTerm.syId
      };
      this.syTermService.updateSyTerm(this.selectedSyTerm.syId.toString(), updateData).subscribe({
        next: () => {
          if (this.syTermFormComponent) {
            this.syTermFormComponent.setSubmitting(false);
          }
          this.notificationService.success(
            'School Year Term Updated',
            `School Year Term "${syTermData.syCode}" has been successfully updated.`
          );
          this.onCloseSyTermForm();
          this.loadSyTerms();
        },
        error: (error) => {
          if (this.syTermFormComponent) {
            this.syTermFormComponent.setSubmitting(false);
            const errorMsg = error.userMessage || error.message || 'Failed to update school year term. Please try again.';
            this.syTermFormComponent.setError(errorMsg);
            this.notificationService.error('Update Failed', errorMsg);
          }
          console.error('Error updating school year term:', error);
        }
      });
    } else {
      this.syTermService.createSyTerm(syTermData as CreateSyTermRequest).subscribe({
        next: () => {
          if (this.syTermFormComponent) {
            this.syTermFormComponent.setSubmitting(false);
          }
          this.notificationService.success(
            'School Year Term Created',
            `School Year Term "${syTermData.syCode}" has been successfully created.`
          );
          this.onCloseSyTermForm();
          this.loadSyTerms();
        },
        error: (error) => {
          if (this.syTermFormComponent) {
            this.syTermFormComponent.setSubmitting(false);
            const errorMsg = error.userMessage || error.message || 'Failed to create school year term. Please try again.';
            this.syTermFormComponent.setError(errorMsg);
            this.notificationService.error('Create Failed', errorMsg);
          }
          console.error('Error creating school year term:', error);
        }
      });
    }
  }

  formatDate = DateUtil.formatDate;

  protected loadData(): void {
    this.loadSyTerms();
  }
}

