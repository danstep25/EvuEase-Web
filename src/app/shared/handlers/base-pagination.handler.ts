import { DEFAULT_PAGINATION } from '../constants/pagination.constant';
import { PaginationUtil } from '../utils/pagination.util';

export abstract class BasePaginationHandler {
  currentPage = DEFAULT_PAGINATION.pageIndex;
  pageSize = DEFAULT_PAGINATION.pageSize;
  totalRecords = 0;
  totalPages = 0;

  protected abstract loadData(): void;

  onPreviousPage(): void {
    if (this.currentPage > DEFAULT_PAGINATION.pageIndex) {
      this.currentPage--;
      this.loadData();
    }
  }

  onNextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadData();
    }
  }

  resetToFirstPage(): void {
    this.currentPage = DEFAULT_PAGINATION.pageIndex;
  }

  getDisplayRange(): string {
    return PaginationUtil.getDisplayRange(this.currentPage, this.pageSize, this.totalRecords);
  }

  updatePagination(total: number, totalPages: number, page: number): void {
    this.totalRecords = total;
    this.totalPages = totalPages;
    this.currentPage = page;
  }

  resetPagination(): void {
    this.totalRecords = 0;
    this.totalPages = 0;
    this.currentPage = DEFAULT_PAGINATION.pageIndex;
  }
}

