import { Component, OnInit, OnDestroy, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { OtherSchoolFee, CreateOtherSchoolFeeRequest, UpdateOtherSchoolFeeRequest } from '../../../../../core/models/other-school-fee.model';
import { PaginatedResponse } from '../../../../../core/models/api-response.model';
import { OtherSchoolFeesService } from './other-school-fees.service';
import { NotificationService } from '../../../../../shared/services/notification.service';
import { BasePaginationHandler } from '../../../../../shared/handlers/base-pagination.handler';
import { SORT_DEFAULTS } from '../../../../../shared/constants/sort.constant';
import { OtherSchoolFeeFormComponent } from './other-school-fee-form/other-school-fee-form.component';
import { ConfirmationModalComponent, ConfirmationModalConfig } from '../../../../../shared/components/confirmation-modal/confirmation-modal.component';

@Component({
  selector: 'app-other-school-fees',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, OtherSchoolFeeFormComponent, ConfirmationModalComponent],
  templateUrl: './other-school-fees.component.html',
  styleUrl: './other-school-fees.component.scss'
})
export class OtherSchoolFeesComponent extends BasePaginationHandler implements OnInit, OnDestroy {
  private readonly otherSchoolFeesService = inject(OtherSchoolFeesService);
  private readonly fb = inject(FormBuilder);
  private readonly notificationService = inject(NotificationService);
  private readonly destroy$ = new Subject<void>();

  @ViewChild(OtherSchoolFeeFormComponent) otherSchoolFeeFormComponent!: OtherSchoolFeeFormComponent;

  searchForm!: FormGroup;
  otherSchoolFees: OtherSchoolFee[] = [];
  isLoading = false;
  searchTerm = '';
  showOtherSchoolFeeForm = false;
  selectedOtherSchoolFee: OtherSchoolFee | null = null;
  showDeleteConfirmation = false;
  otherSchoolFeeToDelete: OtherSchoolFee | null = null;
  deleteConfirmationConfig: ConfirmationModalConfig = {
    title: 'Delete School Fee',
    message: 'Are you sure you want to delete this school fee?\nThis action cannot be undone.',
    confirmText: 'Confirm',
    cancelText: 'Cancel'
  };

  ngOnInit(): void {
    this.searchForm = this.fb.group({
      search: ['']
    });

    this.searchForm
      .get('search')
      ?.valueChanges.pipe(debounceTime(500), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(searchTerm => {
        this.searchTerm = searchTerm || '';
        this.resetToFirstPage();
        this.loadOtherSchoolFees();
      });

    this.loadOtherSchoolFees();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadOtherSchoolFees(): void {
    this.isLoading = true;
    const params = {
      PageIndex: this.currentPage,
      PageSize: this.pageSize,
      SortDirection: SORT_DEFAULTS.DIRECTION,
      SortKey: '',
      searchTerm: this.searchTerm || ''
    };

    this.otherSchoolFeesService.getOtherSchoolFees(params).subscribe({
      next: (response: PaginatedResponse<OtherSchoolFee>) => {
        if (response.success && response.data) {
          this.otherSchoolFees = response.data;
          if (response.pagination) {
            this.updatePagination(response.pagination.total, response.pagination.totalPages, response.pagination.page);
          }
        } else {
          this.otherSchoolFees = [];
          this.resetPagination();
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        this.isLoading = false;
        this.otherSchoolFees = [];
        this.resetPagination();
        this.notificationService.error(
          'Loading Failed',
          error.userMessage || error.message || 'Failed to load other school fees.'
        );
      }
    });
  }

  onAddOtherSchoolFee(): void {
    this.selectedOtherSchoolFee = null;
    this.showOtherSchoolFeeForm = true;
  }

  onEditOtherSchoolFee(otherSchoolFee: OtherSchoolFee): void {
    this.selectedOtherSchoolFee = otherSchoolFee;
    this.showOtherSchoolFeeForm = true;
  }

  onDeleteOtherSchoolFee(otherSchoolFee: OtherSchoolFee): void {
    this.otherSchoolFeeToDelete = otherSchoolFee;
    this.deleteConfirmationConfig = {
      title: 'Delete School Fee',
      message: `Are you sure you want to delete the school fee "${otherSchoolFee.schoolFee}"?\nThis action cannot be undone.`,
      confirmText: 'Confirm',
      cancelText: 'Cancel'
    };
    this.showDeleteConfirmation = true;
  }

  onCloseOtherSchoolFeeForm(): void {
    this.showOtherSchoolFeeForm = false;
    this.selectedOtherSchoolFee = null;
  }

  onSaveOtherSchoolFee(otherSchoolFeeData: CreateOtherSchoolFeeRequest | UpdateOtherSchoolFeeRequest): void {
    if (this.otherSchoolFeeFormComponent) {
      this.otherSchoolFeeFormComponent.setSubmitting(true);
    }

    if (this.selectedOtherSchoolFee) {
      const updateData: UpdateOtherSchoolFeeRequest = {
        ...(otherSchoolFeeData as UpdateOtherSchoolFeeRequest),
        id: this.selectedOtherSchoolFee.id
      };
      this.otherSchoolFeesService.updateOtherSchoolFee(this.selectedOtherSchoolFee.id, updateData).subscribe({
        next: () => {
          if (this.otherSchoolFeeFormComponent) {
            this.otherSchoolFeeFormComponent.setSubmitting(false);
          }
          this.notificationService.success(
            'School Fee Updated',
            `School fee "${otherSchoolFeeData.schoolFee}" has been successfully updated.`
          );
          this.onCloseOtherSchoolFeeForm();
          this.loadOtherSchoolFees();
        },
        error: (error: any) => {
          if (this.otherSchoolFeeFormComponent) {
            this.otherSchoolFeeFormComponent.setSubmitting(false);
            const errorMsg =
              error.userMessage || error.message || 'Failed to update school fee. Please try again.';
            this.otherSchoolFeeFormComponent.setError(errorMsg);
            this.notificationService.error('Update Failed', errorMsg);
          }
        }
      });
    } else {
      this.otherSchoolFeesService
        .createOtherSchoolFee(otherSchoolFeeData as CreateOtherSchoolFeeRequest)
        .subscribe({
          next: () => {
            if (this.otherSchoolFeeFormComponent) {
              this.otherSchoolFeeFormComponent.setSubmitting(false);
            }
            this.notificationService.success(
              'School Fee Created',
              `School fee "${otherSchoolFeeData.schoolFee}" has been successfully created.`
            );
            this.onCloseOtherSchoolFeeForm();
            this.loadOtherSchoolFees();
          },
          error: (error: any) => {
            if (this.otherSchoolFeeFormComponent) {
              this.otherSchoolFeeFormComponent.setSubmitting(false);
              const errorMsg =
                error.userMessage || error.message || 'Failed to create school fee. Please try again.';
              this.otherSchoolFeeFormComponent.setError(errorMsg);
              this.notificationService.error('Create Failed', errorMsg);
            }
          }
        });
    }
  }

  onConfirmDelete(): void {
    if (this.otherSchoolFeeToDelete) {
      const otherSchoolFee = this.otherSchoolFeeToDelete;
      this.otherSchoolFeesService.deleteOtherSchoolFee(otherSchoolFee.id).subscribe({
        next: () => {
          this.notificationService.success(
            'School Fee Deleted',
            `School fee "${otherSchoolFee.schoolFee}" has been successfully deleted.`
          );
          this.showDeleteConfirmation = false;
          this.otherSchoolFeeToDelete = null;
          this.loadOtherSchoolFees();
        },
        error: (error: any) => {
          this.notificationService.error(
            'Delete Failed',
            error.userMessage || error.message || 'Failed to delete school fee. Please try again.'
          );
          this.showDeleteConfirmation = false;
          this.otherSchoolFeeToDelete = null;
        }
      });
    }
  }

  onCancelDelete(): void {
    this.showDeleteConfirmation = false;
    this.otherSchoolFeeToDelete = null;
  }

  formatCurrency(amount: number): string {
    return `₱${amount.toFixed(2)}`;
  }

  protected loadData(): void {
    this.loadOtherSchoolFees();
  }
}



