export interface IResponse<T = any> {
  status: string;
  message: string;
  data: T;
  code: number;
}

export interface IRequest<T> {
  request: T;
}

interface IPaginationBase {
  pageIndex: number;
  pageSize: number;
  isRefresh?: boolean;
}

interface ISortBase {
  sortKey?: string;
  sortDirection?: string;
}

interface ISearchFilterBase {
  searchValue?: string;
}

export interface IPagination<T> extends IPaginationBase, IResponse<T> {
  totalRecords: number;
  totalPages: number;
  totalEntries: number;
}

export interface IPaginationFilterBase extends IPaginationBase, ISortBase, ISearchFilterBase {}




