import { Component, OnInit, OnDestroy, ViewChild, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { TuitionFee, CreateTuitionFeeRequest, UpdateTuitionFeeRequest } from '../../../../../core/models/tuition-fee.model';
import { PaginatedResponse } from '../../../../../core/models/api-response.model';
import { TuitionFeesService } from './tuition-fees.service';
import { NotificationService } from '../../../../../shared/services/notification.service';
import { BasePaginationHandler } from '../../../../../shared/handlers/base-pagination.handler';
import { SORT_DEFAULTS } from '../../../../../shared/constants/sort.constant';
import { TuitionFeeFormComponent } from './tuition-fee-form/tuition-fee-form.component';
import { ConfirmationModalComponent, ConfirmationModalConfig } from '../../../../../shared/components/confirmation-modal/confirmation-modal.component';

@Component({
  selector: 'app-tuition-fees',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TuitionFeeFormComponent, ConfirmationModalComponent],
  templateUrl: './tuition-fees.component.html',
  styleUrl: './tuition-fees.component.scss'
})
export class TuitionFeesComponent extends BasePaginationHandler implements OnInit, OnDestroy {
  
  @Input() readOnly = false;

  private readonly tuitionFeesService = inject(TuitionFeesService);
  private readonly fb = inject(FormBuilder);
  private readonly notificationService = inject(NotificationService);
  private readonly destroy$ = new Subject<void>();

  @ViewChild(TuitionFeeFormComponent) tuitionFeeFormComponent!: TuitionFeeFormComponent;

  searchForm!: FormGroup;
  tuitionFees: TuitionFee[] = [];
  isLoading = false;
  searchTerm = '';
  showTuitionFeeForm = false;
  selectedTuitionFee: TuitionFee | null = null;
  showDeleteConfirmation = false;
  tuitionFeeToDelete: TuitionFee | null = null;
  deleteConfirmationConfig: ConfirmationModalConfig = {
    title: 'Delete Tuition Fee',
    message: 'Are you sure you want to delete this tuition fee?\nThis action cannot be undone.',
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
      this.loadTuitionFees();
    });

    this.loadTuitionFees();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadTuitionFees(): void {
    this.isLoading = true;
    const params = {
      PageIndex: this.currentPage,
      PageSize: this.pageSize,
      SortDirection: SORT_DEFAULTS.DIRECTION,
      SortKey: '',
      searchTerm: this.searchTerm || ''
    };

    this.tuitionFeesService.getTuitionFees(params).subscribe({
      next: (response: PaginatedResponse<TuitionFee>) => {
        if (response.success && response.data) {
          this.tuitionFees = response.data;
          if (response.pagination) {
            this.updatePagination(
              response.pagination.total,
              response.pagination.totalPages,
              response.pagination.page
            );
          }
        } else {
          this.tuitionFees = [];
          this.resetPagination();
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading tuition fees:', error);
        this.isLoading = false;
        this.tuitionFees = [];
        this.resetPagination();
        this.notificationService.error('Loading Failed', error.userMessage || error.message || 'Failed to load tuition fees.');
      }
    });
  }

  onAddTuitionFee(): void {
    this.selectedTuitionFee = null;
    this.showTuitionFeeForm = true;
  }

  onEditTuitionFee(tuitionFee: TuitionFee): void {
    this.selectedTuitionFee = tuitionFee;
    this.showTuitionFeeForm = true;
  }

  onDeleteTuitionFee(tuitionFee: TuitionFee): void {
    this.tuitionFeeToDelete = tuitionFee;
    this.deleteConfirmationConfig = {
      title: 'Delete Tuition Fee',
      message: `Are you sure you want to delete the tuition fee for "${tuitionFee.courseCode}"?\nThis action cannot be undone.`,
      confirmText: 'Confirm',
      cancelText: 'Cancel'
    };
    this.showDeleteConfirmation = true;
  }

  onCloseTuitionFeeForm(): void {
    this.showTuitionFeeForm = false;
    this.selectedTuitionFee = null;
  }

  onSaveTuitionFee(tuitionFeeData: CreateTuitionFeeRequest | UpdateTuitionFeeRequest): void {
    if (this.tuitionFeeFormComponent) {
      this.tuitionFeeFormComponent.setSubmitting(true);
    }

    if (this.selectedTuitionFee) {
      const updateData: UpdateTuitionFeeRequest = {
        ...tuitionFeeData as UpdateTuitionFeeRequest,
        id: this.selectedTuitionFee.id
      };
      this.tuitionFeesService.updateTuitionFee(this.selectedTuitionFee.id, updateData).subscribe({
        next: () => {
          if (this.tuitionFeeFormComponent) {
            this.tuitionFeeFormComponent.setSubmitting(false);
          }
          this.notificationService.success(
            'Tuition Fee Updated',
            `Tuition fee for "${tuitionFeeData.courseCode}" has been successfully updated.`
          );
          this.onCloseTuitionFeeForm();
          this.loadTuitionFees();
        },
        error: (error: any) => {
          if (this.tuitionFeeFormComponent) {
            this.tuitionFeeFormComponent.setSubmitting(false);
            const errorMsg = error.userMessage || error.message || 'Failed to update tuition fee. Please try again.';
            this.tuitionFeeFormComponent.setError(errorMsg);
            this.notificationService.error('Update Failed', errorMsg);
          }
          console.error('Error updating tuition fee:', error);
        }
      });
    } else {
      this.tuitionFeesService.createTuitionFee(tuitionFeeData as CreateTuitionFeeRequest).subscribe({
        next: () => {
          if (this.tuitionFeeFormComponent) {
            this.tuitionFeeFormComponent.setSubmitting(false);
          }
          this.notificationService.success(
            'Tuition Fee Created',
            `Tuition fee for "${tuitionFeeData.courseCode}" has been successfully created.`
          );
          this.onCloseTuitionFeeForm();
          this.loadTuitionFees();
        },
        error: (error: any) => {
          if (this.tuitionFeeFormComponent) {
            this.tuitionFeeFormComponent.setSubmitting(false);
            const errorMsg = error.userMessage || error.message || 'Failed to create tuition fee. Please try again.';
            this.tuitionFeeFormComponent.setError(errorMsg);
            this.notificationService.error('Create Failed', errorMsg);
          }
          console.error('Error creating tuition fee:', error);
        }
      });
    }
  }

  onConfirmDelete(): void {
    if (this.tuitionFeeToDelete) {
      const tuitionFee = this.tuitionFeeToDelete;
      this.tuitionFeesService.deleteTuitionFee(tuitionFee.id).subscribe({
        next: () => {
          this.notificationService.success(
            'Tuition Fee Deleted',
            `Tuition fee for "${tuitionFee.courseCode}" has been successfully deleted.`
          );
          this.showDeleteConfirmation = false;
          this.tuitionFeeToDelete = null;
          this.loadTuitionFees();
        },
        error: (error: any) => {
          console.error('Error deleting tuition fee:', error);
          this.notificationService.error('Delete Failed', error.userMessage || error.message || 'Failed to delete tuition fee. Please try again.');
          this.showDeleteConfirmation = false;
          this.tuitionFeeToDelete = null;
        }
      });
    }
  }

  onCancelDelete(): void {
    this.showDeleteConfirmation = false;
    this.tuitionFeeToDelete = null;
  }

  formatCurrency(amount: number): string {
    return `₱${amount.toFixed(2)}`;
  }

  protected loadData(): void {
    this.loadTuitionFees();
  }
}

