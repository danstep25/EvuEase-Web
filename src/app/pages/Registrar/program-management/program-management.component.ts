import { Component, OnInit, OnDestroy, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Program, CreateProgramRequest, UpdateProgramRequest } from '../../../core/models/program.model';
import { PaginatedResponse } from '../../../core/models/api-response.model';
import { DateUtil } from '../../../shared/utils/date.util';
import { BadgeUtil } from '../../../shared/utils/badge.util';
import { BasePaginationHandler } from '../../../shared/handlers/base-pagination.handler';
import { NotificationService } from '../../../shared/services/notification.service';
import { ConfirmationModalComponent, ConfirmationModalConfig } from '../../../shared/components/confirmation-modal/confirmation-modal.component';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { ProgramFormComponent } from './program-form/program-form.component';
import { ProgramService } from '../../../pages/Admin/program-management/program.service';
import { LookupService } from '../../../shared/services/lookup.service';

@Component({
  selector: 'app-registrar-program-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ProgramFormComponent, ConfirmationModalComponent],
  templateUrl: './program-management.component.html',
  styleUrl: './program-management.component.scss'
})
export class RegistrarProgramManagementComponent extends BasePaginationHandler implements OnInit, OnDestroy {
  private readonly programService = inject(ProgramService);
  private readonly lookupService = inject(LookupService);
  private readonly fb = inject(FormBuilder);
  private readonly notificationService = inject(NotificationService);
  private readonly destroy$ = new Subject<void>();

  pageTitle = 'Programs Management';
  pageSubtitle = 'Manage offered academic programs';

  @ViewChild(ProgramFormComponent) programFormComponent!: ProgramFormComponent;

  searchForm!: FormGroup;
  programs: Program[] = [];
  isLoading = false;
  searchTerm = '';
  showProgramForm = false;
  selectedProgram: Program | null = null;
  showDeleteConfirmation = false;
  programToDelete: Program | null = null;
  deleteConfirmationConfig: ConfirmationModalConfig = {
    title: 'Delete Program',
    message: 'Are you sure you want to delete this program?\nThis action cannot be undone.',
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
      this.loadPrograms();
    });

    this.loadPrograms();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadPrograms(): void {
    this.isLoading = true;
    const params = {
      PageIndex: this.currentPage,
      PageSize: this.pageSize,
      SortDirection: 'desc',
      SortKey: '',
      searchTerm: this.searchTerm || ''
    };

    this.programService.getPrograms(params).subscribe({
      next: (response: PaginatedResponse<Program>) => {
        if (response.success && response.data) {
          this.programs = response.data;
          if (response.pagination) {
            this.updatePagination(
              response.pagination.total,
              response.pagination.totalPages,
              response.pagination.page
            );
          }
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading programs:', error);
        this.isLoading = false;
        this.programs = [];
        this.resetPagination();
      }
    });
  }

  getStatusText(program: Program): string {
    const status = program.programStatus?.toLowerCase() || 'active';
    return status === 'active' ? 'Active' : 'Inactive';
  }

  getStatusBadgeClass = BadgeUtil.getStatusBadgeClass;

  onAddProgram(): void {
    this.selectedProgram = null;
    this.showProgramForm = true;
  }

  onEditProgram(program: Program): void {
    this.selectedProgram = program;
    this.showProgramForm = true;
  }

  onDeleteProgram(program: Program): void {
    this.programToDelete = program;
    this.deleteConfirmationConfig = {
      title: 'Delete Program',
      message: `Are you sure you want to delete the program "${program.programTitle}"?\nThis action cannot be undone.`,
      confirmText: 'Confirm',
      cancelText: 'Cancel'
    };
    this.showDeleteConfirmation = true;
  }

  onConfirmDelete(): void {
    if (!this.programToDelete) {
      return;
    }

    const program = this.programToDelete;
    this.programService.deleteProgram(program.programId.toString()).subscribe({
      next: () => {
        this.lookupService.clearCache();
        this.notificationService.success(
          'Program Deleted',
          `Program "${program.programTitle}" has been successfully deleted.`
        );
        this.showDeleteConfirmation = false;
        this.programToDelete = null;
        this.loadPrograms();
      },
      error: (error) => {
        console.error('Error deleting program:', error);
        const errorMsg =
          error.error?.error?.message ||
          error.error?.message ||
          error.message ||
          'Failed to delete program. Please try again.';
        this.notificationService.error('Delete Failed', errorMsg);
        this.showDeleteConfirmation = false;
        this.programToDelete = null;
      }
    });
  }

  onCancelDelete(): void {
    this.showDeleteConfirmation = false;
    this.programToDelete = null;
  }

  onCloseProgramForm(): void {
    this.showProgramForm = false;
    this.selectedProgram = null;
  }

  onSaveProgram(programData: CreateProgramRequest | UpdateProgramRequest): void {
    if (this.programFormComponent) {
      this.programFormComponent.setSubmitting(true);
    }
    
    if (this.selectedProgram) {
      const updateData: UpdateProgramRequest = {
        ...programData as UpdateProgramRequest,
        programId: this.selectedProgram.programId
      };
      this.programService.updateProgram(this.selectedProgram.programId.toString(), updateData).subscribe({
        next: () => {
          if (this.programFormComponent) {
            this.programFormComponent.setSubmitting(false);
          }
          this.lookupService.clearCache();
          this.notificationService.success(
            'Program Updated',
            `Program "${updateData.programTitle}" has been successfully updated.`
          );
          this.onCloseProgramForm();
          this.loadPrograms();
        },
        error: (error) => {
          if (this.programFormComponent) {
            this.programFormComponent.setSubmitting(false);
            const errorMsg = error.error?.error?.message || error.message || 'Failed to update program. Please try again.';
            this.programFormComponent.setError(errorMsg);
            this.notificationService.error('Update Failed', errorMsg);
          }
          console.error('Error updating program:', error);
        }
      });
    } else {
      this.programService.createProgram(programData as CreateProgramRequest).subscribe({
        next: () => {
          if (this.programFormComponent) {
            this.programFormComponent.setSubmitting(false);
          }
          this.lookupService.clearCache();
          this.notificationService.success(
            'Program Created',
            `Program "${(programData as CreateProgramRequest).programTitle}" has been successfully created.`
          );
          this.onCloseProgramForm();
          this.loadPrograms();
        },
        error: (error) => {
          if (this.programFormComponent) {
            this.programFormComponent.setSubmitting(false);
            const errorMsg = error.error?.error?.message || error.message || 'Failed to create program. Please try again.';
            this.programFormComponent.setError(errorMsg);
            this.notificationService.error('Create Failed', errorMsg);
          }
          console.error('Error creating program:', error);
        }
      });
    }
  }

  formatDate = DateUtil.formatDate;

  protected loadData(): void {
    this.loadPrograms();
  }
}

