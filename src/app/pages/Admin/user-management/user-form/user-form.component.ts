import { Component, OnInit, OnChanges, SimpleChanges, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { User, CreateUserRequest, UpdateUserRequest } from '../../../../core/models/user.model';
import { USER_ROLES, ROLE_MAP, DEFAULT_ROLE } from '../../../../shared/constants/role.constant';
import { USER_STATUSES, STATUS_MAP, DEFAULT_STATUS } from '../../../../shared/constants/status.constant';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.scss'
})
export class UserFormComponent implements OnInit, OnChanges {
  private readonly fb = inject(FormBuilder);

  @Input() user: User | null = null;
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<CreateUserRequest | UpdateUserRequest>();

  userForm!: FormGroup;
  isSubmitting = false;
  errorMessage: string | null = null;

  roles = USER_ROLES;
  statuses = USER_STATUSES;

  private getRoleNumber(role: string): number {
    return ROLE_MAP[role] ?? ROLE_MAP[DEFAULT_ROLE];
  }

  private getStatusNumber(status: string): number {
    return STATUS_MAP[status] ?? STATUS_MAP[DEFAULT_STATUS];
  }

  get isEditMode(): boolean {
    return !!this.user;
  }

  get title(): string {
    return this.isEditMode ? 'Edit User' : 'Add New User';
  }

  get submitButtonText(): string {
    if (this.isSubmitting) {
      return this.isEditMode ? 'Updating...' : 'Adding...';
    }
    return this.isEditMode ? 'Update User' : 'Add User';
  }

  ngOnInit(): void {
    this.initializeForm();
  }

  ngOnChanges(): void {
    if (this.isOpen) {
      this.initializeForm();
    }
  }

  private initializeForm(): void {
    const passwordValidators = this.isEditMode ? [] : [Validators.required, Validators.minLength(6)];
    
    this.userForm = this.fb.group({
      fullName: [this.user?.name || '', [Validators.required]],
      email: [this.user?.email || '', [Validators.required, Validators.email]],
      password: ['', passwordValidators],
      role: [this.getUserRole() || DEFAULT_ROLE, [Validators.required]],
      status: [this.getUserStatus(), [Validators.required]]
    });
    this.errorMessage = null;
  }

  private getUserRole(): string {
    if (!this.user?.role) return DEFAULT_ROLE;
    const role = this.user.role;
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  }

  private getUserStatus(): string {
    if (typeof this.user?.status === 'number') {
      return this.user.status === STATUS_MAP['Active'] ? DEFAULT_STATUS : USER_STATUSES[1];
    }
    if (this.user?.isActive !== undefined) {
      return this.user.isActive ? DEFAULT_STATUS : USER_STATUSES[1];
    }
    if (typeof this.user?.status === 'string') {
      return this.user.status;
    }
    return DEFAULT_STATUS;
  }

  onClose(): void {
    this.userForm.reset({
      fullName: '',
      email: '',
      password: '',
      role: DEFAULT_ROLE,
      status: DEFAULT_STATUS
    });
    this.errorMessage = null;
    this.close.emit();
  }

  onSubmit(): void {
    if (this.userForm.invalid) {
      this.markFormGroupTouched(this.userForm);
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;

    const formValue = this.userForm.value;
    
    if (this.isEditMode) {
      // For edit mode, use UpdateUserRequest format matching backend
      if (!this.user) {
        this.errorMessage = 'User information is missing';
        this.isSubmitting = false;
        return;
      }
      const updateUserData: UpdateUserRequest = {
        id: this.user.id,
        fullName: formValue.fullName,
        email: formValue.email,
        role: this.getRoleNumber(formValue.role),
        status: this.getStatusNumber(formValue.status)
      };
      this.save.emit(updateUserData);
    } else {
      // For create mode, use CreateUserRequest format matching backend
      // Backend expects role and status as numbers
      const createUserData: CreateUserRequest = {
        fullName: formValue.fullName,
        email: formValue.email,
        password: formValue.password,
        role: this.getRoleNumber(formValue.role),
        status: this.getStatusNumber(formValue.status)
      };
      this.save.emit(createUserData);
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  get formControls() {
    return {
      fullName: this.userForm.get('fullName'),
      email: this.userForm.get('email'),
      password: this.userForm.get('password'),
      role: this.userForm.get('role'),
      status: this.userForm.get('status')
    };
  }

  setSubmitting(value: boolean): void {
    this.isSubmitting = value;
  }

  setError(message: string | null): void {
    this.errorMessage = message;
  }
}

