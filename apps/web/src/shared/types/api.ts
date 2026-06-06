export type ApiResponse<T> = {
    success: boolean;
    message: string;
    data: T;
}

export type ApiError = {
  success: false;
  message: string;
  errors?: Array<{
    field?: string;
    message: string;
  }>;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PaginatedResponse<T> = {
  items: T[];
  meta: PaginationMeta;
};