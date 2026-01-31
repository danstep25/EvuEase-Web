export class PaginationUtil {
  static getDisplayRange(currentPage: number, pageSize: number, totalRecords: number): string {
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, totalRecords);
    return `${start} to ${end} of ${totalRecords}`;
  }

  static buildPaginationParams(params?: {
    PageIndex?: number;
    PageSize?: number;
    SortDirection?: string;
    SortKey?: string;
    searchTerm?: string;
    [key: string]: string | number | undefined;
  }): {
    PageIndex: number;
    PageSize: number;
    SortDirection: string;
    SortKey: string;
    searchTerm: string;
    [key: string]: string | number;
  } {
    return {
      PageIndex: params?.PageIndex ?? 1,
      PageSize: params?.PageSize ?? 10,
      SortDirection: params?.SortDirection ?? 'desc',
      SortKey: params?.SortKey ?? '',
      searchTerm: params?.searchTerm ?? '',
      ...Object.fromEntries(
        Object.entries(params || {}).filter(([key]) => 
          !['PageIndex', 'PageSize', 'SortDirection', 'SortKey', 'searchTerm'].includes(key)
        )
      )
    };
  }
}

