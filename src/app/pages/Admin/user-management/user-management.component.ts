import { Component, OnInit, OnDestroy, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from './user.service';
import { User, CreateUserRequest, UpdateUserRequest } from '../../../core/models/user.model';
import { PaginatedResponse } from '../../../core/models/api-response.model';
import { DateUtil } from '../../../shared/utils/date.util';
import { BadgeUtil } from '../../../shared/utils/badge.util';
import { DEFAULT_PAGINATION } from '../../../shared/constants/pagination.constant';
import { SORT_DEFAULTS } from '../../../shared/constants/sort.constant';
import { USER_STATUSES, STATUS_MAP, DEFAULT_STATUS } from '../../../shared/constants/status.constant';
import { BasePaginationHandler } from '../../../shared/handlers/base-pagination.handler';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { UserFormComponent } from './user-form/user-form.component';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, UserFormComponent],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.scss'
})
export class UserManagementComponent extends BasePaginationHandler implements OnInit, OnDestroy {
  private readonly userService = inject(UserService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  pageTitle = 'User Management';
  pageSubtitle = 'Manage system users and role-based access control';

  @ViewChild(UserFormComponent) userFormComponent!: UserFormComponent;

  searchForm!: FormGroup;
  users: User[] = [];
  filteredUsers: User[] = [];
  isLoading = false;
  searchTerm = '';
  showUserForm = false;
  selectedUser: User | null = null;

  ngOnInit(): void {
    this.searchForm = this.fb.group({
      search: ['']
    });

    // Debounce search input with delay (500ms)
    this.searchForm.get('search')?.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      this.searchTerm = searchTerm || '';
      this.resetToFirstPage();
      this.loadUsers();
    });

    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUsers(): void {
    this.isLoading = true;
    const params = {
      PageIndex: this.currentPage,
      PageSize: this.pageSize,
      SortDirection: SORT_DEFAULTS.DIRECTION,
      SortKey: '',
      searchTerm: this.searchTerm || ''
    };

    this.userService.getUsers(params).subscribe({
      next: (response: PaginatedResponse<User>) => {
        if (response.success && response.data) {
          this.users = response.data.map(user => ({
            ...user,
            fullName: user.name // Use name directly from API
          }));
          // No need for filteredUsers since API handles filtering
          this.filteredUsers = [...this.users];
          
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
            console.error('Error loading users:', error);
            this.isLoading = false;
            this.users = [];
            this.filteredUsers = [];
            this.resetPagination();
          }
    });
  }

  getRoleBadgeClass = BadgeUtil.getRoleBadgeClass;

  getStatusText(user: User): string {
    if (typeof user.status === 'number') {
      return user.status === STATUS_MAP['Active'] ? DEFAULT_STATUS : USER_STATUSES[1];
    }
    if (user.isActive !== undefined) {
      return user.isActive ? DEFAULT_STATUS : USER_STATUSES[1];
    }
    if (typeof user.status === 'string') {
      return user.status;
    }
    return DEFAULT_STATUS;
  }

  getStatusBadgeClass(user: User): string {
    return BadgeUtil.getStatusBadgeClass(user.status);
  }


  onAddUser(): void {
    this.selectedUser = null;
    this.showUserForm = true;
  }

  onEditUser(user: User): void {
    this.selectedUser = user;
    this.showUserForm = true;
  }

  onCloseUserForm(): void {
    this.showUserForm = false;
    this.selectedUser = null;
  }

  onSaveUser(userData: CreateUserRequest | UpdateUserRequest): void {
    if (this.userFormComponent) {
      this.userFormComponent.setSubmitting(true);
    }
    
    if (this.selectedUser) {
      // Update existing user - userData is already in UpdateUserRequest format
      this.userService.updateUser(this.selectedUser.id.toString(), userData as UpdateUserRequest).subscribe({
        next: () => {
          if (this.userFormComponent) {
            this.userFormComponent.setSubmitting(false);
          }
          this.onCloseUserForm();
          this.loadUsers();
        },
        error: (error) => {
          if (this.userFormComponent) {
            this.userFormComponent.setSubmitting(false);
            this.userFormComponent.setError(error.userMessage || error.message || 'Failed to update user. Please try again.');
          }
          console.error('Error updating user:', error);
        }
      });
    } else {
      // Create new user - userData is already in CreateUserRequest format
      this.userService.createUser(userData as CreateUserRequest).subscribe({
        next: () => {
          if (this.userFormComponent) {
            this.userFormComponent.setSubmitting(false);
          }
          this.onCloseUserForm();
          this.loadUsers();
        },
        error: (error) => {
          if (this.userFormComponent) {
            this.userFormComponent.setSubmitting(false);
            this.userFormComponent.setError(error.userMessage || error.message || 'Failed to create user. Please try again.');
          }
          console.error('Error creating user:', error);
        }
      });
    }
  }

  formatDate = DateUtil.formatDate;

  protected loadData(): void {
    this.loadUsers();
  }
}

