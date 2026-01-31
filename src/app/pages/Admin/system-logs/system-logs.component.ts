import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SystemLogsService, SystemLogStatistics } from './system-logs.service';
import { SystemLog } from '../../../shared/models/system-log.model';
import { LookupService } from '../../../shared/services/lookup.service';
import { PaginatedResponse } from '../../../core/models/api-response.model';
import { DateUtil } from '../../../shared/utils/date.util';
import { BadgeUtil } from '../../../shared/utils/badge.util';
import { FILTER_DEFAULTS } from '../../../shared/constants/filter.constant';
import { SYSTEM_ACTIONS } from '../../../shared/constants/action.constant';
import { SORT_DEFAULTS } from '../../../shared/constants/sort.constant';
import { DEFAULT_PAGINATION } from '../../../shared/constants/pagination.constant';
import { BasePaginationHandler } from '../../../shared/handlers/base-pagination.handler';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';


@Component({
  selector: 'app-system-logs',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './system-logs.component.html',
  styleUrl: './system-logs.component.scss'
})
export class SystemLogsComponent extends BasePaginationHandler implements OnInit, OnDestroy {
  private readonly systemLogsService = inject(SystemLogsService);
  private readonly lookupService = inject(LookupService);
  private readonly fb = inject(FormBuilder);
  private readonly destroy$ = new Subject<void>();

  readonly pageTitle = 'System Logs';
  readonly pageSubtitle = 'Audit trails for transparency and accountability';

  filterForm!: FormGroup;
  logs: SystemLog[] = [];
  isLoading = false;
  searchTerm = '';

  logStats: SystemLogStatistics = {
    total: 0,
    create: 0,
    update: 0,
    delete: 0
  };

  modules: string[] = [FILTER_DEFAULTS.ALL_MODULES];
  readonly actions = SYSTEM_ACTIONS;

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      search: [''],
      module: [FILTER_DEFAULTS.ALL_MODULES],
      action: [FILTER_DEFAULTS.ALL_ACTIONS],
      startDate: [''],
      endDate: ['']
    });

    this.filterForm.get('search')?.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      this.searchTerm = searchTerm || '';
      this.resetToFirstPage();
      this.loadLogs();
    });

    this.loadModules();
    this.loadLogStats();
    this.loadLogs();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadModules(): void {
    this.lookupService.getModules().subscribe({
      next: (moduleNames: string[]) => {
        this.modules = [FILTER_DEFAULTS.ALL_MODULES, ...moduleNames];
        
        if (this.filterForm) {
          const currentModule = this.filterForm.get('module')?.value;
          if (currentModule && !this.modules.includes(currentModule)) {
            this.filterForm.patchValue({ module: FILTER_DEFAULTS.ALL_MODULES });
          }
        }
      },
      error: (error: unknown) => {
        console.error('Error loading modules:', error);
        this.modules = [FILTER_DEFAULTS.ALL_MODULES];
      }
    });
  }

      loadLogStats(): void {
        this.systemLogsService.getLogStats().subscribe({
          next: (stats: SystemLogStatistics) => {
            this.logStats = stats;
          },
          error: (error: unknown) => {
            console.error('Error loading log stats:', error);
            this.logStats = { total: 0, create: 0, update: 0, delete: 0 };
          }
        });
      }

  loadLogs(): void {
    this.isLoading = true;
    const formValue = this.filterForm.value;
    
    const params = {
      PageIndex: this.currentPage,
      PageSize: this.pageSize,
      SortDirection: SORT_DEFAULTS.DIRECTION,
      SortKey: SORT_DEFAULTS.KEY_TIMESTAMP,
      searchTerm: this.searchTerm || '',
      module: formValue.module !== FILTER_DEFAULTS.ALL_MODULES ? formValue.module : undefined,
      action: formValue.action !== FILTER_DEFAULTS.ALL_ACTIONS ? formValue.action : undefined,
      startDate: formValue.startDate || undefined,
      endDate: formValue.endDate || undefined
    };

    this.systemLogsService.getLogs(params).subscribe({
      next: (response: PaginatedResponse<SystemLog>) => {
        if (response.success && response.data) {
          this.logs = response.data;
          
          if (response.pagination) {
            this.updatePagination(
              response.pagination.total,
              response.pagination.totalPages,
              response.pagination.page
            );
          }
        } else {
          this.logs = [];
          this.resetPagination();
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading logs:', error);
        this.isLoading = false;
        this.logs = [];
        this.resetPagination();
      }
    });
  }

  onFilterChange(): void {
    this.resetToFirstPage();
    this.loadLogs();
  }

  getRoleBadgeClass = BadgeUtil.getRoleBadgeClass;
  getActionBadgeClass = BadgeUtil.getActionBadgeClass;
  formatTimestamp = DateUtil.formatTimestamp;

  protected loadData(): void {
    this.loadLogs();
  }
}

