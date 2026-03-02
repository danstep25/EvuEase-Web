import { Component, OnInit, OnDestroy, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { MiscellaneousFee, CreateMiscellaneousFeeRequest, UpdateMiscellaneousFeeRequest } from '../../../../../core/models/miscellaneous-fee.model';
import { PaginatedResponse } from '../../../../../core/models/api-response.model';
import { MiscellaneousFeesService } from './miscellaneous-fees.service';
import { NotificationService } from '../../../../../shared/services/notification.service';
import { BasePaginationHandler } from '../../../../../shared/handlers/base-pagination.handler';
import { SORT_DEFAULTS } from '../../../../../shared/constants/sort.constant';
import { MiscellaneousFeeFormComponent } from './miscellaneous-fee-form/miscellaneous-fee-form.component';
import { ConfirmationModalComponent, ConfirmationModalConfig } from '../../../../../shared/components/confirmation-modal/confirmation-modal.component';

@Component({
  selector: 'app-miscellaneous-fees',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MiscellaneousFeeFormComponent, ConfirmationModalComponent],
  templateUrl: './miscellaneous-fees.component.html',
  styleUrl: './miscellaneous-fees.component.scss'
})
export class MiscellaneousFeesComponent extends BasePaginationHandler implements OnInit, OnDestroy {
  private readonly miscellaneousFeesService = inject(MiscellaneousFeesService);
  private readonly fb = inject(FormBuilder);
  private readonly notificationService = inject(NotificationService);
  private readonly destroy$ = new Subject<void>();

  @ViewChild(MiscellaneousFeeFormComponent) miscellaneousFeeFormComponent!: MiscellaneousFeeFormComponent;

  searchForm!: FormGroup;
  miscellaneousFees: MiscellaneousFee[] = [];
  isLoading = false;
  searchTerm = '';
  showMiscellaneousFeeForm = false;
  selectedMiscellaneousFee: MiscellaneousFee | null = null;
  showDeleteConfirmation = false;
  miscellaneousFeeToDelete: MiscellaneousFee | null = null;
  deleteConfirmationConfig: ConfirmationModalConfig = {
    title: 'Delete Miscellaneous Fee',
    message: 'Are you sure you want to delete this miscellaneous fee?\nThis action cannot be undone.',
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
        this.loadMiscellaneousFees();
      });

    this.loadMiscellaneousFees();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadMiscellaneousFees(): void {
    this.isLoading = true;
    const params = {
      PageIndex: this.currentPage,
      PageSize: this.pageSize,
      SortDirection: SORT_DEFAULTS.DIRECTION,
      SortKey: '',
      searchTerm: this.searchTerm || ''
    };

    this.miscellaneousFeesService.getMiscellaneousFees(params).subscribe({
      next: (response: PaginatedResponse<MiscellaneousFee>) => {
        if (response.success && response.data) {
          this.miscellaneousFees = response.data;
          if (response.pagination) {
            this.updatePagination(response.pagination.total, response.pagination.totalPages, response.pagination.page);
          }
        } else {
          this.miscellaneousFees = [];
          this.resetPagination();
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        this.isLoading = false;
        this.miscellaneousFees = [];
        this.resetPagination();
        this.notificationService.error(
          'Loading Failed',
          error.userMessage || error.message || 'Failed to load miscellaneous fees.'
        );
      }
    });
  }

  onAddMiscellaneousFee(): void {
    this.selectedMiscellaneousFee = null;
    this.showMiscellaneousFeeForm = true;
  }

  onEditMiscellaneousFee(miscellaneousFee: MiscellaneousFee): void {
    this.selectedMiscellaneousFee = miscellaneousFee;
    this.showMiscellaneousFeeForm = true;
  }

  onDeleteMiscellaneousFee(miscellaneousFee: MiscellaneousFee): void {
    this.miscellaneousFeeToDelete = miscellaneousFee;
    this.deleteConfirmationConfig = {
      title: 'Delete Miscellaneous Fee',
      message: `Are you sure you want to delete the miscellaneous fee "${miscellaneousFee.miscellaneousFee}"?\nThis action cannot be undone.`,
      confirmText: 'Confirm',
      cancelText: 'Cancel'
    };
    this.showDeleteConfirmation = true;
  }

  onCloseMiscellaneousFeeForm(): void {
    this.showMiscellaneousFeeForm = false;
    this.selectedMiscellaneousFee = null;
  }

  onSaveMiscellaneousFee(miscellaneousFeeData: CreateMiscellaneousFeeRequest | UpdateMiscellaneousFeeRequest): void {
    if (this.miscellaneousFeeFormComponent) {
      this.miscellaneousFeeFormComponent.setSubmitting(true);
    }

    if (this.selectedMiscellaneousFee) {
      const updateData: UpdateMiscellaneousFeeRequest = {
        ...(miscellaneousFeeData as UpdateMiscellaneousFeeRequest),
        id: this.selectedMiscellaneousFee.id
      };
      this.miscellaneousFeesService.updateMiscellaneousFee(this.selectedMiscellaneousFee.id, updateData).subscribe({
        next: () => {
          if (this.miscellaneousFeeFormComponent) {
            this.miscellaneousFeeFormComponent.setSubmitting(false);
          }
          this.notificationService.success(
            'Miscellaneous Fee Updated',
            `Miscellaneous fee "${miscellaneousFeeData.miscellaneousFee}" has been successfully updated.`
          );
          this.onCloseMiscellaneousFeeForm();
          this.loadMiscellaneousFees();
        },
        error: (error: any) => {
          if (this.miscellaneousFeeFormComponent) {
            this.miscellaneousFeeFormComponent.setSubmitting(false);
            const errorMsg =
              error.userMessage || error.message || 'Failed to update miscellaneous fee. Please try again.';
            this.miscellaneousFeeFormComponent.setError(errorMsg);
            this.notificationService.error('Update Failed', errorMsg);
          }
        }
      });
    } else {
      this.miscellaneousFeesService
        .createMiscellaneousFee(miscellaneousFeeData as CreateMiscellaneousFeeRequest)
        .subscribe({
          next: () => {
            if (this.miscellaneousFeeFormComponent) {
              this.miscellaneousFeeFormComponent.setSubmitting(false);
            }
            this.notificationService.success(
              'Miscellaneous Fee Created',
              `Miscellaneous fee "${miscellaneousFeeData.miscellaneousFee}" has been successfully created.`
            );
            this.onCloseMiscellaneousFeeForm();
            this.loadMiscellaneousFees();
          },
          error: (error: any) => {
            if (this.miscellaneousFeeFormComponent) {
              this.miscellaneousFeeFormComponent.setSubmitting(false);
              const errorMsg =
                error.userMessage || error.message || 'Failed to create miscellaneous fee. Please try again.';
              this.miscellaneousFeeFormComponent.setError(errorMsg);
              this.notificationService.error('Create Failed', errorMsg);
            }
          }
        });
    }
  }

  onConfirmDelete(): void {
    if (this.miscellaneousFeeToDelete) {
      const miscellaneousFee = this.miscellaneousFeeToDelete;
      this.miscellaneousFeesService.deleteMiscellaneousFee(miscellaneousFee.id).subscribe({
        next: () => {
          this.notificationService.success(
            'Miscellaneous Fee Deleted',
            `Miscellaneous fee "${miscellaneousFee.miscellaneousFee}" has been successfully deleted.`
          );
          this.showDeleteConfirmation = false;
          this.miscellaneousFeeToDelete = null;
          this.loadMiscellaneousFees();
        },
        error: (error: any) => {
          this.notificationService.error(
            'Delete Failed',
            error.userMessage || error.message || 'Failed to delete miscellaneous fee. Please try again.'
          );
          this.showDeleteConfirmation = false;
          this.miscellaneousFeeToDelete = null;
        }
      });
    }
  }

  onCancelDelete(): void {
    this.showDeleteConfirmation = false;
    this.miscellaneousFeeToDelete = null;
  }

  formatCurrency(amount: number): string {
    return `₱${amount.toFixed(2)}`;
  }

  protected loadData(): void {
    this.loadMiscellaneousFees();
  }
}



